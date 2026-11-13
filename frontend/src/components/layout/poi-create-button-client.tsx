"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMapStore } from "@/stores/map-store";

interface PoiCreateButtonClientProps {
  isAuthenticated: boolean;
}

export function PoiCreateButtonClient({ isAuthenticated }: PoiCreateButtonClientProps) {
  const isCreatingPoi = useMapStore((s) => s.isCreatingPoi);
  const startCreatingPoi = useMapStore((s) => s.startCreatingPoi);
  const cancelCreatingPoi = useMapStore((s) => s.cancelCreatingPoi);

  if (!isAuthenticated) {
    // Sem `disabled` de verdade (isso tira o pointer-events e o hover nunca
    // dispararia o tooltip) — só aparência de desabilitado + clique inofensivo.
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="icon-lg"
              variant="secondary"
              aria-disabled="true"
              onClick={(event) => event.preventDefault()}
              className="pointer-events-auto cursor-not-allowed rounded-full opacity-50 shadow-lg"
            />
          }
        >
          <Plus />
          <span className="sr-only">Entre para criar Marcadores</span>
        </TooltipTrigger>
        <TooltipContent side="left">Entre com sua conta para criar Marcadores</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="pointer-events-auto flex flex-col items-end gap-2">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="icon-lg"
              variant={isCreatingPoi ? "destructive" : "default"}
              onClick={isCreatingPoi ? cancelCreatingPoi : startCreatingPoi}
              className="rounded-full shadow-lg"
              aria-label={isCreatingPoi ? "Cancelar criação de Marcador" : "Criar novo Marcador"}
            />
          }
        >
          {isCreatingPoi ? <X /> : <Plus />}
        </TooltipTrigger>
        <TooltipContent side="left">
          {isCreatingPoi ? "Cancelar criação" : "Criar novo Marcador"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
