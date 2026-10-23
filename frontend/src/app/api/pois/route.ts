import { NextResponse } from "next/server";

import { ApiError, backendFetch, getSessionUserId, requireSessionUserId } from "@/lib/api-server";

const FORWARDED_QUERY_PARAMS = ["min_lat", "min_lng", "max_lat", "max_lng", "category_slug", "q"];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = await getSessionUserId();

    const params = new URLSearchParams();
    for (const key of FORWARDED_QUERY_PARAMS) {
      const value = searchParams.get(key);
      if (value !== null) params.set(key, value);
    }
    // `user_id` vem só da sessão autenticada no servidor — nunca do cliente,
    // senão qualquer um poderia pedir o UUID de outra pessoa e ver POIs
    // privados que não são dela.
    if (userId) params.set("user_id", userId);

    const res = await backendFetch(`/api/v1/pois?${params.toString()}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireSessionUserId();
    const body = await request.json();

    const res = await backendFetch("/api/v1/pois", {
      method: "POST",
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
