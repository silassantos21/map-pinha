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

export type PoiVisibility = "public" | "followers" | "group" | "private";

export interface PoiMedia {
  id: string;
  media_type: "image" | "gif" | "audio";
  url: string;
  thumbnail_url: string | null;
}

export interface Poi {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  description: string | null;
  address: string | null;
  lat: number;
  lng: number;
  visibility: PoiVisibility;
  group_id: string | null;
  icon_name: string | null;
  owner_name: string | null;
  owner_avatar_url: string | null;
  media: PoiMedia[];
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

// --- Parte 3: criar/editar POI, mídia, favoritos ---

// Variante pública (sem user_id/visibility/group_id) usada em
// `GET /users/{id}/pois` — espelha `POIPublicRead` do backend.
export interface PoiPublic {
  id: string;
  name: string;
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
  media: PoiMedia[];
}

export interface PresignedUpload {
  upload_url: string;
  object_key: string;
  public_url: string;
}

// --- Parte 4: social (seguir, grupos, comentários, notificações) ---

export interface UserPublic {
  id: string;
  name: string | null;
  avatar_url: string | null;
  avatar_choice_url: string | null;
  is_following: boolean | null;
}

export interface UserProfile extends UserPublic {
  followers_count: number;
  following_count: number;
  total_pois: number;
}

export interface FollowListResult {
  items: UserPublic[];
  total: number;
}

export type GroupMemberRole = "owner" | "member";
export type GroupMemberStatus = "pending" | "accepted";

export interface Group {
  id: string;
  name: string;
  owner_id: string;
  owner_name: string | null;
  member_count: number;
  my_role: GroupMemberRole;
}

export interface GroupMember {
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  role: GroupMemberRole;
  status: GroupMemberStatus;
}

export interface GroupDetail extends Group {
  members: GroupMember[];
}

export interface GroupInvite {
  group_id: string;
  group_name: string;
  invited_by_name: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  poi_id: string;
  user_id: string;
  user_name: string | null;
  user_avatar_url: string | null;
  body: string;
  created_at: string;
}

export interface CommentListResult {
  items: Comment[];
  total: number;
}

export type NotificationType =
  | "new_follower"
  | "poi_reaction"
  | "new_poi_from_followed"
  | "group_invite"
  | "group_invite_accepted"
  | "poi_comment";

export interface AppNotification {
  id: string;
  type: NotificationType;
  actor_id: string;
  actor_name: string | null;
  actor_avatar_url: string | null;
  poi_id: string | null;
  group_id: string | null;
  group_name: string | null;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListResult {
  items: AppNotification[];
  unread_count: number;
}
