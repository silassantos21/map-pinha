import { NextResponse } from "next/server";

import { ApiError, backendFetch, requireSessionUserId } from "@/lib/api-server";

export async function POST(request: Request) {
  try {
    const userId = await requireSessionUserId();
    const body = await request.json();

    const res = await backendFetch(`/api/v1/users/${userId}/avatar/presigned-url`, {
      method: "POST",
      body: JSON.stringify(body),
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
