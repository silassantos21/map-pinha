import { NextResponse } from "next/server";

import { ApiError, backendFetch, forwardJsonOr204, requireSessionUserId } from "@/lib/api-server";

// Só aceita o próprio convite — por isso não recebe nenhum id de usuário no
// corpo nem na URL, resolve tudo da sessão.
export async function POST(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const userId = await requireSessionUserId();
    const res = await backendFetch(
      `/api/v1/groups/${params.id}/members/${userId}/accept?user_id=${userId}`,
      { method: "POST" },
    );
    return forwardJsonOr204(res);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }
    throw error;
  }
}
