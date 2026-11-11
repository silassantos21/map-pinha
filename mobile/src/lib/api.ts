import type {
  AppNotification,
  Category,
  Comment,
  CommentListResult,
  CurrentUser,
  FollowListResult,
  Group,
  GroupDetail,
  GroupInvite,
  MobileAuthResponse,
  NotificationListResult,
  Poi,
  PoiPublic,
  PoiVisibility,
  PresignedUpload,
  UserProfile,
  UserPublic,
} from "../types/api";

// EXPO_PUBLIC_API_URL: IP local da máquina rodando o backend (não
// "localhost" — o celular físico não é a mesma máquina), ex:
// http://192.168.0.42:8000. Ver README.md deste pacote.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(body?.detail ?? response.statusText, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

function jsonAuthHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function mobileGoogleLogin(idToken: string): Promise<MobileAuthResponse> {
  return request<MobileAuthResponse>("/api/v1/mobile/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: idToken }),
  });
}

export async function fetchCurrentUser(token: string): Promise<CurrentUser> {
  return request<CurrentUser>("/api/v1/mobile/auth/me", { headers: authHeaders(token) });
}

export async function fetchPois(token: string): Promise<Poi[]> {
  return request<Poi[]>("/api/v1/pois", { headers: authHeaders(token) });
}

export async function fetchPoi(token: string, poiId: string): Promise<Poi> {
  return request<Poi>(`/api/v1/pois/${poiId}`, { headers: authHeaders(token) });
}

export async function fetchCategories(): Promise<Category[]> {
  // Sem auth — GET /categories é público, igual na web.
  return request<Category[]>("/api/v1/categories");
}

// --- Parte 3: criar/editar POI, mídia, favoritos ---

export interface PoiFormPayload {
  name: string;
  description: string | null;
  address: string | null;
  category_id: string;
  lat: number;
  lng: number;
  visibility: PoiVisibility;
  group_id: string | null;
  icon_name: string | null;
}

// `user_id` no corpo é exigido pelo schema do backend mas ignorado sempre
// que há um JWT mobile válido (o backend sobrescreve com o dono real do
// token) — mandamos o próprio id só pra satisfazer a validação do payload.
export async function createPoi(
  token: string,
  selfUserId: string,
  payload: PoiFormPayload,
): Promise<Poi> {
  return request<Poi>("/api/v1/pois", {
    method: "POST",
    headers: jsonAuthHeaders(token),
    body: JSON.stringify({ ...payload, user_id: selfUserId }),
  });
}

export async function updatePoi(
  token: string,
  selfUserId: string,
  poiId: string,
  payload: PoiFormPayload,
): Promise<Poi> {
  return request<Poi>(`/api/v1/pois/${poiId}`, {
    method: "PUT",
    headers: jsonAuthHeaders(token),
    body: JSON.stringify({ ...payload, user_id: selfUserId }),
  });
}

export async function deletePoi(token: string, poiId: string): Promise<void> {
  return request<void>(`/api/v1/pois/${poiId}`, { method: "DELETE", headers: authHeaders(token) });
}

export async function requestMediaPresignedUrl(
  token: string,
  filename: string,
  contentType: string,
  mediaType: "image" | "gif" | "audio",
): Promise<PresignedUpload> {
  return request<PresignedUpload>("/api/v1/media/presigned-url", {
    method: "POST",
    headers: jsonAuthHeaders(token),
    body: JSON.stringify({ filename, content_type: contentType, media_type: mediaType }),
  });
}

// Upload direto pro R2 via a URL pré-assinada — sem passar pelo nosso
// backend, igual a web (`frontend/src/lib/upload-media.ts`).
export async function uploadToPresignedUrl(
  uploadUrl: string,
  fileUri: string,
  contentType: string,
): Promise<void> {
  const fileResponse = await fetch(fileUri);
  const blob = await fileResponse.blob();
  const putResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });
  if (!putResponse.ok) {
    throw new ApiError("Falha ao enviar a mídia", putResponse.status);
  }
}

export async function attachPoiMedia(
  token: string,
  selfUserId: string,
  poiId: string,
  objectKey: string,
  mediaType: "image" | "gif" | "audio",
): Promise<void> {
  return request(`/api/v1/pois/${poiId}/media`, {
    method: "POST",
    headers: jsonAuthHeaders(token),
    body: JSON.stringify({ object_key: objectKey, media_type: mediaType, user_id: selfUserId }),
  });
}

export async function fetchFavorites(token: string): Promise<Poi[]> {
  return request<Poi[]>("/api/v1/favorites", { headers: authHeaders(token) });
}

export async function addFavorite(token: string, poiId: string): Promise<void> {
  return request(`/api/v1/pois/${poiId}/favorite`, { method: "POST", headers: authHeaders(token) });
}

export async function removeFavorite(token: string, poiId: string): Promise<void> {
  return request(`/api/v1/pois/${poiId}/favorite`, { method: "DELETE", headers: authHeaders(token) });
}

// --- Parte 4: social (seguir, grupos, comentários, notificações) ---

export async function searchUsers(token: string, q: string): Promise<UserPublic[]> {
  return request<UserPublic[]>(`/api/v1/users/search?q=${encodeURIComponent(q)}`, {
    headers: authHeaders(token),
  });
}

export async function followUser(token: string, userId: string): Promise<void> {
  return request(`/api/v1/users/${userId}/follow`, { method: "POST", headers: authHeaders(token) });
}

export async function unfollowUser(token: string, userId: string): Promise<void> {
  return request(`/api/v1/users/${userId}/follow`, { method: "DELETE", headers: authHeaders(token) });
}

export async function fetchFollowers(token: string, userId: string): Promise<FollowListResult> {
  return request<FollowListResult>(`/api/v1/users/${userId}/followers`, { headers: authHeaders(token) });
}

export async function fetchFollowing(token: string, userId: string): Promise<FollowListResult> {
  return request<FollowListResult>(`/api/v1/users/${userId}/following`, { headers: authHeaders(token) });
}

export async function fetchUserProfile(token: string, userId: string): Promise<UserProfile> {
  return request<UserProfile>(`/api/v1/users/${userId}/profile`, { headers: authHeaders(token) });
}

export async function fetchUserPois(token: string, userId: string): Promise<PoiPublic[]> {
  return request<PoiPublic[]>(`/api/v1/users/${userId}/pois`, { headers: authHeaders(token) });
}

export async function fetchGroups(token: string): Promise<Group[]> {
  return request<Group[]>("/api/v1/groups", { headers: authHeaders(token) });
}

export async function fetchGroupInvites(token: string): Promise<GroupInvite[]> {
  return request<GroupInvite[]>("/api/v1/groups/invites", { headers: authHeaders(token) });
}

export async function fetchGroupDetail(token: string, groupId: string): Promise<GroupDetail> {
  return request<GroupDetail>(`/api/v1/groups/${groupId}`, { headers: authHeaders(token) });
}

export async function fetchGroupPois(token: string, groupId: string): Promise<Poi[]> {
  return request<Poi[]>(`/api/v1/groups/${groupId}/pois`, { headers: authHeaders(token) });
}

// `owner_id` é exigido pelo schema mas ignorado quando há JWT — mesmo motivo
// de `createPoi`.
export async function createGroup(token: string, selfUserId: string, name: string): Promise<Group> {
  return request<Group>("/api/v1/groups", {
    method: "POST",
    headers: jsonAuthHeaders(token),
    body: JSON.stringify({ name, owner_id: selfUserId }),
  });
}

export async function deleteGroup(token: string, groupId: string): Promise<void> {
  return request(`/api/v1/groups/${groupId}`, { method: "DELETE", headers: authHeaders(token) });
}

export async function inviteToGroup(
  token: string,
  selfUserId: string,
  groupId: string,
  userId: string,
): Promise<void> {
  return request(`/api/v1/groups/${groupId}/members`, {
    method: "POST",
    headers: jsonAuthHeaders(token),
    body: JSON.stringify({ user_id: userId, inviter_id: selfUserId }),
  });
}

export async function acceptGroupInvite(
  token: string,
  groupId: string,
  selfUserId: string,
): Promise<void> {
  return request(`/api/v1/groups/${groupId}/members/${selfUserId}/accept`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function leaveOrRemoveFromGroup(
  token: string,
  groupId: string,
  memberUserId: string,
): Promise<void> {
  return request(`/api/v1/groups/${groupId}/members/${memberUserId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export async function fetchComments(token: string, poiId: string): Promise<CommentListResult> {
  return request<CommentListResult>(`/api/v1/pois/${poiId}/comments`, { headers: authHeaders(token) });
}

export async function createComment(
  token: string,
  selfUserId: string,
  poiId: string,
  body: string,
): Promise<Comment> {
  return request<Comment>(`/api/v1/pois/${poiId}/comments`, {
    method: "POST",
    headers: jsonAuthHeaders(token),
    body: JSON.stringify({ body, user_id: selfUserId }),
  });
}

export async function deleteComment(token: string, commentId: string): Promise<void> {
  return request(`/api/v1/comments/${commentId}`, { method: "DELETE", headers: authHeaders(token) });
}

export async function fetchNotifications(token: string): Promise<NotificationListResult> {
  return request<NotificationListResult>("/api/v1/notifications", { headers: authHeaders(token) });
}

export async function markNotificationRead(token: string, notificationId: string): Promise<void> {
  return request(`/api/v1/notifications/${notificationId}/read`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function markAllNotificationsRead(token: string): Promise<void> {
  return request("/api/v1/notifications/read-all", { method: "POST", headers: authHeaders(token) });
}
