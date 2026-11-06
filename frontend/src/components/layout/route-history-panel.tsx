"use client";

import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MotionListItem } from "@/components/ui/motion-list-item";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCategories } from "@/hooks/use-categories";
import { useRouteHistory } from "@/hooks/use-route-history";
import { getCategoryIcon } from "@/lib/poi-icons";
import { useMapStore } from "@/stores/map-store";

interface RouteHistoryPanelProps {
  isAuthenticated: boolean;
}

export function RouteHistoryPanel({ isAuthenticated }: RouteHistoryPanelProps) {
  const { data: history = [] } = useRouteHistory(isAuthenticated);
  const { data: categories } = useCategories();
  const startRouteTo = useMapStore((s) => s.startRouteTo);

  const categoryById = new Map((categories ?? []).map((c) => [c.id, c]));

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
          {history.map((entry, index) => {
            const category = categoryById.get(entry.poi_category_id);
            const Icon = getCategoryIcon(category);
            const categoryColor = category?.color_hex ?? "var(--border)";
            return (
              <MotionListItem key={entry.id} index={index}>
                <button
                  type="button"
                  onClick={() =>
                    startRouteTo({
                      id: entry.poi_id,
                      name: entry.poi_name,
                      lat: entry.poi_lat,
                      lng: entry.poi_lng,
                    })
                  }
                  className="flex w-full items-center gap-2 rounded-lg border border-border border-l-4 bg-card p-3 text-left transition-colors hover:bg-muted"
                  style={{ borderLeftColor: categoryColor }}
                >
                  <Icon className="size-4 shrink-0" style={{ color: categoryColor }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{entry.poi_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(entry.distance_m / 1000).toFixed(1)} km ·{" "}
                      {Math.max(1, Math.round(entry.duration_s / 60))} min
                    </p>
                  </div>
                </button>
              </MotionListItem>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
