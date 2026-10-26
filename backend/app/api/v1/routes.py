from typing import Literal

import httpx
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.route import RouteRead

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

    return RouteRead(
        distance_m=route["distance"],
        duration_s=route["duration"],
        geometry=geometry,
    )
