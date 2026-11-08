import { NextResponse } from "next/server";

import { ApiError, backendFetch, forwardJsonOr204, requireSessionUserId } from "@/lib/api-server";

export async function DELETE(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const userId = await requireSessionUserId();
    const res = await backendFetch(`/api/v1/comments/${params.id}?user_id=${userId}`, {
      method: "DELETE",
    });
    return forwardJsonOr204(res);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }
    throw error;
  }
}
