import { NextResponse } from "next/server";

import { ApiError, backendFetch, forwardJsonOr204, requireSessionUserId } from "@/lib/api-server";

// Cobre recusar convite, sair do grupo (requester === userId do path) e o
// dono remover alguém (requester === owner) — mesmo endpoint no backend.
export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string; userId: string }> },
) {
  const params = await props.params;
  try {
    const requesterId = await requireSessionUserId();
    const res = await backendFetch(
      `/api/v1/groups/${params.id}/members/${params.userId}?requester_id=${requesterId}`,
      { method: "DELETE" },
    );
    return forwardJsonOr204(res);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }
    throw error;
  }
}
