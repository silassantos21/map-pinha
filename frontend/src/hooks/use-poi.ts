import { useQuery } from "@tanstack/react-query";

import { fetchPoiById } from "@/lib/api-client";

export function usePoi(id: string | null, userId?: string | null) {
  return useQuery({
    // `userId` entra na queryKey (não na requisição em si — o BFF resolve o
    // usuário real pela sessão) só pra invalidar o cache quando o login muda.
    queryKey: ["poi", id, userId],
    queryFn: () => fetchPoiById(id as string),
    enabled: id !== null,
  });
}
