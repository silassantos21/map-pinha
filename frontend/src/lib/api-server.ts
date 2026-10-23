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
