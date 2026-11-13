import { handlers } from "@/auth";

// Default da Vercel (10s) é menor que o cold start do backend (Render Free,
// até ~50s) — o callback de login chama o backend de forma síncrona pra
// sincronizar o usuário, então o default matava a função antes do abort
// interno (20s, ver `auth.ts`) ter chance de rodar.
export const maxDuration = 30;

export const { GET, POST } = handlers;
