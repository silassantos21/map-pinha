import { useQuery } from "@tanstack/react-query";

import { fetchRoute } from "@/lib/api-client";
import type { LatLng, RouteProfile } from "@/types/poi";

export function useRoute(
  origin: LatLng | null,
  destination: LatLng | null,
  profile: RouteProfile,
) {
  return useQuery({
    queryKey: ["route", origin, destination, profile],
    queryFn: () => fetchRoute(origin as LatLng, destination as LatLng, profile),
    enabled: origin !== null && destination !== null,
  });
}
