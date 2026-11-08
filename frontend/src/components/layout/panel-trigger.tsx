"use client";

import type { ComponentType, MouseEvent } from "react";

import { TabBarButton } from "@/components/layout/tab-bar-item";
import { Button } from "@/components/ui/button";
import { SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface PanelTriggerProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
}

/** Gatilho (`SheetTrigger`) dos 4 painéis do rodapé (Social, Grupos, Rotas,
 * Ver POIs) — compartilhado pra não duplicar a mesma lógica responsiva 4x.
 * Mobile: barra de navegação com ícone+rótulo (`TabBarButton`). Desktop:
 * cluster compacto só-ícone, igual era antes da reorganização do HUD
 * (08/11/2026) — na primeira versão dessa reorganização a barra cheia
 * também apareceu no desktop e tampava mapa demais, revertido a pedido do
 * dono do projeto. `disabled` (quando exige login e ninguém está logado)
 * nunca usa o atributo `disabled` real — isso tiraria `pointer-events` e o
 * tooltip de aviso nunca abriria no hover (mesmo truque de sempre, ver
 * `poi-create-button-client.tsx`). */
export function PanelTrigger({ icon: Icon, label, disabled = false, disabledReason }: PanelTriggerProps) {
  const isMobile = useMediaQuery("(max-width: 639px)");

  if (isMobile) {
    const button = (
      <SheetTrigger render={<TabBarButton disabled={disabled} aria-label={label} />}>
        <Icon className="size-5" />
        {label}
      </SheetTrigger>
    );
    if (!disabled) return button;
    return (
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex flex-1" />}>{button}</TooltipTrigger>
        <TooltipContent side="top">{disabledReason ?? "Entre com sua conta pra ver"}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="pointer-events-auto inline-flex" />}>
        <SheetTrigger
          render={
            <Button
              size="icon-lg"
              variant="secondary"
              aria-disabled={disabled ? "true" : undefined}
              onClick={disabled ? (event: MouseEvent<HTMLButtonElement>) => event.preventDefault() : undefined}
              className={cn(
                "pointer-events-auto rounded-full shadow-lg",
                disabled && "cursor-not-allowed opacity-50",
              )}
            />
          }
        >
          <Icon />
          <span className="sr-only">{label}</span>
        </SheetTrigger>
      </TooltipTrigger>
      <TooltipContent side="left">{disabled ? (disabledReason ?? "Entre com sua conta pra ver") : label}</TooltipContent>
    </Tooltip>
  );
}
