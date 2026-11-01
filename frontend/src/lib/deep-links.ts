import type { LatLng, RouteProfile } from "@/types/poi";

export function googleMapsUrl(origin: LatLng, destination: LatLng, profile: RouteProfile): string {
  const params = new URLSearchParams({
    api: "1",
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    travelmode: profile === "walking" ? "walking" : "driving",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Link "ver local" sem origem — pra contextos onde não temos (nem faz
 * sentido pedir) a localização de quem está olhando, como a página pública
 * de compartilhamento de um POI (Sprint 6). Deixa o próprio Google Maps
 * decidir a origem (posição atual de quem abrir o link). */
export function googleMapsSearchUrl(destination: LatLng): string {
  const params = new URLSearchParams({
    api: "1",
    query: `${destination.lat},${destination.lng}`,
  });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export function appleMapsUrl(origin: LatLng, destination: LatLng, profile: RouteProfile): string {
  const params = new URLSearchParams({
    saddr: `${origin.lat},${origin.lng}`,
    daddr: `${destination.lat},${destination.lng}`,
    dirflg: profile === "walking" ? "w" : "d",
  });
  return `https://maps.apple.com/?${params.toString()}`;
}

/** Só pra mostrar o botão "Abrir no Apple Maps" quando faz sentido —
 * em outras plataformas o link funciona, mas não tem motivo pra oferecer. */
export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
}
