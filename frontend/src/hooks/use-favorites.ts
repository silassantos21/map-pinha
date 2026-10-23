import { useQuery } from "@tanstack/react-query";

import { fetchFavorites } from "@/lib/api-client";

export function useFavorites(enabled: boolean) {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
    enabled,
  });
}
