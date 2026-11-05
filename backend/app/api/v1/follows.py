import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.v1.auth import verify_internal_secret
from app.db.session import get_db
from app.models.follow import Follow
from app.models.notification import Notification, NotificationType
from app.models.user import User
from app.schemas.follow import FollowListRead
from app.schemas.user import UserPublicRead

router = APIRouter(dependencies=[Depends(verify_internal_secret)])


def _to_public(user: User, viewer_id: uuid.UUID | None, db: Session) -> UserPublicRead:
    is_following = None
    if viewer_id is not None and viewer_id != user.id:
        is_following = db.scalar(
            select(Follow.id).where(Follow.follower_id == viewer_id, Follow.followed_id == user.id)
        ) is not None
    return UserPublicRead(
        id=user.id,
        name=user.name,
        avatar_url=user.avatar_url,
        avatar_choice_url=user.avatar_choice_url,
        is_following=is_following,
    )


@router.post("/users/{user_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
def follow_user(user_id: uuid.UUID, follower_id: uuid.UUID, db: Session = Depends(get_db)):
    if follower_id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot follow yourself")
    if db.get(User, user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    existing = db.scalar(
        select(Follow).where(Follow.follower_id == follower_id, Follow.followed_id == user_id)
    )
    if existing is None:
        db.add(Follow(follower_id=follower_id, followed_id=user_id))
        db.add(
            Notification(
                user_id=user_id,
                type=NotificationType.new_follower,
                actor_id=follower_id,
                payload={},
            )
        )
        db.commit()


@router.delete("/users/{user_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
def unfollow_user(user_id: uuid.UUID, follower_id: uuid.UUID, db: Session = Depends(get_db)):
    existing = db.scalar(
        select(Follow).where(Follow.follower_id == follower_id, Follow.followed_id == user_id)
    )
    if existing is not None:
        db.delete(existing)
        db.commit()


@router.get("/users/{user_id}/followers", response_model=FollowListRead)
def list_followers(
    user_id: uuid.UUID,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    viewer_id: uuid.UUID | None = None,
    db: Session = Depends(get_db),
):
    stmt = (
        select(User)
        .join(Follow, Follow.follower_id == User.id)
        .where(Follow.followed_id == user_id)
        .order_by(Follow.created_at.desc(), User.id)
        .limit(limit)
        .offset(offset)
    )
    users = db.scalars(stmt).all()
    total = db.scalar(select(func.count(Follow.id)).where(Follow.followed_id == user_id)) or 0
    return FollowListRead(items=[_to_public(u, viewer_id, db) for u in users], total=total)


@router.get("/users/{user_id}/following", response_model=FollowListRead)
def list_following(
    user_id: uuid.UUID,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    viewer_id: uuid.UUID | None = None,
    db: Session = Depends(get_db),
):
    stmt = (
        select(User)
        .join(Follow, Follow.followed_id == User.id)
        .where(Follow.follower_id == user_id)
        .order_by(Follow.created_at.desc(), User.id)
        .limit(limit)
        .offset(offset)
    )
    users = db.scalars(stmt).all()
    total = db.scalar(select(func.count(Follow.id)).where(Follow.follower_id == user_id)) or 0
    return FollowListRead(items=[_to_public(u, viewer_id, db) for u in users], total=total)


@router.get("/users/search", response_model=list[UserPublicRead])
def search_users(
    q: str = Query(min_length=1, max_length=100),
    viewer_id: uuid.UUID | None = None,
    limit: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Busca/descoberta de usuários (Fase 7) — nunca seleciona `User.email`,
    só nome/avatar/id. Exclui o próprio `viewer_id` dos resultados."""
    stmt = select(User).where(User.name.ilike(f"%{q}%")).order_by(User.id).limit(limit)
    if viewer_id is not None:
        stmt = stmt.where(User.id != viewer_id)
    users = db.scalars(stmt).all()
    return [_to_public(u, viewer_id, db) for u in users]
