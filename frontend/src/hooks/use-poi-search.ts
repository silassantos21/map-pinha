import { useQuery } from "@tanstack/react-query";

import { fetchPois } from "@/lib/api-client";

/** Busca global por nome (sem filtro de bounding box) — alimenta o
 * autocomplete do SearchBar, diferente de `usePois`, que só busca dentro da
 * área visível do mapa.
 *
 * `enabled` (padrão `true`): a SearchBar passa `false` quando o
 * dropdown/painel de busca está fechado — sem isso, uma mudança de
 * `mapBounds` depois de fechar a busca (ex: o teclado abrindo/fechando, ver
 * `app-shell.tsx`) não refaz esta query (ela não depende de bounds), mas
 * mantém o padrão simétrico com `useAddressSearch`. */
export function usePoiSearch(query: string, userId?: string | null, enabled = true) {
  return useQuery({
    // `userId` entra na queryKey (não na requisição em si — o BFF resolve o
    // usuário real pela sessão) só pra invalidar o cache quando o login muda.
    queryKey: ["poi-search", query, userId],
    queryFn: () => fetchPois({ q: query }),
    enabled: enabled && query.trim().length >= 2,
  });
}
