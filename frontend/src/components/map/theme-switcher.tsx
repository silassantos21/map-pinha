"use client";

import { Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MAP_THEME_LIST } from "@/lib/map-themes";
import { cn } from "@/lib/utils";
import { useMapStore } from "@/stores/map-store";

/** Botão "camadas" isolado na coluna de controles do mapa (reorganização do
 * HUD, 08/11/2026) — antes era uma pill com todas as bolinhas de tema sempre
 * visíveis dentro do `HudHeader`. Agora mora dentro do Leaflet, junto de
 * `MapControls` (locate/zoom), e abre um popover com as opções ao clicar —
 * mesmo `activeTheme`/`setActiveTheme` de sempre, só 1 clique a mais pra
 * trocar de tema (trade-off aceito a favor de uma coluna mais enxuta, igual
 * ao botão de camadas do Google Maps). */
export function ThemeSwitcher() {
  const activeTheme = useMapStore((s) => s.activeTheme);
  const setActiveTheme = useMapStore((s) => s.setActiveTheme);

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>
          <PopoverTrigger
            render={<Button type="button" size="icon-sm" variant="ghost" aria-label="Trocar tema do mapa" />}
          >
            <Layers className="size-4" />
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">Trocar tema do mapa</TooltipContent>
      </Tooltip>

      <PopoverContent side="left" align="start" className="flex flex-col gap-0.5">
        {MAP_THEME_LIST.map((theme) => {
          const isActive = theme.id === activeTheme;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => setActiveTheme(theme.id)}
              aria-pressed={isActive}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted",
                isActive && "bg-muted",
              )}
            >
              <span className={cn(theme.accentClassName, "size-3 shrink-0 rounded-full")} />
              {theme.label}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
