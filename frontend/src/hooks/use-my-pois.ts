import { useQuery } from "@tanstack/react-query";

import { fetchMyPois } from "@/lib/api-client";

export function useMyPois(enabled: boolean) {
  return useQuery({
    queryKey: ["my-pois"],
    queryFn: fetchMyPois,
    enabled,
  });
}
