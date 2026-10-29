import { NextResponse } from "next/server";

import { ApiError, backendFetch, requireSessionUserId } from "@/lib/api-server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, props: RouteParams) {
  const params = await props.params;
  try {
    const userId = await requireSessionUserId();

    const res = await backendFetch(`/api/v1/pois/${params.id}/ai-suggestion/accept`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    });
    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }
    throw error;
  }
}
