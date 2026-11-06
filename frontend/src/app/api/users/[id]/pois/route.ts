import { NextResponse } from "next/server";

import { backendFetch, getSessionUserId } from "@/lib/api-server";

// Mesma regra do perfil: visível sem login (POIs públicos só), por isso usa
// `getSessionUserId` (pode ser `null`), não `requireSessionUserId`.
export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const viewerId = await getSessionUserId();
  const query = viewerId ? `?viewer_id=${viewerId}` : "";

  const res = await backendFetch(`/api/v1/users/${params.id}/pois${query}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
