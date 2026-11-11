import { createContext, useContext } from "react";

import type { CurrentUser } from "../types/api";

// Token + usuário atual compartilhados por todas as telas que precisam
// autenticar chamadas (Partes 3/4/5) — evita passar `token`/`selfUserId` como
// prop manualmente por toda a árvore de navegação.
export interface AuthContextValue {
  token: string;
  currentUser: CurrentUser;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth() usado fora do AuthContext.Provider");
  }
  return ctx;
}
