import { NextResponse } from "next/server";

import { ApiError, backendFetch, forwardJsonOr204, requireSessionUserId } from "@/lib/api-server";

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const userId = await requireSessionUserId();
    const res = await backendFetch(`/api/v1/groups/${params.id}?user_id=${userId}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const userId = await requireSessionUserId();
    const body = await request.json();

    const res = await backendFetch(`/api/v1/groups/${params.id}`, {
      method: "PUT",
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

export async function DELETE(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const userId = await requireSessionUserId();
    const res = await backendFetch(`/api/v1/groups/${params.id}?user_id=${userId}`, {
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
