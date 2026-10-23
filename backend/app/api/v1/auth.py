from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserRead, UserSyncRequest

router = APIRouter()


def verify_internal_secret(x_internal_secret: str = Header(default="")) -> None:
    if not settings.internal_api_secret or x_internal_secret != settings.internal_api_secret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid internal secret")


@router.post(
    "/auth/sync",
    response_model=UserRead,
    dependencies=[Depends(verify_internal_secret)],
)
def sync_user(payload: UserSyncRequest, db: Session = Depends(get_db)):
    """Get-or-create do usuário a partir do login Google (chamado pelo NextAuth)."""
    user = db.scalar(select(User).where(User.google_id == payload.google_id))

    if user is None:
        user = db.scalar(select(User).where(User.email == payload.email))

    if user is None:
        user = User(
            email=payload.email,
            name=payload.name,
            avatar_url=payload.avatar_url,
            google_id=payload.google_id,
        )
        db.add(user)
    else:
        user.google_id = payload.google_id
        user.name = payload.name or user.name
        user.avatar_url = payload.avatar_url or user.avatar_url

    db.commit()
    db.refresh(user)
    return user
