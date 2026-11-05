import { NextResponse } from "next/server";

import { ApiError, backendFetch, requireSessionUserId } from "@/lib/api-server";

export async function POST(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const followerId = await requireSessionUserId();

    const res = await backendFetch(
      `/api/v1/users/${params.id}/follow?follower_id=${followerId}`,
      { method: "POST" },
    );
    return new NextResponse(null, { status: res.status });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const followerId = await requireSessionUserId();

    const res = await backendFetch(
      `/api/v1/users/${params.id}/follow?follower_id=${followerId}`,
      { method: "DELETE" },
    );
    return new NextResponse(null, { status: res.status });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }
    throw error;
  }
}
