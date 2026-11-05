import { useQuery } from "@tanstack/react-query";

import { searchAddresses } from "@/lib/api-client";
import type { MapBounds } from "@/types/poi";

/** Busca de endereços/lugares genéricos (Nominatim) — alimenta a SearchBar
 * principal junto com `usePoiSearch` (Fase 8). Limiar de 3 caracteres é o
 * mínimo que o próprio Nominatim/endpoint de geocodificação já exige.
 * `viewbox` prioriza resultados perto da área visível do mapa (evita o caso
 * de uma busca curta como "Barreiro" devolver um bairro em Portugal).
 *
 * `enabled` (padrão `true`): a SearchBar passa `false` quando o
 * dropdown/painel de busca está fechado — a queryKey inclui `viewbox`, então
 * sem isso uma mudança de `mapBounds` depois de fechar a busca (ex: o
 * teclado abrindo/fechando, ver `app-shell.tsx`) refazia a busca pro
 * Nominatim escondida, sem ninguém olhando o resultado. */
export function useAddressSearch(query: string, viewbox?: MapBounds | null, enabled = true) {
  return useQuery({
    queryKey: ["address-search", query, viewbox],
    queryFn: () => searchAddresses(query, viewbox),
    enabled: enabled && query.trim().length >= 3,
  });
}
