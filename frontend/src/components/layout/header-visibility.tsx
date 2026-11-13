"use client";

import { cn } from "cn";
import type { ReactNode } from "react";

import { useMapStore } from "@/stores/map-store";

interface HeaderVisibilityProps {
  children: ReactNode;
}

/** Esconde o cabeçalho do mapa (busca, chips de categoria, sino, avatar)
 * enquanto o formulário de criar/editar POI está aberto — só no mobile
 * (`max-sm:`, mesmo breakpoint de 640px usado em `useMediaQuery` por toda a
 * Sheet), pra abrir mais espaço de mapa pra marcar a posição. No desktop o
 * formulário abre como painel lateral e não compete por altura de mapa,
 * então o cabeçalho continua sempre visível lá. Substitui o `<div>` que
 * antes só tinha as classes de posicionamento, sem nenhuma condicional —
 * `AppShell` é Server Component e não pode ler o `useMapStore` direto. */
export function HeaderVisibility({ children }: HeaderVisibilityProps) {
  const isCreatingPoi = useMapStore((s) => s.isCreatingPoi);
  const editingPoiId = useMapStore((s) => s.editingPoiId);
  const isPoiFormOpen = isCreatingPoi || editingPoiId !== null;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))]",
        isPoiFormOpen && "max-sm:hidden",
      )}
    >
      {children}
    </div>
  );
}
