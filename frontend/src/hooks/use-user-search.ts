import { useQuery } from "@tanstack/react-query";

import { searchUsers } from "@/lib/api-client";

export function useUserSearch(query: string, enabled = true) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["user-search", trimmed],
    queryFn: () => searchUsers(trimmed),
    enabled: enabled && trimmed.length >= 2,
  });
}
