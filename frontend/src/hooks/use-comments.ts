import { useQuery } from "@tanstack/react-query";

import { fetchComments } from "@/lib/api-client";

// `limit` crescente (não `offset` por página) — mesma lição já corrigida em
// `use-notifications.ts`: evita a lista ficar presa numa "página vazia" ao
// esgotar os itens.
export function useComments(poiId: string | null, limit = 20) {
  return useQuery({
    queryKey: ["comments", poiId, limit],
    queryFn: () => fetchComments(poiId as string, limit),
    enabled: poiId !== null,
  });
}
