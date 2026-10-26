from pydantic import BaseModel


class RouteRead(BaseModel):
    distance_m: float
    duration_s: float
    # [[lat, lng], ...] — já invertido da ordem [lng, lat] que o OSRM/GeoJSON
    # usa, pra bater com a convenção lat/lng usada no resto da API e no Leaflet.
    geometry: list[list[float]]
