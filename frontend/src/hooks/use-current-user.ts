import { useQuery } from "@tanstack/react-query";

import { fetchCurrentUser } from "@/lib/api-client";

/** Usuário atual vindo do banco (não da sessão NextAuth) — necessário pra
 * `avatar_choice_url`, que pode mudar a qualquer momento sem um novo login
 * (a sessão só é atualizada no login inicial, ver `auth.ts`). */
export function useCurrentUser(enabled: boolean) {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
    enabled,
  });
}
