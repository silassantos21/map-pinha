import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from geoalchemy2 import Geography
from geoalchemy2.shape import to_shape
from sqlalchemy import cast, func, select
from sqlalchemy.orm import Session

from app.api.v1.auth import verify_internal_secret
from app.core.cache import cache_get, cache_set
from app.core.rate_limit import enforce_ai_rate_limit
from app.db.session import get_db
from app.models.ai_feedback import AiFeedback
from app.models.category import Category
from app.models.poi import POI
from app.schemas.ai import (
    AiFeedbackCreate,
    AiSuggestionAction,
    BioGenerateRequest,
    BioGenerateResponse,
    RecommendationRead,
)
from app.services import ai_agents

router = APIRouter()

_RECOMMENDATION_RADIUS_M = 2000
_RECOMMENDATION_CANDIDATE_LIMIT = 40
_RECOMMENDATION_CACHE_TTL_SECONDS = 600


@router.post(
    "/pois/generate-bio",
    response_model=BioGenerateResponse,
    dependencies=[Depends(verify_internal_secret)],
)
def generate_bio(payload: BioGenerateRequest):
    """POIBioWriterAgent — chamado sincronamente pelo botão 'Gerar descrição
    com IA' no formulário de criação/edição de POI."""
    enforce_ai_rate_limit(payload.user_id, "bio", limit=30)
    bio = ai_agents.generate_poi_bio(
        payload.name, payload.category_name, payload.address, payload.user_notes
    )
    if bio is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Não foi possível gerar a descrição agora",
        )
    return BioGenerateResponse(bio=bio)


@router.get(
    "/ai/recommendations",
    response_model=list[RecommendationRead],
    dependencies=[Depends(verify_internal_secret)],
)
def get_recommendations(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    user_id: uuid.UUID = Query(...),
    db: Session = Depends(get_db),
):
    """NearbyRecommenderAgent — acionado ao abrir o painel 'Explorar'.
    Cacheado por 10min (posição arredondada a ~100m) pra não gerar uma
    chamada nova à IA a cada abertura do painel, e limitado por usuário/dia."""
    cache_key = f"ai_recommend:{user_id}:{lat:.3f},{lng:.3f}"
    cached = cache_get(cache_key)
    if cached is not None:
        return [RecommendationRead.model_validate(item) for item in json.loads(cached)]

    enforce_ai_rate_limit(user_id, "recommend", limit=20)

    origin = cast(func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326), Geography)
    stmt = (
        select(POI, Category.name)
        .join(Category, POI.category_id == Category.id)
        .where(func.ST_DWithin(POI.location, origin, _RECOMMENDATION_RADIUS_M))
        .where(POI.is_public.is_(True))
        .limit(_RECOMMENDATION_CANDIDATE_LIMIT)
    )
    rows = db.execute(stmt).all()
    if not rows:
        return []

    candidates_by_id: dict[str, tuple[POI, str]] = {}
    nearby_payload = []
    for poi, category_name in rows:
        point = to_shape(poi.location)
        candidates_by_id[str(poi.id)] = (poi, category_name)
        nearby_payload.append({
            "poi_id": str(poi.id),
            "name": poi.name,
            "category": category_name,
            "description": poi.description,
        })

    suggestions = ai_agents.recommend_nearby(
        lat, lng, nearby_payload, datetime.now(timezone.utc).isoformat()
    )

    results = []
    for suggestion in suggestions:
        candidate = candidates_by_id.get(suggestion.poi_id)
        if candidate is None:
            continue  # defesa contra a IA inventar um poi_id fora da lista
        poi, category_name = candidate
        point = to_shape(poi.location)
        results.append(RecommendationRead(
            poi_id=poi.id,
            poi_name=poi.name,
            poi_lat=point.y,
            poi_lng=point.x,
            category_name=category_name,
            reason=suggestion.reason,
            priority_score=suggestion.priority_score,
        ))

    cache_set(
        cache_key,
        json.dumps([r.model_dump(mode="json") for r in results]),
        _RECOMMENDATION_CACHE_TTL_SECONDS,
    )
    return results


def _clear_ai_suggestion(poi: POI) -> None:
    poi.ai_category_slug = None
    poi.ai_icon_name = None
    poi.ai_color_hex = None
    poi.ai_confidence = None
    poi.ai_reasoning = None


@router.post(
    "/pois/{poi_id}/ai-suggestion/accept",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(verify_internal_secret)],
)
def accept_ai_suggestion(poi_id: uuid.UUID, payload: AiSuggestionAction, db: Session = Depends(get_db)):
    poi = db.get(POI, poi_id)
    if poi is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="POI not found")
    if poi.user_id != payload.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the owner of this POI")
    if poi.ai_category_slug is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No pending AI suggestion")

    category = db.scalar(select(Category).where(Category.slug == poi.ai_category_slug))
    if category is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Suggested category no longer exists")

    poi.category_id = category.id
    # Ícone livre só faz sentido mesmo na categoria "outros" — nas demais, o
    # ícone fixo da categoria já resolve (mesma regra do formulário manual).
    poi.icon_name = poi.ai_icon_name if poi.ai_category_slug == "outros" else None
    db.add(AiFeedback(user_id=payload.user_id, poi_id=poi.id, agent="categorizer", useful=True))
    _clear_ai_suggestion(poi)
    db.commit()


@router.post(
    "/pois/{poi_id}/ai-suggestion/dismiss",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(verify_internal_secret)],
)
def dismiss_ai_suggestion(poi_id: uuid.UUID, payload: AiSuggestionAction, db: Session = Depends(get_db)):
    poi = db.get(POI, poi_id)
    if poi is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="POI not found")
    if poi.user_id != payload.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the owner of this POI")
    if poi.ai_category_slug is None:
        return  # nada pendente — dispensar de novo é inofensivo (idempotente)

    db.add(AiFeedback(user_id=payload.user_id, poi_id=poi.id, agent="categorizer", useful=False))
    _clear_ai_suggestion(poi)
    db.commit()


@router.post(
    "/ai/feedback",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(verify_internal_secret)],
)
def submit_ai_feedback(payload: AiFeedbackCreate, db: Session = Depends(get_db)):
    """Avaliação útil/não útil num card do painel 'Explorar' (NearbyRecommenderAgent).
    Fica registrada pra análise futura — nesta sprint ainda não alimenta um
    ajuste automático das próximas recomendações, ver SPRINTS.md."""
    if db.get(POI, payload.poi_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="POI not found")
    db.add(AiFeedback(
        user_id=payload.user_id, poi_id=payload.poi_id, agent=payload.agent, useful=payload.useful
    ))
    db.commit()
