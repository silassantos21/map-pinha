import { useQuery } from "@tanstack/react-query";

import { fetchPois } from "@/lib/api-client";

/** Busca global por nome (sem filtro de bounding box) — alimenta o
 * autocomplete do SearchBar, diferente de `usePois`, que só busca dentro da
 * área visível do mapa. */
export function usePoiSearch(query: string, userId?: string | null) {
  return useQuery({
    // `userId` entra na queryKey (não na requisição em si — o BFF resolve o
    // usuário real pela sessão) só pra invalidar o cache quando o login muda.
    queryKey: ["poi-search", query, userId],
    queryFn: () => fetchPois({ q: query }),
    enabled: query.trim().length >= 2,
  });
}
