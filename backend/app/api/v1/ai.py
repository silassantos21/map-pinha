import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.v1.auth import verify_internal_secret
from app.core.rate_limit import enforce_ai_rate_limit
from app.db.session import get_db
from app.models.ai_feedback import AiFeedback
from app.models.category import Category
from app.models.poi import POI
from app.schemas.ai import AiSuggestionAction, BioGenerateRequest, BioGenerateResponse
from app.services import ai_agents

router = APIRouter()


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
