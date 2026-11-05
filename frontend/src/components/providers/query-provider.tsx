"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            // Padrão do React Query refaz toda query ativa (montada na tela)
            // quando a janela "recupera o foco" — no mobile, fechar o teclado
            // virtual (ex: X do painel de busca) conta como isso em vários
            // navegadores, disparando um monte de requisições de uma vez
            // (POIs do mapa inclusive, dando a sensação de "mapa recarregando")
            // sem o usuário ter mexido em nada. A app já invalida o que precisa
            // explicitamente depois de cada mutação (ver `invalidateQueries`
            // nos componentes), então esse refetch automático é só ruído.
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
