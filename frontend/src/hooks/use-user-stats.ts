import { useQuery } from "@tanstack/react-query";

import { fetchUserStats } from "@/lib/api-client";

export function useUserStats(enabled: boolean) {
  return useQuery({
    queryKey: ["user-stats"],
    queryFn: fetchUserStats,
    enabled,
  });
}
