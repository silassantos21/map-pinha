import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from geoalchemy2 import Geometry
from geoalchemy2.elements import WKTElement
from geoalchemy2.shape import to_shape
from sqlalchemy import cast, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.api.v1.auth import verify_internal_secret
from app.core.media_processing import generate_image_thumbnail
from app.core.storage import build_public_url, delete_object_by_public_url
from app.db.session import get_db
from app.models.category import Category
from app.models.poi import POI
from app.models.poi_media import MediaType, POIMedia
from app.models.poi_reaction import PoiReaction
from app.schemas.media import POIMediaCreate, POIMediaRead
from app.schemas.poi import POICreate, POIRead, POIUpdate, ReactionToggle
from app.utils.slug import slugify_unique

router = APIRouter()


def _with_relations(stmt):
    return stmt.options(
        selectinload(POI.media),
        selectinload(POI.reactions).selectinload(PoiReaction.user),
    )


def _serialize(poi: POI) -> dict:
    point = to_shape(poi.location)
    return {
        "id": poi.id,
        "user_id": poi.user_id,
        "category_id": poi.category_id,
        "name": poi.name,
        "slug": poi.slug,
        "description": poi.description,
        "address": poi.address,
        "lat": point.y,
        "lng": point.x,
        "is_public": poi.is_public,
        "created_at": poi.created_at,
        "updated_at": poi.updated_at,
        "media": poi.media,
        "reactions": [
            {"emoji": r.emoji, "user_id": r.user_id, "user_name": r.user.name}
            for r in poi.reactions
        ],
    }


def _to_read(poi: POI) -> POIRead:
    return POIRead.model_validate(_serialize(poi))


@router.get(
    "/pois",
    response_model=list[POIRead],
    dependencies=[Depends(verify_internal_secret)],
)
def list_pois(
    db: Session = Depends(get_db),
    min_lat: float | None = Query(default=None, ge=-90, le=90),
    min_lng: float | None = Query(default=None, ge=-180, le=180),
    max_lat: float | None = Query(default=None, ge=-90, le=90),
    max_lng: float | None = Query(default=None, ge=-180, le=180),
    category_slug: str | None = None,
    q: str | None = None,
    user_id: uuid.UUID | None = None,
    mine_only: bool = False,
):
    """Lista POIs visíveis: públicos de qualquer usuário + privados do próprio
    `user_id` (quando informado). Filtra por bounding box do mapa (pan/zoom),
    categoria e busca textual por nome — todos opcionais e combináveis.
    Com `mine_only=true`, ignora os públicos de outros usuários e devolve só
    os POIs do próprio `user_id` (usado pelo painel "Meus POIs").

    Atrás do segredo interno (`verify_internal_secret`): só o BFF do Next.js
    pode chamar este endpoint, e é ele quem resolve `user_id` a partir da
    sessão autenticada — o parâmetro nunca deve vir direto do navegador,
    senão qualquer um poderia passar o UUID de outra pessoa e ver POIs
    privados que não são dela.
    """
    stmt = _with_relations(select(POI))

    if None not in (min_lat, min_lng, max_lat, max_lng):
        envelope = func.ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
        stmt = stmt.where(func.ST_Intersects(cast(POI.location, Geometry), envelope))

    if category_slug:
        stmt = stmt.join(Category, POI.category_id == Category.id).where(
            Category.slug == category_slug
        )

    if q:
        stmt = stmt.where(POI.name.ilike(f"%{q}%"))

    if mine_only:
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="user_id is required when mine_only=true",
            )
        stmt = stmt.where(POI.user_id == user_id)
    elif user_id:
        stmt = stmt.where(or_(POI.is_public.is_(True), POI.user_id == user_id))
    else:
        stmt = stmt.where(POI.is_public.is_(True))

    pois = db.scalars(stmt).unique().all()
    return [_to_read(poi) for poi in pois]


@router.get(
    "/pois/{poi_id}",
    response_model=POIRead,
    dependencies=[Depends(verify_internal_secret)],
)
def get_poi(poi_id: uuid.UUID, user_id: uuid.UUID | None = None, db: Session = Depends(get_db)):
    poi = db.scalar(_with_relations(select(POI)).where(POI.id == poi_id))
    if poi is None or not (poi.is_public or poi.user_id == user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="POI not found")

    return _to_read(poi)


@router.post(
    "/pois",
    response_model=POIRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verify_internal_secret)],
)
def create_poi(payload: POICreate, db: Session = Depends(get_db)):
    if db.get(Category, payload.category_id) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category_id")

    poi = POI(
        user_id=payload.user_id,
        category_id=payload.category_id,
        name=payload.name,
        slug=slugify_unique(db, payload.name),
        description=payload.description,
        address=payload.address,
        location=WKTElement(f"POINT({payload.lng} {payload.lat})", srid=4326),
        is_public=payload.is_public,
    )
    db.add(poi)
    db.commit()
    db.refresh(poi)
    return _to_read(poi)


@router.put(
    "/pois/{poi_id}",
    response_model=POIRead,
    dependencies=[Depends(verify_internal_secret)],
)
def update_poi(poi_id: uuid.UUID, payload: POIUpdate, db: Session = Depends(get_db)):
    poi = db.scalar(_with_relations(select(POI)).where(POI.id == poi_id))
    if poi is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="POI not found")
    if poi.user_id != payload.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the owner of this POI")

    data = payload.model_dump(exclude={"user_id", "lat", "lng"}, exclude_unset=True)

    if payload.lat is not None or payload.lng is not None:
        current_point = to_shape(poi.location)
        lat = payload.lat if payload.lat is not None else current_point.y
        lng = payload.lng if payload.lng is not None else current_point.x
        poi.location = WKTElement(f"POINT({lng} {lat})", srid=4326)

    if "category_id" in data and db.get(Category, data["category_id"]) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category_id")

    for field, value in data.items():
        setattr(poi, field, value)

    db.commit()
    db.refresh(poi)
    return _to_read(poi)


@router.delete(
    "/pois/{poi_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(verify_internal_secret)],
)
def delete_poi(poi_id: uuid.UUID, user_id: uuid.UUID, db: Session = Depends(get_db)):
    poi = db.get(POI, poi_id)
    if poi is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="POI not found")
    if poi.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the owner of this POI")

    db.delete(poi)
    db.commit()


@router.post(
    "/pois/{poi_id}/media",
    response_model=POIMediaRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verify_internal_secret)],
)
def attach_poi_media(poi_id: uuid.UUID, payload: POIMediaCreate, db: Session = Depends(get_db)):
    poi = db.get(POI, poi_id)
    if poi is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="POI not found")
    if poi.user_id != payload.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the owner of this POI")

    thumbnail_url = None
    if payload.media_type == MediaType.image:
        thumbnail_url = generate_image_thumbnail(payload.object_key)

    media = POIMedia(
        poi_id=poi.id,
        media_type=payload.media_type,
        url=build_public_url(payload.object_key),
        thumbnail_url=thumbnail_url,
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    return media


@router.delete(
    "/pois/{poi_id}/media/{media_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(verify_internal_secret)],
)
def delete_poi_media(
    poi_id: uuid.UUID, media_id: uuid.UUID, user_id: uuid.UUID, db: Session = Depends(get_db)
):
    poi = db.get(POI, poi_id)
    if poi is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="POI not found")
    if poi.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the owner of this POI")

    media = db.get(POIMedia, media_id)
    if media is None or media.poi_id != poi.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")

    delete_object_by_public_url(media.url)
    if media.thumbnail_url:
        delete_object_by_public_url(media.thumbnail_url)

    db.delete(media)
    db.commit()


@router.post(
    "/pois/{poi_id}/reactions",
    response_model=POIRead,
    dependencies=[Depends(verify_internal_secret)],
)
def toggle_reaction(poi_id: uuid.UUID, payload: ReactionToggle, db: Session = Depends(get_db)):
    """Alterna (adiciona/remove) a reação do usuário com esse emoji nesse POI.
    Um usuário pode reagir com vários emojis diferentes ao mesmo POI — cada
    emoji é independente (clicar de novo no mesmo remove só aquele)."""
    poi = db.get(POI, poi_id)
    if poi is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="POI not found")

    existing = db.scalar(
        select(PoiReaction).where(
            PoiReaction.poi_id == poi_id,
            PoiReaction.user_id == payload.user_id,
            PoiReaction.emoji == payload.emoji,
        )
    )
    if existing is not None:
        db.delete(existing)
    else:
        db.add(PoiReaction(poi_id=poi_id, user_id=payload.user_id, emoji=payload.emoji))
    db.commit()

    poi = db.scalar(_with_relations(select(POI)).where(POI.id == poi_id))
    return _to_read(poi)
