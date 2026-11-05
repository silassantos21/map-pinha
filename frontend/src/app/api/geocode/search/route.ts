import { NextResponse } from "next/server";

import { NOMINATIM_USER_AGENT } from "@/lib/nominatim";

const MAX_RESULTS = 5;
// Formato esperado: "minLng,maxLat,maxLng,minLat" (4 números), igual o
// parâmetro `viewbox` do próprio Nominatim espera (left,top,right,bottom).
const VIEWBOX_PATTERN = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const requestedLimit = Number(searchParams.get("limit"));
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, MAX_RESULTS)
    : 1;
  const viewboxParam = searchParams.get("viewbox");
  const viewbox = viewboxParam && VIEWBOX_PATTERN.test(viewboxParam) ? viewboxParam : null;

  if (!q || q.trim().length < 3) {
    return NextResponse.json({ results: [] });
  }

  try {
    // `viewbox` (sem `bounded=1`): prioriza o que está perto da área visível
    // do mapa, sem excluir o resto do mundo — testado empiricamente (ver
    // SPRINTS.md): sozinho já resolve buscas curtas e ambíguas (ex.:
    // "Barreiro" perto de BH volta Belo Horizonte antes de Portugal/Cabo
    // Verde), sem precisar fixar um país. Funciona pra qualquer lugar do
    // mundo onde o usuário estiver navegando no mapa, não só o Brasil.
    const params = new URLSearchParams({
      format: "jsonv2",
      q,
      limit: String(limit),
      addressdetails: "1",
    });
    if (viewbox) params.set("viewbox", viewbox);

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    const res = await fetch(url, {
      headers: { "User-Agent": NOMINATIM_USER_AGENT },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();
    const results = Array.isArray(data)
      ? data
          .filter(
            (item): item is { lat: string; lon: string; display_name?: string } =>
              typeof item.lat === "string" && typeof item.lon === "string",
          )
          .map((item) => ({
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            address: typeof item.display_name === "string" ? item.display_name : q,
          }))
      : [];

    return NextResponse.json({ results });
  } catch {
    // Geocodificação é um bônus de UX, não pode travar o formulário nem a busca.
    return NextResponse.json({ results: [] });
  }
}
