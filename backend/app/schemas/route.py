import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class RouteRead(BaseModel):
    distance_m: float
    duration_s: float
    # [[lat, lng], ...] — já invertido da ordem [lng, lat] que o OSRM/GeoJSON
    # usa, pra bater com a convenção lat/lng usada no resto da API e no Leaflet.
    geometry: list[list[float]]


class RouteHistoryCreate(BaseModel):
    poi_id: uuid.UUID
    origin_lat: float = Field(ge=-90, le=90)
    origin_lng: float = Field(ge=-180, le=180)
    distance_m: float
    duration_s: float
    # Injetado pelo proxy confiável do Next.js a partir da sessão autenticada.
    user_id: uuid.UUID


class RouteHistoryRead(BaseModel):
    id: uuid.UUID
    poi_id: uuid.UUID
    poi_name: str
    poi_lat: float
    poi_lng: float
    distance_m: float
    duration_s: float
    created_at: datetime
