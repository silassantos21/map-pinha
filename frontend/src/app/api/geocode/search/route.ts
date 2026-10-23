import { NextResponse } from "next/server";

import { NOMINATIM_USER_AGENT } from "@/lib/nominatim";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length < 3) {
    return NextResponse.json({ detail: "q precisa ter pelo menos 3 caracteres" }, { status: 400 });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=1&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": NOMINATIM_USER_AGENT },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({ result: null });
    }

    const data = await res.json();
    const first = Array.isArray(data) ? data[0] : null;
    if (!first || typeof first.lat !== "string" || typeof first.lon !== "string") {
      return NextResponse.json({ result: null });
    }

    return NextResponse.json({
      result: {
        lat: parseFloat(first.lat),
        lng: parseFloat(first.lon),
        address: typeof first.display_name === "string" ? first.display_name : q,
      },
    });
  } catch {
    // Geocodificação é um bônus de UX, não pode travar o formulário.
    return NextResponse.json({ result: null });
  }
}
