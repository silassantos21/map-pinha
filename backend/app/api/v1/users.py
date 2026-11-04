import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.v1.auth import verify_internal_secret
from app.core.avatar_presets import avatar_preset_url, list_avatar_presets
from app.db.session import get_db
from app.models.poi import POI
from app.models.route import Route
from app.models.user import User
from app.schemas.user import AvatarPresetRead, UserAvatarUpdate, UserRead

router = APIRouter()


class UserStatsRead(BaseModel):
    total_pois: int
    total_km: float


@router.get(
    "/users/{user_id}/stats",
    response_model=UserStatsRead,
    dependencies=[Depends(verify_internal_secret)],
)
def get_user_stats(user_id: uuid.UUID, db: Session = Depends(get_db)):
    """Estatísticas da página de perfil (Sprint 6): total de POIs cadastrados
    + km mapeados (soma das distâncias de todas as rotas calculadas pelo
    usuário, tabela `routes` — cache de rotas da Sprint 4). Não exige que o
    POI ainda exista: uma rota calculada pra um POI depois excluído ainda
    conta pro total de km, já que a "jornada" aconteceu de verdade."""
    total_pois = db.scalar(select(func.count(POI.id)).where(POI.user_id == user_id)) or 0
    total_m = db.scalar(
        select(func.coalesce(func.sum(Route.distance_m), 0)).where(Route.user_id == user_id)
    ) or 0
    return UserStatsRead(total_pois=total_pois, total_km=round(total_m / 1000, 1))


@router.get("/users/avatar-presets", response_model=list[AvatarPresetRead])
def get_avatar_presets():
    """Galeria fixa de avatares pré-gerados (Fase 9) — sem autenticação, são
    só URLs públicas do bucket R2, as mesmas pra todo mundo."""
    return list_avatar_presets()


@router.get(
    "/users/{user_id}",
    response_model=UserRead,
    dependencies=[Depends(verify_internal_secret)],
)
def get_user(user_id: uuid.UUID, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.patch(
    "/users/{user_id}/avatar",
    response_model=UserRead,
    dependencies=[Depends(verify_internal_secret)],
)
def update_user_avatar(user_id: uuid.UUID, payload: UserAvatarUpdate, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # `preset_id` já validado contra a faixa 1-20 no schema (Field ge/le) —
    # a URL é sempre montada aqui no servidor a partir de um preset conhecido,
    # nunca aceita uma URL arbitrária vinda do cliente.
    user.avatar_choice_url = avatar_preset_url(payload.preset_id) if payload.preset_id else None

    db.commit()
    db.refresh(user)
    return user
