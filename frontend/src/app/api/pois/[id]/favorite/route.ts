import { NextResponse } from "next/server";

import { ApiError, backendFetch, requireSessionUserId } from "@/lib/api-server";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireSessionUserId();

    const res = await backendFetch(`/api/v1/pois/${params.id}/favorite?user_id=${userId}`, {
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

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireSessionUserId();

    const res = await backendFetch(`/api/v1/pois/${params.id}/favorite?user_id=${userId}`, {
      method: "DELETE",
    });
    return new NextResponse(null, { status: res.status });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }
    throw error;
  }
}
