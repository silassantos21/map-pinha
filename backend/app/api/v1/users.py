import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.v1.auth import verify_internal_secret
from app.db.session import get_db
from app.models.poi import POI
from app.models.route import Route

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
