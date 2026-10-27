import { useQuery } from "@tanstack/react-query";

import { fetchRouteHistory } from "@/lib/api-client";

export function useRouteHistory(enabled: boolean) {
  return useQuery({
    queryKey: ["route-history"],
    queryFn: fetchRouteHistory,
    enabled,
  });
}
