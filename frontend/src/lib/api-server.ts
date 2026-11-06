import { NextResponse } from "next/server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Lê a sessão NextAuth no servidor e devolve o user_id real (sincronizado no
 * Postgres). Usado pelos Route Handlers que fazem de proxy confiável para o
 * FastAPI — o navegador nunca vê o INTERNAL_API_SECRET nem escolhe o
 * user_id livremente.
 */
export async function requireSessionUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new ApiError(401, "Not authenticated");
  }
  return userId;
}

/**
 * Como `requireSessionUserId`, mas devolve `null` em vez de lançar quando não
 * há sessão — para rotas de leitura que também devem funcionar sem login
 * (ex: ver POIs públicos no mapa sem estar autenticado).
 */
export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Secret": process.env.INTERNAL_API_SECRET ?? "",
      ...init.headers,
    },
  });
}

/**
 * Repassa a resposta do backend tal qual: corpo vazio em 204 (`res.json()`
 * quebraria, não tem corpo pra ler), senão o JSON — incluindo erros com
 * `{detail: "..."}` (ex: convite duplicado, 400), que o frontend precisa
 * pra mostrar a mensagem certa em vez de um genérico. Endpoints de grupo
 * (Fase 7 Parte 2) costumam devolver 204 no sucesso mas 400/403/404 com
 * corpo no erro — sem isso, um `new NextResponse(null, {status})` simples
 * descartaria a mensagem de erro do backend.
 */
export async function forwardJsonOr204(res: Response): Promise<NextResponse> {
  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
