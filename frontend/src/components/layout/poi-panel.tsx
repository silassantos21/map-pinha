"use client";

import { List } from "lucide-react";

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
import { useCategories } from "@/hooks/use-categories";
import { usePois } from "@/hooks/use-pois";
import { useMapStore } from "@/stores/map-store";

interface PoiPanelProps {
  userId?: string | null;
}

export function PoiPanel({ userId }: PoiPanelProps) {
  const { data: pois = [] } = usePois(userId);
  const { data: categories } = useCategories();
  const flyToPoi = useMapStore((s) => s.flyToPoi);

  const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]));

  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger render={<span className="pointer-events-auto inline-flex" />}>
          <SheetTrigger
            render={
              <Button
                size="icon-lg"
                className="pointer-events-auto rounded-full shadow-lg"
              />
            }
          >
            <List />
            <span className="sr-only">Abrir lista de POIs</span>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">Lista de POIs próximos</TooltipContent>
      </Tooltip>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="font-display">POIs próximos</SheetTitle>
          <SheetDescription>
            {pois.length > 0
              ? `${pois.length} POI(s) na área visível do mapa.`
              : "Nenhum POI na área visível — ajuste o mapa ou crie um novo."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 overflow-y-auto px-4">
          {pois.map((poi) => (
            <button
              key={poi.id}
              type="button"
              onClick={() => flyToPoi({ id: poi.id, lat: poi.lat, lng: poi.lng })}
              className="rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-muted"
            >
              <p className="text-sm font-medium text-foreground">{poi.name}</p>
              <p className="text-xs text-muted-foreground">
                {categoryNameById.get(poi.category_id) ?? "Sem categoria"}
              </p>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
