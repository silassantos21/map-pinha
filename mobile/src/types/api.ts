// Espelha só os campos usados pelo app (subconjunto de
// `backend/app/schemas/poi.py::POIRead` e `category.py::CategoryRead` —
// ver `frontend/src/types/poi.ts` pro contrato completo usado na web).

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon_name: string;
  color_hex: string;
}

export interface Poi {
  id: string;
  category_id: string;
  name: string;
  lat: number;
  lng: number;
  icon_name: string | null;
  owner_name: string | null;
  owner_avatar_url: string | null;
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  avatar_choice_url: string | null;
}

export interface MobileAuthResponse {
  access_token: string;
  user: CurrentUser;
}
