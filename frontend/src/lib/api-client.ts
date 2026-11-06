import type {
  AddressResult,
  AvatarPreset,
  Category,
  CurrentUser,
  FollowListResult,
  LatLng,
  MapBounds,
  NotificationListResult,
  Poi,
  PoiPublic,
  RouteHistoryEntry,
  RouteProfile,
  RouteResult,
  UserProfile,
  UserPublic,
  UserStats,
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

// Geocodificação (Nominatim) via BFF — sem dado de usuário, mas passa pelo
// Next.js mesmo assim porque o User-Agent exigido pelo Nominatim mora lá
// (`lib/nominatim.ts`), não faz sentido duplicar no navegador.
// `viewbox` (opcional): área visível atual do mapa, usada pra priorizar
// resultados próximos de onde o usuário está olhando (ver SPRINTS.md).
export async function searchAddresses(q: string, viewbox?: MapBounds | null): Promise<AddressResult[]> {
  const params = new URLSearchParams({ q, limit: "5" });
  if (viewbox) {
    params.set("viewbox", `${viewbox.minLng},${viewbox.maxLat},${viewbox.maxLng},${viewbox.minLat}`);
  }
  const res = await fetch(`/api/geocode/search?${params.toString()}`);
  if (!res.ok) return [];
  const data: { results: AddressResult[] } = await res.json();
  return data.results;
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

export async function fetchUserStats(): Promise<UserStats> {
  const res = await fetch("/api/users/me/stats");
  if (!res.ok) throw new Error("Falha ao carregar estatísticas");
  return res.json();
}

// Galeria fixa de avatares (Fase 9) — sem dado de usuário, chama o FastAPI
// direto, sem passar pelo BFF (mesmo padrão de `fetchCategories`).
export async function fetchAvatarPresets(): Promise<AvatarPreset[]> {
  const res = await fetch(`${API_URL}/api/v1/users/avatar-presets`);
  if (!res.ok) throw new Error("Falha ao carregar os avatares");
  return res.json();
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const res = await fetch("/api/users/me");
  if (!res.ok) throw new Error("Falha ao carregar o usuário");
  return res.json();
}

async function extractErrorDetail(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return typeof body?.detail === "string" ? body.detail : fallback;
  } catch {
    return fallback;
  }
}

// `presetId: null` remove a escolha e volta a usar a foto do Google.
export async function updateAvatarChoice(presetId: number | null): Promise<CurrentUser> {
  const res = await fetch("/api/users/me/avatar", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ preset_id: presetId }),
  });
  if (!res.ok) throw new Error(await extractErrorDetail(res, "Não foi possível atualizar o avatar"));
  return res.json();
}

interface AvatarPresignedUpload {
  upload_url: string;
  object_key: string;
}

/** Envia uma foto de perfil própria (não preset, não Google) — pede uma URL
 * pré-assinada, sobe o arquivo direto pro R2, e confirma com o backend, que
 * só então valida de verdade o conteúdo (tamanho, se é mesmo uma imagem) e
 * processa (recorte quadrado, sem EXIF). Erros do backend (arquivo grande
 * demais, formato inválido, limite diário de uploads) vêm em `detail` —
 * propagados pra quem chamar poder mostrar a mensagem certa, não um genérico. */
export async function uploadCustomAvatar(file: File): Promise<CurrentUser> {
  const presignRes = await fetch("/api/users/me/avatar/presigned-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, content_type: file.type }),
  });
  if (!presignRes.ok) {
    throw new Error(await extractErrorDetail(presignRes, "Não foi possível iniciar o envio"));
  }
  const presigned: AvatarPresignedUpload = await presignRes.json();

  const uploadRes = await fetch(presigned.upload_url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!uploadRes.ok) throw new Error("Falha ao enviar o arquivo para o storage");

  const confirmRes = await fetch("/api/users/me/avatar", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ object_key: presigned.object_key }),
  });
  if (!confirmRes.ok) {
    throw new Error(await extractErrorDetail(confirmRes, "Não foi possível processar a foto enviada"));
  }
  return confirmRes.json();
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

interface GenerateBioParams {
  name: string;
  categoryName: string;
  address?: string | null;
  userNotes?: string | null;
}

// POIBioWriterAgent (Sprint 5) — gera uma descrição curta pro botão "Gerar
// descrição com IA" no formulário.
export async function generatePoiBio({
  name,
  categoryName,
  address,
  userNotes,
}: GenerateBioParams): Promise<string> {
  const res = await fetch("/api/pois/generate-bio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      category_name: categoryName,
      address: address || null,
      user_notes: userNotes || null,
    }),
  });
  if (res.status === 429) throw new Error("Limite diário de sugestões de IA atingido. Tente novamente mais tarde.");
  if (!res.ok) throw new Error("Não foi possível gerar a descrição agora");
  const data: { bio: string } = await res.json();
  return data.bio;
}


export async function acceptAiSuggestion(poiId: string): Promise<void> {
  await fetch(`/api/pois/${poiId}/ai-suggestion/accept`, { method: "POST" });
}

export async function dismissAiSuggestion(poiId: string): Promise<void> {
  await fetch(`/api/pois/${poiId}/ai-suggestion/dismiss`, { method: "POST" });
}

// --- Fase 7: seguir, perfil, busca de pessoas, notificações ----------------

export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const res = await fetch(`/api/users/${userId}/profile`);
  if (!res.ok) throw new Error("Falha ao carregar o perfil");
  return res.json();
}

export async function fetchUserPois(userId: string): Promise<PoiPublic[]> {
  const res = await fetch(`/api/users/${userId}/pois`);
  if (!res.ok) throw new Error("Falha ao carregar os POIs desse usuário");
  return res.json();
}

export async function fetchMyFollowers(limit = 20, offset = 0): Promise<FollowListResult> {
  const res = await fetch(`/api/users/me/followers?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error("Falha ao carregar seguidores");
  return res.json();
}

export async function fetchMyFollowing(limit = 20, offset = 0): Promise<FollowListResult> {
  const res = await fetch(`/api/users/me/following?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error("Falha ao carregar quem você segue");
  return res.json();
}

export async function searchUsers(q: string): Promise<UserPublic[]> {
  const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error("Falha ao buscar pessoas");
  return res.json();
}

export async function followUser(userId: string): Promise<void> {
  const res = await fetch(`/api/follows/${userId}`, { method: "POST" });
  if (!res.ok) throw new Error("Não foi possível seguir essa pessoa");
}

export async function unfollowUser(userId: string): Promise<void> {
  const res = await fetch(`/api/follows/${userId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Não foi possível deixar de seguir essa pessoa");
}

export async function fetchNotifications(limit = 20): Promise<NotificationListResult> {
  const res = await fetch(`/api/notifications?limit=${limit}`);
  if (!res.ok) throw new Error("Falha ao carregar notificações");
  return res.json();
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await fetch(`/api/notifications/${notificationId}/read`, { method: "POST" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await fetch("/api/notifications/read-all", { method: "POST" });
}
