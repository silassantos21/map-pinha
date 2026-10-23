import { useQuery } from "@tanstack/react-query";

import { fetchPois } from "@/lib/api-client";
import { useMapStore } from "@/stores/map-store";

export function usePois(userId?: string | null) {
  const bounds = useMapStore((s) => s.mapBounds);
  const categorySlug = useMapStore((s) => s.activeCategorySlug);
  const searchQuery = useMapStore((s) => s.searchQuery);

  return useQuery({
    // `userId` entra na queryKey (não na requisição em si — o BFF resolve o
    // usuário real pela sessão) só pra invalidar o cache quando o login muda.
    queryKey: ["pois", bounds, categorySlug, searchQuery, userId],
    queryFn: () =>
      fetchPois({
        bounds: bounds ?? undefined,
        categorySlug,
        q: searchQuery || null,
      }),
    enabled: bounds !== null,
    placeholderData: (previous) => previous,
  });
}
