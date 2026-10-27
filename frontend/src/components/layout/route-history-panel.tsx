"use client";

import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouteHistory } from "@/hooks/use-route-history";
import { useMapStore } from "@/stores/map-store";

interface RouteHistoryPanelProps {
  isAuthenticated: boolean;
}

export function RouteHistoryPanel({ isAuthenticated }: RouteHistoryPanelProps) {
  const { data: history = [] } = useRouteHistory(isAuthenticated);
  const startRouteTo = useMapStore((s) => s.startRouteTo);

  if (!isAuthenticated) return null;

  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger render={<span className="pointer-events-auto inline-flex" />}>
          <SheetTrigger
            render={
              <Button
                size="icon-lg"
                variant="secondary"
                className="pointer-events-auto rounded-full shadow-lg"
              />
            }
          >
            <History />
            <span className="sr-only">Abrir minhas rotas</span>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">Minhas rotas</TooltipContent>
      </Tooltip>

      <SheetContent>
        <SheetHeader>
          <SheetTitle className="font-display">Minhas rotas</SheetTitle>
          <SheetDescription>
            {history.length > 0
              ? `${history.length} rota(s) calculada(s) recentemente — toque pra traçar de novo.`
              : 'Nenhuma rota ainda. Toque em "Como chegar" num POI pra calcular uma.'}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 overflow-y-auto px-4">
          {history.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() =>
                startRouteTo({
                  id: entry.poi_id,
                  name: entry.poi_name,
                  lat: entry.poi_lat,
                  lng: entry.poi_lng,
                })
              }
              className="rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-muted"
            >
              <p className="text-sm font-medium text-foreground">{entry.poi_name}</p>
              <p className="text-xs text-muted-foreground">
                {(entry.distance_m / 1000).toFixed(1)} km ·{" "}
                {Math.max(1, Math.round(entry.duration_s / 60))} min
              </p>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
