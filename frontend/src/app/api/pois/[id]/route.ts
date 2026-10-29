import { NextResponse } from "next/server";

import { ApiError, backendFetch, getSessionUserId, requireSessionUserId } from "@/lib/api-server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, props: RouteParams) {
  const params = await props.params;
  try {
    const userId = await getSessionUserId();
    const query = userId ? `?user_id=${userId}` : "";

    const res = await backendFetch(`/api/v1/pois/${params.id}${query}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function PUT(request: Request, props: RouteParams) {
  const params = await props.params;
  try {
    const userId = await requireSessionUserId();
    const body = await request.json();

    const res = await backendFetch(`/api/v1/pois/${params.id}`, {
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

export async function DELETE(_request: Request, props: RouteParams) {
  const params = await props.params;
  try {
    const userId = await requireSessionUserId();

    const res = await backendFetch(`/api/v1/pois/${params.id}?user_id=${userId}`, {
      method: "DELETE",
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
