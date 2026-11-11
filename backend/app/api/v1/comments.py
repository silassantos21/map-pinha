import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.v1.pois import _poi_visible_to
from app.core.security import require_internal_secret_or_mobile_user
from app.db.session import get_db
from app.models.comment import Comment
from app.models.notification import Notification, NotificationType
from app.models.poi import POI
from app.schemas.comment import CommentCreate, CommentListRead, CommentRead

router = APIRouter()


def _to_read(comment: Comment) -> CommentRead:
    return CommentRead(
        id=comment.id,
        poi_id=comment.poi_id,
        user_id=comment.user_id,
        user_name=comment.user.name,
        user_avatar_url=comment.user.avatar_choice_url or comment.user.avatar_url,
        body=comment.body,
        created_at=comment.created_at,
    )


@router.get("/pois/{poi_id}/comments", response_model=CommentListRead)
def list_comments(
    poi_id: uuid.UUID,
    viewer_id: uuid.UUID | None = None,
    limit: int = Query(default=20, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
):
    if mobile_user_id is not None:
        viewer_id = mobile_user_id
    poi = db.get(POI, poi_id)
    if poi is None or not _poi_visible_to(poi, viewer_id, db):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="POI not found")

    base_filter = (Comment.poi_id == poi_id, Comment.deleted_at.is_(None))
    # `ORDER BY created_at DESC, id DESC`: mesmo tiebreak determinístico já
    # usado em `list_notifications` — comentários criados no mesmo instante
    # não podem trocar de ordem entre páginas. Paginação por `limit`
    # crescente (não `offset` por página), mesma lição do sininho.
    stmt = (
        select(Comment)
        .where(*base_filter)
        .options(selectinload(Comment.user))
        .order_by(Comment.created_at.desc(), Comment.id.desc())
        .limit(limit)
        .offset(offset)
    )
    comments = db.scalars(stmt).all()
    total = db.scalar(select(func.count(Comment.id)).where(*base_filter)) or 0

    return CommentListRead(items=[_to_read(c) for c in comments], total=total)


@router.post("/pois/{poi_id}/comments", response_model=CommentRead)
def create_comment(
    poi_id: uuid.UUID,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
):
    actor_id = mobile_user_id if mobile_user_id is not None else payload.user_id
    poi = db.get(POI, poi_id)
    if poi is None or not _poi_visible_to(poi, actor_id, db):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="POI not found")

    comment = Comment(poi_id=poi_id, user_id=actor_id, body=payload.body)
    db.add(comment)

    # Notifica o dono do POI só se não for autocomentário — mesmo padrão de
    # `toggle_reaction` em `pois.py`.
    if poi.user_id != actor_id:
        db.add(
            Notification(
                user_id=poi.user_id,
                type=NotificationType.poi_comment,
                actor_id=actor_id,
                poi_id=poi.id,
                payload={"poi_name": poi.name, "body_preview": payload.body[:140]},
            )
        )

    db.commit()
    db.refresh(comment)
    return _to_read(comment)


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: uuid.UUID,
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
    user_id: uuid.UUID | None = None,
):
    user_id = mobile_user_id if mobile_user_id is not None else user_id
    comment = db.get(Comment, comment_id)
    if comment is None or comment.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    poi = db.get(POI, comment.poi_id)
    is_author = comment.user_id == user_id
    is_poi_owner = poi is not None and poi.user_id == user_id
    if not is_author and not is_poi_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the comment's author or the POI's owner can delete it",
        )

    comment.deleted_at = func.now()
    db.commit()
