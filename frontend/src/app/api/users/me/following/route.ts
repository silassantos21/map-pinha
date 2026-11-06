import { NextResponse } from "next/server";

import { ApiError, backendFetch, requireSessionUserId } from "@/lib/api-server";

export async function GET(request: Request) {
  try {
    const userId = await requireSessionUserId();
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ?? "20";
    const offset = searchParams.get("offset") ?? "0";

    const res = await backendFetch(
      `/api/v1/users/${userId}/following?limit=${limit}&offset=${offset}&viewer_id=${userId}`,
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
