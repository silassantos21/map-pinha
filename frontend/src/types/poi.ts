export type MediaType = "image" | "gif" | "audio";

export type PoiVisibility = "public" | "followers" | "private";

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon_name: string;
  color_hex: string;
}

export interface PoiMedia {
  id: string;
  media_type: MediaType;
  url: string;
  thumbnail_url: string | null;
  created_at: string;
}

export interface PoiReaction {
  emoji: string;
  user_id: string;
  user_name: string | null;
}

export interface Poi {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  lat: number;
  lng: number;
  visibility: PoiVisibility;
  // Ícone escolhido livremente pelo dono (só faz sentido na categoria
  // "outros") — quando presente, sobrepõe o ícone fixo da categoria.
  icon_name: string | null;
  // Sugestão pendente do POICategorizerAgent (Sprint 5) — não-nula só
  // enquanto o dono não aceitou/dispensou.
  ai_category_slug: string | null;
  ai_icon_name: string | null;
  ai_color_hex: string | null;
  ai_confidence: number | null;
  ai_reasoning: string | null;
  created_at: string;
  updated_at: string;
  media: PoiMedia[];
  reactions: PoiReaction[];
}

/** Versão pública de um POI (página de compartilhamento `/p/[slug]`,
 * Sprint 6) — espelha `POIPublicRead` do backend: sem `user_id` cru nem
 * campos de sugestão de IA, com nome/ícone/cor da categoria e nome/avatar
 * do dono já resolvidos. */
export interface PoiPublic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  lat: number;
  lng: number;
  icon_name: string | null;
  category_name: string;
  category_icon_name: string;
  category_color_hex: string;
  owner_name: string | null;
  owner_avatar_url: string | null;
  created_at: string;
  media: PoiMedia[];
}

export interface MapBounds {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

/** Resultado de geocodificação (Nominatim) — usado tanto no formulário de
 * POI (buscar endereço pra posicionar o rascunho) quanto na SearchBar
 * principal do mapa (Fase 8). */
export interface AddressResult {
  lat: number;
  lng: number;
  address: string;
}

export type RouteProfile = "driving" | "walking";

export interface RouteResult {
  distance_m: number;
  duration_s: number;
  geometry: [number, number][];
}

export interface RouteHistoryEntry {
  id: string;
  poi_id: string;
  poi_name: string;
  poi_lat: number;
  poi_lng: number;
  distance_m: number;
  duration_s: number;
  created_at: string;
}

/** Estatísticas da página de perfil (Sprint 6) — "pontos" = pontos de
 * interesse cadastrados (não é um sistema de XP/pontuação); "km mapeados" =
 * soma das distâncias de todas as rotas que o usuário já calculou no app. */
export interface UserStats {
  total_pois: number;
  total_km: number;
}

/** Um dos 20 avatares pré-gerados (Fase 9) — URL pública já pronta,
 * construída no backend a partir do `preset_id`. */
export interface AvatarPreset {
  preset_id: number;
  url: string;
}

/** Usuário atual com os campos vindos do banco (não da sessão NextAuth, que
 * só guarda o que o Google devolveu no login) — em especial
 * `avatar_choice_url`, que pode mudar a qualquer momento sem precisar de um
 * novo login. */
export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  avatar_choice_url: string | null;
}

/** Versão de usuário pra exibir OUTRA pessoa (Fase 7: busca, listas de
 * seguidores/seguindo) — nunca tem `email` (ver `CurrentUser`, que tem). */
export interface UserPublic {
  id: string;
  name: string | null;
  avatar_url: string | null;
  avatar_choice_url: string | null;
  // `null` quando não há viewer logado (ou é o próprio viewer).
  is_following: boolean | null;
}

/** Perfil de outro usuário (Fase 7) — `UserPublic` + contagens. */
export interface UserProfile extends UserPublic {
  followers_count: number;
  following_count: number;
  total_pois: number;
}

export type NotificationType = "new_follower" | "poi_reaction" | "new_poi_from_followed";

/** Notificação in-app (Fase 7). Nome `AppNotification` em vez de
 * `Notification` pra não colidir com o tipo global `Notification` do DOM. */
export interface AppNotification {
  id: string;
  type: NotificationType;
  actor_id: string;
  actor_name: string | null;
  actor_avatar_url: string | null;
  poi_id: string | null;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListResult {
  items: AppNotification[];
  unread_count: number;
}
