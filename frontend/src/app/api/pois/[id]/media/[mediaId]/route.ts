import { NextResponse } from "next/server";

import { ApiError, backendFetch, requireSessionUserId } from "@/lib/api-server";

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string; mediaId: string }> }
) {
  const params = await props.params;
  try {
    const userId = await requireSessionUserId();

    const res = await backendFetch(
      `/api/v1/pois/${params.id}/media/${params.mediaId}?user_id=${userId}`,
      { method: "DELETE" },
    );
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
