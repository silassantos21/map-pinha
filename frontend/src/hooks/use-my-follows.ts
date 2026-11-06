import { useQuery } from "@tanstack/react-query";

import { fetchMyFollowers, fetchMyFollowing } from "@/lib/api-client";

// Mesmo esquema de paginação "lista crescente por `limit`" do sininho de
// notificações (`use-notifications.ts`) — nunca um `offset` por página, que
// tinha um bug real lá (página vazia sem volta ao esgotar os itens).
export function useMyFollowers(enabled: boolean, limit = 20) {
  return useQuery({
    queryKey: ["my-followers", limit],
    queryFn: () => fetchMyFollowers(limit),
    enabled,
  });
}

export function useMyFollowing(enabled: boolean, limit = 20) {
  return useQuery({
    queryKey: ["my-following", limit],
    queryFn: () => fetchMyFollowing(limit),
    enabled,
  });
}
