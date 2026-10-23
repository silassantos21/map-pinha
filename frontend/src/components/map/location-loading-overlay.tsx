"use client";

import { Loader2 } from "lucide-react";

interface LocationLoadingOverlayProps {
  show: boolean;
}

/** Cobre o mapa (com o fundo borrado por baixo) enquanto a geolocalização do
 * usuário ainda não resolveu pela primeira vez. Por enquanto só um spinner —
 * fica reservado pra receber a logo do app aqui no lugar do ícone depois. */
export function LocationLoadingOverlay({ show }: LocationLoadingOverlayProps) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-[1100] flex flex-col items-center justify-center gap-3 bg-background/50 backdrop-blur-md">
      <Loader2 className="size-10 animate-spin text-primary" />
      <p className="font-display text-xs tracking-wide text-muted-foreground">
        Localizando você...
      </p>
    </div>
  );
}
