import { NextResponse } from "next/server";

import { ApiError, backendFetch, forwardJsonOr204, requireSessionUserId } from "@/lib/api-server";

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const inviterId = await requireSessionUserId();
    const body = await request.json();

    const res = await backendFetch(`/api/v1/groups/${params.id}/members`, {
      method: "POST",
      body: JSON.stringify({ ...body, inviter_id: inviterId }),
    });
    return forwardJsonOr204(res);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }
    throw error;
  }
}
