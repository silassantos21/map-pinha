export type MediaType = "image" | "gif" | "audio";

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
  is_public: boolean;
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
