// Espelha o tema "cartoon" de `frontend/src/lib/map-themes.ts` — único tema
// portado nesta primeira versão do app (trocar de tema fica pra uma parte
// futura da Fase 10). Mesma URL de tile, mesma lógica de API key condicional.
const stadiaKey = process.env.EXPO_PUBLIC_STADIA_API_KEY;
const stadiaKeyParam = stadiaKey ? `?api_key=${stadiaKey}` : "";

export const CARTOON_TILE_URL = `https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}.png${stadiaKeyParam}`;
export const CARTOON_MAX_ZOOM = 20;
