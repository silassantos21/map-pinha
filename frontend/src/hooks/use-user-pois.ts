import { useQuery } from "@tanstack/react-query";

import { fetchUserPois } from "@/lib/api-client";

export function useUserPois(userId: string | null) {
  return useQuery({
    queryKey: ["user-pois", userId],
    queryFn: () => fetchUserPois(userId as string),
    enabled: userId !== null,
  });
}
