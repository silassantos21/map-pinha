import { NextResponse } from "next/server";

import { NOMINATIM_USER_AGENT } from "@/lib/nominatim";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ detail: "lat e lng são obrigatórios" }, { status: 400 });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": NOMINATIM_USER_AGENT },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({ address: null }, { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json({ address: typeof data.display_name === "string" ? data.display_name : null });
  } catch {
    // Geocodificação é um bônus de UX, não pode travar o formulário.
    return NextResponse.json({ address: null }, { status: 200 });
  }
}
