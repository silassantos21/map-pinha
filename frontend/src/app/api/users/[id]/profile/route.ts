import { NextResponse } from "next/server";

import { backendFetch, getSessionUserId } from "@/lib/api-server";

// Perfil é visível sem login (igual a um POI público) — por isso usa
// `getSessionUserId` (pode ser `null`), não `requireSessionUserId`.
export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const viewerId = await getSessionUserId();
  const query = viewerId ? `?viewer_id=${viewerId}` : "";

  const res = await backendFetch(`/api/v1/users/${params.id}/profile${query}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
