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
