import { NextResponse } from "next/server";

import { ApiError, backendFetch, requireSessionUserId } from "@/lib/api-server";

export async function GET(request: Request) {
  try {
    const userId = await requireSessionUserId();
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ?? "20";

    const res = await backendFetch(
      `/api/v1/notifications?user_id=${userId}&limit=${limit}&offset=0`,
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }
    throw error;
  }
}
