import { useQuery } from "@tanstack/react-query";

import { fetchCurrentUser } from "@/lib/api-client";
import type { CurrentUser } from "@/types/poi";

/** Usuário atual vindo do banco (não da sessão NextAuth) — necessário pra
 * `avatar_choice_url`, que pode mudar a qualquer momento sem um novo login
 * (a sessão só é atualizada no login inicial, ver `auth.ts`).
 *
 * `initialData` (opcional): quando o chamador já buscou o usuário no servidor
 * (ex: `AuthButton`, pra evitar o "pisca" de mostrar a foto do Google e só
 * depois trocar pro avatar escolhido assim que o fetch do cliente resolve). */
export function useCurrentUser(enabled: boolean, initialData?: CurrentUser) {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
    enabled,
    initialData,
  });
}
