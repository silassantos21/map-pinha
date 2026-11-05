import { NextResponse } from "next/server";

import { ApiError, backendFetch, requireSessionUserId } from "@/lib/api-server";

export async function POST() {
  try {
    const userId = await requireSessionUserId();

    const res = await backendFetch(`/api/v1/notifications/read-all?user_id=${userId}`, {
      method: "POST",
    });
    return new NextResponse(null, { status: res.status });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }
    throw error;
  }
}
