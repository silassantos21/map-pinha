import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api-server";

// Pública, sem login — usada tanto pela página de compartilhamento
// (`/p/[slug]`, via Server Component, direto no `backendFetch`) quanto pelo
// deep-link `?poi=slug` no mapa principal (via `fetch` do lado do cliente,
// que precisa desse proxy porque o navegador não tem o INTERNAL_API_SECRET).
export async function GET(request: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const res = await backendFetch(`/api/v1/pois/by-slug/${encodeURIComponent(params.slug)}`);
  if (!res.ok) {
    return NextResponse.json({ detail: "Marcador not found" }, { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
}
