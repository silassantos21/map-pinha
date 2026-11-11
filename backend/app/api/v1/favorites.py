import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.v1.pois import _to_read
from app.core.security import require_internal_secret_or_mobile_user
from app.db.session import get_db
from app.models.favorite import Favorite
from app.models.poi import POI
from app.schemas.poi import POIRead

router = APIRouter()


@router.get("/favorites", response_model=list[POIRead])
def list_favorites(
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
    user_id: uuid.UUID | None = None,
):
    actor_id = mobile_user_id if mobile_user_id is not None else user_id
    stmt = (
        select(POI)
        .join(Favorite, Favorite.poi_id == POI.id)
        .where(Favorite.user_id == actor_id)
        .options(selectinload(POI.media), selectinload(POI.owner))
        .order_by(Favorite.created_at.desc())
    )
    pois = db.scalars(stmt).unique().all()
    return [_to_read(poi) for poi in pois]


@router.post("/pois/{poi_id}/favorite", status_code=status.HTTP_204_NO_CONTENT)
def add_favorite(
    poi_id: uuid.UUID,
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
    user_id: uuid.UUID | None = None,
):
    actor_id = mobile_user_id if mobile_user_id is not None else user_id
    if db.get(POI, poi_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="POI not found")

    exists = db.scalar(
        select(Favorite).where(Favorite.user_id == actor_id, Favorite.poi_id == poi_id)
    )
    if exists is None:
        db.add(Favorite(user_id=actor_id, poi_id=poi_id))
        db.commit()


@router.delete("/pois/{poi_id}/favorite", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    poi_id: uuid.UUID,
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
    user_id: uuid.UUID | None = None,
):
    actor_id = mobile_user_id if mobile_user_id is not None else user_id
    existing = db.scalar(
        select(Favorite).where(Favorite.user_id == actor_id, Favorite.poi_id == poi_id)
    )
    if existing is not None:
        db.delete(existing)
        db.commit()
