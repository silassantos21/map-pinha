"use client";

import { LocateFixed, Minus, Plus } from "lucide-react";
import { useMap } from "react-leaflet";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeSwitcher } from "@/components/map/theme-switcher";

interface MapControlsProps {
  userPosition: { lat: number; lng: number } | null;
}

export function MapControls({ userPosition }: MapControlsProps) {
  const map = useMap();

  return (
    <div className="pointer-events-auto absolute bottom-24 right-4 z-[1000] flex flex-col gap-1 rounded-full border border-border bg-card/80 p-1 backdrop-blur-md">
      <ThemeSwitcher />

      <div className="h-px bg-border" />

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              disabled={!userPosition}
              onClick={() => {
                if (userPosition) {
                  map.flyTo([userPosition.lat, userPosition.lng], 15, {
                    duration: 1,
                  });
                }
              }}
              aria-label="Centralizar na minha localização"
            />
          }
        >
          <LocateFixed className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="left">Centralizar na minha localização</TooltipContent>
      </Tooltip>

      <div className="h-px bg-border" />

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={() => map.zoomIn()}
              aria-label="Aumentar zoom"
            />
          }
        >
          <Plus className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="left">Aumentar zoom</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={() => map.zoomOut()}
              aria-label="Diminuir zoom"
            />
          }
        >
          <Minus className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="left">Diminuir zoom</TooltipContent>
      </Tooltip>
    </div>
  );
}
