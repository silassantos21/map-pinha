import { useQuery } from "@tanstack/react-query";

import { fetchUserProfile } from "@/lib/api-client";

export function useUserProfile(userId: string | null) {
  return useQuery({
    queryKey: ["user-profile", userId],
    queryFn: () => fetchUserProfile(userId as string),
    enabled: userId !== null,
  });
}
