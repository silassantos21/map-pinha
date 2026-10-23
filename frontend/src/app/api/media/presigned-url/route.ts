import { NextResponse } from "next/server";

import { ApiError, backendFetch, requireSessionUserId } from "@/lib/api-server";

export async function POST(request: Request) {
  try {
    // Só confirma que há sessão ativa — o presigned URL em si não carrega
    // user_id (isso só importa no momento de anexar a mídia ao POI).
    await requireSessionUserId();
    const body = await request.json();

    const res = await backendFetch("/api/v1/media/presigned-url", {
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
