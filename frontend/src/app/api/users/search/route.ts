import { NextResponse } from "next/server";

import { backendFetch, getSessionUserId } from "@/lib/api-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const viewerId = await getSessionUserId();

  const params = new URLSearchParams({ q });
  if (viewerId) params.set("viewer_id", viewerId);

  const res = await backendFetch(`/api/v1/users/search?${params.toString()}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
