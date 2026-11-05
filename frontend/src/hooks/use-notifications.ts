import { useQuery } from "@tanstack/react-query";

import { fetchNotifications } from "@/lib/api-client";

// Primeira vez que o projeto usa `refetchInterval` — sininho de notificações
// (Fase 7) não tem WebSocket por enquanto, só polling enquanto autenticado.
export function useNotifications(enabled: boolean, offset = 0) {
  return useQuery({
    queryKey: ["notifications", offset],
    queryFn: () => fetchNotifications(offset),
    enabled,
    refetchInterval: enabled ? 30_000 : false,
  });
}
