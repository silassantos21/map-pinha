import uuid
from typing import Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from geoalchemy2.elements import WKTElement
from geoalchemy2.shape import to_shape
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.v1.auth import verify_internal_secret
from app.core.cache import cache_get, cache_set
from app.db.session import get_db
from app.models.poi import POI
from app.models.route import Route
from app.schemas.route import RouteHistoryCreate, RouteHistoryRead, RouteRead

router = APIRouter()

# O demo público oficial (router.project-osrm.org) só tem o perfil de carro
# carregado de verdade — qualquer outro nome de perfil na URL (ex: "foot") é
# ignorado silenciosamente e devolve o mesmo resultado do carro, sem erro
# nenhum (confirmado comparando as duas respostas byte a byte). A FOSSGIS
# (comunidade OSM alemã) mantém instâncias separadas de verdade por perfil,
# gratuitas e sem API key, cada uma na sua própria porta/subpath.
_OSRM_HOST = {
    "driving": "https://routing.openstreetmap.de/routed-car",
    "walking": "https://routing.openstreetmap.de/routed-foot",
}

# TTL curto de propósito: origem costuma ser a geolocalização ao vivo do
# usuário (muda a cada poucos metros), então o cache serve mais pra absorver
# pedidos repetidos/próximos (reabrir o mesmo POI, múltiplas abas) do que pra
# uma rota parada por muito tempo.
_CACHE_TTL_SECONDS = 300


def _route_cache_key(from_lat: float, from_lng: float, to_lat: float, to_lng: float, profile: str) -> str:
    # Arredonda a ~11m de precisão — origem/destino "quase iguais" (jitter de
    # GPS) caem na mesma chave em vez de nunca bater cache.
    return f"route:{profile}:{from_lat:.4f},{from_lng:.4f}:{to_lat:.4f},{to_lng:.4f}"


@router.get("/routes", response_model=RouteRead)
def get_route(
    from_lat: float = Query(..., ge=-90, le=90),
    from_lng: float = Query(..., ge=-180, le=180),
    to_lat: float = Query(..., ge=-90, le=90),
    to_lng: float = Query(..., ge=-180, le=180),
    profile: Literal["driving", "walking"] = "driving",
):
    """Calcula a rota entre dois pontos via OSRM (gratuito, sem API key —
    ver docs/04_TIMELINE.md Sprint 4 e SPRINTS.md pra detalhes da escolha de
    servidor). Não tem estado nem depende de sessão: é só geometria a partir
    de coordenadas informadas, sem nenhum dado de usuário envolvido.
    """
    cache_key = _route_cache_key(from_lat, from_lng, to_lat, to_lng, profile)
    cached = cache_get(cache_key)
    if cached is not None:
        return RouteRead.model_validate_json(cached)

    coords = f"{from_lng},{from_lat};{to_lng},{to_lat}"
    # O segmento de perfil na URL é só sintático aqui — quem decide o perfil
    # de verdade é o host escolhido acima (`_OSRM_HOST`).
    url = f"{_OSRM_HOST[profile]}/route/v1/driving/{coords}"

    try:
        response = httpx.get(
            url,
            params={"overview": "full", "geometries": "geojson"},
            timeout=10.0,
        )
        response.raise_for_status()
        data = response.json()
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Não foi possível calcular a rota agora",
        ) from error

    if data.get("code") != "Ok" or not data.get("routes"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhuma rota encontrada entre esses pontos",
        )

    route = data["routes"][0]
    geometry = [[lat, lng] for lng, lat in route["geometry"]["coordinates"]]

    result = RouteRead(
        distance_m=route["distance"],
        duration_s=route["duration"],
        geometry=geometry,
    )
    cache_set(cache_key, result.model_dump_json(), _CACHE_TTL_SECONDS)
    return result


@router.post(
    "/routes/history",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(verify_internal_secret)],
)
def save_route_history(payload: RouteHistoryCreate, db: Session = Depends(get_db)):
    """Registra uma rota calculada no histórico do usuário (só chamado pelo
    BFF autenticado — `user_id` nunca vem direto do navegador)."""
    if db.get(POI, payload.poi_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="POI not found")

    db.add(
        Route(
            user_id=payload.user_id,
            poi_id=payload.poi_id,
            origin=WKTElement(f"POINT({payload.origin_lng} {payload.origin_lat})", srid=4326),
            distance_m=payload.distance_m,
            duration_s=payload.duration_s,
        )
    )
    db.commit()


@router.get(
    "/routes/history",
    response_model=list[RouteHistoryRead],
    dependencies=[Depends(verify_internal_secret)],
)
def list_route_history(user_id: uuid.UUID, db: Session = Depends(get_db)):
    stmt = (
        select(Route, POI)
        .join(POI, Route.poi_id == POI.id)
        .where(Route.user_id == user_id)
        .order_by(Route.created_at.desc())
        .limit(20)
    )
    results = []
    for route, poi in db.execute(stmt).all():
        point = to_shape(poi.location)
        results.append(
            RouteHistoryRead(
                id=route.id,
                poi_id=poi.id,
                poi_name=poi.name,
                poi_lat=point.y,
                poi_lng=point.x,
                distance_m=route.distance_m,
                duration_s=route.duration_s,
                created_at=route.created_at,
            )
        )
    return results
