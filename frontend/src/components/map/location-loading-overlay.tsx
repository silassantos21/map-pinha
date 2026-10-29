"use client";

import Image from "next/image";

interface LocationLoadingOverlayProps {
  show: boolean;
}

/** Cobre o mapa (com o fundo borrado por baixo) enquanto a geolocalização do
 * usuário ainda não resolveu pela primeira vez. */
export function LocationLoadingOverlay({ show }: LocationLoadingOverlayProps) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-[1100] flex flex-col items-center justify-center gap-3 bg-background/50 backdrop-blur-md">
      <Image
        src="/MaPinha.png"
        alt="MaPinha"
        width={64}
        height={64}
        className="size-16 animate-pulse drop-shadow-[0_0_18px_rgba(117,174,75,0.45)]"
        priority
      />
      <p className="font-display text-xs tracking-wide text-muted-foreground">
        Localizando você...
      </p>
    </div>
  );
}
