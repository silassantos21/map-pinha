import { useQuery } from "@tanstack/react-query";

import { fetchPois } from "@/lib/api-client";
import { useMapStore } from "@/stores/map-store";
import type { Poi } from "@/types/poi";

// O "structural sharing" padrão do React Query reaproveita a referência
// antiga de cada item quando o conteúdo é igual, mas compara por POSIÇÃO no
// array — o backend já devolve os POIs em ordem estável (`ORDER BY POI.id`),
// mas isso não basta: quando o autoPan do popup muda os bounds mesmo que um
// pouco, um POI pode entrar/sair da borda da área visível, deslocando a
// posição de todo mundo que vem depois dele no array — inclusive o POI que
// está com popup aberto, mesmo sem ter mudado nada nele. Resultado real
// visto em produção: o marcador/popup "piscava" e às vezes fechava sozinho.
// Casando por `id` em vez de posição, só o que de fato mudou (ou é novo)
// ganha uma referência nova.
// A tipagem de `structuralSharing` do React Query é `(unknown, unknown) =>
// unknown` (não carrega os genéricos da query) — o cast aqui dentro é seguro
// porque essa função só é usada nesta query, cujo `queryFn` sempre devolve
// `Poi[]`.
function mergePoisById(oldDataUnknown: unknown, newDataUnknown: unknown): Poi[] {
  const newData = newDataUnknown as Poi[];
  const oldData = oldDataUnknown as Poi[] | undefined;
  if (!oldData || oldData.length === 0) return newData;
  const oldById = new Map(oldData.map((poi) => [poi.id, poi]));
  return newData.map((poi) => {
    const old = oldById.get(poi.id);
    return old && JSON.stringify(old) === JSON.stringify(poi) ? old : poi;
  });
}

export function usePois(userId?: string | null) {
  const bounds = useMapStore((s) => s.mapBounds);
  const categorySlug = useMapStore((s) => s.activeCategorySlug);
  const searchQuery = useMapStore((s) => s.searchQuery);

  return useQuery<Poi[], Error>({
    // `userId` entra na queryKey (não na requisição em si — o BFF resolve o
    // usuário real pela sessão) só pra invalidar o cache quando o login muda.
    queryKey: ["pois", bounds, categorySlug, searchQuery, userId],
    queryFn: () =>
      fetchPois({
        bounds: bounds ?? undefined,
        categorySlug,
        q: searchQuery || null,
      }),
    enabled: bounds !== null,
    placeholderData: (previous) => previous,
    structuralSharing: mergePoisById,
  });
}
