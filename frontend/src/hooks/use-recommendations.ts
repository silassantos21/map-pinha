import { useQuery } from "@tanstack/react-query";

import { fetchRecommendations } from "@/lib/api-client";
import type { LatLng } from "@/types/poi";

// Chave arredondada a ~100m: evita refazer a query (e gastar chamada de IA)
// por causa de pequenas variações do GPS enquanto o painel "Explorar" está
// aberto — o backend também cacheia no Redis com a mesma granularidade.
export function useRecommendations(origin: LatLng | null, enabled: boolean) {
  const roundedLat = origin ? origin.lat.toFixed(3) : null;
  const roundedLng = origin ? origin.lng.toFixed(3) : null;

  return useQuery({
    queryKey: ["ai-recommendations", roundedLat, roundedLng],
    queryFn: () => fetchRecommendations(origin as LatLng),
    enabled: enabled && origin !== null,
  });
}
