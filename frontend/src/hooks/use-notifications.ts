import { useQuery } from "@tanstack/react-query";

import { fetchNotifications } from "@/lib/api-client";

// Primeira vez que o projeto usa `refetchInterval` — sininho de notificações
// (Fase 7) não tem WebSocket por enquanto, só polling enquanto autenticado.
//
// `limit` em vez de `offset`: "Carregar mais" cresce o tamanho da página
// (sempre a partir do início), não avança pra uma página seguinte — um
// `offset` por página tinha um bug real: ao esgotar os itens, a "próxima
// página" vinha vazia e não existia botão "voltar", prendendo a lista vazia
// pra sempre (mesmo com notificações existindo, só que na página anterior).
export function useNotifications(enabled: boolean, limit = 20) {
  return useQuery({
    queryKey: ["notifications", limit],
    queryFn: () => fetchNotifications(limit),
    enabled,
    refetchInterval: enabled ? 30_000 : false,
  });
}
