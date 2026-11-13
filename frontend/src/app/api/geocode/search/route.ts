import { NextResponse } from "next/server";

import { NOMINATIM_USER_AGENT } from "@/lib/nominatim";

const MAX_RESULTS = 5;
// Formato esperado: "minLng,maxLat,maxLng,minLat" (4 números), igual o
// parâmetro `viewbox` do próprio Nominatim espera (left,top,right,bottom).
const VIEWBOX_PATTERN = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;

interface NominatimResult {
  lat: number;
  lng: number;
  address: string;
}

async function fetchNominatim(q: string, limit: number, viewbox: string | null): Promise<NominatimResult[]> {
  const params = new URLSearchParams({
    format: "jsonv2",
    q,
    limit: String(limit),
    addressdetails: "1",
  });
  if (viewbox) params.set("viewbox", viewbox);

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { "User-Agent": NOMINATIM_USER_AGENT },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return [];

  const data = await res.json();
  if (!Array.isArray(data)) return [];

  return data
    .filter(
      (item): item is { lat: string; lon: string; display_name?: string } =>
        typeof item.lat === "string" && typeof item.lon === "string",
    )
    .map((item) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      address: typeof item.display_name === "string" ? item.display_name : q,
    }));
}

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Complementos como "Lj 3"/"Loja 12"/"Sala 4"/"Apto 101"/"Bloco B" não têm
// correspondência num logradouro do OSM e derrubam a busca inteira no
// Nominatim — confirmado testando contra a API real com o endereço
// "Av. Sinfrônio Brochado, 1420 - Lj 3 - Barreiro, Belo Horizonte - MG,
// 30640-000" (copiado do Google Maps): a busca com a string completa
// retorna vazio, mas sem acento e sem "Lj 3" (mantendo número, CEP e
// bairro) encontra a rua normalmente. O acento sozinho também já quebra a
// busca em alguns casos (tokenização do Nominatim não normaliza de forma
// simétrica) — por isso o fallback remove os dois de uma vez.
const COMPLEMENT_PATTERN =
  /[-,]?\s*\b(lj|loja|sala|apto|apartamento|bloco|conj|conjunto|casa|andar)\.?\s*\d+\w*\b\s*[-,]?/gi;

function simplifyAddressQuery(value: string): string {
  return stripDiacritics(value)
    .replace(COMPLEMENT_PATTERN, ", ")
    .replace(/,\s*,+/g, ",")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,-]+|[\s,-]+$/g, "")
    .trim();
}

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
    let results = await fetchNominatim(q, limit, viewbox);

    if (results.length === 0) {
      const simplified = simplifyAddressQuery(q);
      if (simplified && simplified.toLowerCase() !== q.toLowerCase()) {
        results = await fetchNominatim(simplified, limit, viewbox);
      }
    }

    return NextResponse.json({ results });
  } catch {
    // Geocodificação é um bônus de UX, não pode travar o formulário nem a busca.
    return NextResponse.json({ results: [] });
  }
}
