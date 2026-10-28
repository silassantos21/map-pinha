"use client";

import { Sparkles, UserRound } from "lucide-react";

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
import { useMyPois } from "@/hooks/use-my-pois";
import { useMapStore } from "@/stores/map-store";

interface MyPoisPanelProps {
  isAuthenticated: boolean;
}

export function MyPoisPanel({ isAuthenticated }: MyPoisPanelProps) {
  const { data: myPois = [] } = useMyPois(isAuthenticated);
  const { data: categories } = useCategories();
  const flyToPoi = useMapStore((s) => s.flyToPoi);

  const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]));

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
            <UserRound />
            <span className="sr-only">Abrir meus POIs</span>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">Meus POIs</TooltipContent>
      </Tooltip>

      <SheetContent>
        <SheetHeader>
          <SheetTitle className="font-display">Meus POIs</SheetTitle>
          <SheetDescription>
            {myPois.length > 0
              ? `${myPois.length} POI(s) cadastrado(s) por você — toque pra voar até eles.`
              : 'Você ainda não cadastrou nenhum POI. Toque no "+" pra criar o primeiro.'}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 overflow-y-auto px-4">
          {myPois.map((poi) => (
            <button
              key={poi.id}
              type="button"
              onClick={() => flyToPoi({ id: poi.id, lat: poi.lat, lng: poi.lng })}
              className="rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-muted"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{poi.name}</p>
                {poi.ai_category_slug && (
                  <span
                    className="flex shrink-0 items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                    title="A IA sugeriu uma categoria diferente pra esse POI — abra o pino no mapa pra ver"
                  >
                    <Sparkles className="size-2.5" /> sugestão
                  </span>
                )}
              </div>
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
