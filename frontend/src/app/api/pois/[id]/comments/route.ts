import { NextResponse } from "next/server";

import { ApiError, backendFetch, getSessionUserId, requireSessionUserId } from "@/lib/api-server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, props: RouteParams) {
  const params = await props.params;
  try {
    const viewerId = await getSessionUserId();
    const limit = new URL(request.url).searchParams.get("limit") ?? "20";
    const query = viewerId ? `viewer_id=${viewerId}&limit=${limit}` : `limit=${limit}`;

    const res = await backendFetch(`/api/v1/pois/${params.id}/comments?${query}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function POST(request: Request, props: RouteParams) {
  const params = await props.params;
  try {
    const userId = await requireSessionUserId();
    const body = await request.json();

    const res = await backendFetch(`/api/v1/pois/${params.id}/comments`, {
      method: "POST",
      body: JSON.stringify({ ...body, user_id: userId }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }
    throw error;
  }
}
