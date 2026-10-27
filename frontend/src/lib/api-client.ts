import type {
  Category,
  LatLng,
  MapBounds,
  Poi,
  RouteHistoryEntry,
  RouteProfile,
  RouteResult,
} from "@/types/poi";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/api/v1/categories`);
  if (!res.ok) throw new Error("Falha ao carregar categorias");
  return res.json();
}

// Cálculo de rota não tem dado de usuário nem nada sensível — é só geometria
// a partir de coordenadas, por isso chama o FastAPI direto, sem passar pelo
// BFF (mesmo padrão de `fetchCategories`).
export async function fetchRoute(
  origin: LatLng,
  destination: LatLng,
  profile: RouteProfile,
): Promise<RouteResult> {
  const params = new URLSearchParams({
    from_lat: String(origin.lat),
    from_lng: String(origin.lng),
    to_lat: String(destination.lat),
    to_lng: String(destination.lng),
    profile,
  });
  const res = await fetch(`${API_URL}/api/v1/routes?${params.toString()}`);
  if (!res.ok) throw new Error("Falha ao calcular a rota");
  return res.json();
}

interface FetchPoisParams {
  bounds?: MapBounds;
  categorySlug?: string | null;
  q?: string | null;
}

// Passa pelo BFF (`/api/pois`, Next.js), não direto pro FastAPI: o `user_id`
// é resolvido lá a partir da sessão autenticada no servidor, nunca de um
// parâmetro vindo do navegador — ver nota de segurança no SPRINTS.md.
export async function fetchPois({ bounds, categorySlug, q }: FetchPoisParams): Promise<Poi[]> {
  const params = new URLSearchParams();
  if (bounds) {
    params.set("min_lat", String(bounds.minLat));
    params.set("min_lng", String(bounds.minLng));
    params.set("max_lat", String(bounds.maxLat));
    params.set("max_lng", String(bounds.maxLng));
  }
  if (categorySlug) params.set("category_slug", categorySlug);
  if (q) params.set("q", q);

  const res = await fetch(`/api/pois?${params.toString()}`);
  if (!res.ok) throw new Error("Falha ao carregar POIs");
  return res.json();
}

export async function fetchPoiById(id: string): Promise<Poi> {
  const res = await fetch(`/api/pois/${id}`);
  if (!res.ok) throw new Error("Falha ao carregar o POI");
  return res.json();
}

export async function fetchFavorites(): Promise<Poi[]> {
  const res = await fetch("/api/favorites");
  if (!res.ok) throw new Error("Falha ao carregar favoritos");
  return res.json();
}

export async function fetchMyPois(): Promise<Poi[]> {
  const res = await fetch("/api/pois/mine");
  if (!res.ok) throw new Error("Falha ao carregar seus POIs");
  return res.json();
}

export async function fetchRouteHistory(): Promise<RouteHistoryEntry[]> {
  const res = await fetch("/api/routes/history");
  if (!res.ok) throw new Error("Falha ao carregar o histórico de rotas");
  return res.json();
}

interface SaveRouteHistoryParams {
  poiId: string;
  origin: LatLng;
  distanceM: number;
  durationS: number;
}

export async function saveRouteHistory({
  poiId,
  origin,
  distanceM,
  durationS,
}: SaveRouteHistoryParams): Promise<void> {
  await fetch("/api/routes/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      poi_id: poiId,
      origin_lat: origin.lat,
      origin_lng: origin.lng,
      distance_m: distanceM,
      duration_s: durationS,
    }),
  });
}
