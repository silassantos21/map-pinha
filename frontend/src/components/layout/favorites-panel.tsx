"use client";

import { Star } from "lucide-react";

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
import { useFavorites } from "@/hooks/use-favorites";
import { getPoiIcon } from "@/lib/poi-icons";
import { useMapStore } from "@/stores/map-store";

interface FavoritesPanelProps {
  isAuthenticated: boolean;
}

export function FavoritesPanel({ isAuthenticated }: FavoritesPanelProps) {
  const { data: favorites = [] } = useFavorites(isAuthenticated);
  const { data: categories } = useCategories();
  const flyToPoi = useMapStore((s) => s.flyToPoi);

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
            <Star className="fill-amber-400 text-amber-400" />
            <span className="sr-only">Abrir favoritos</span>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">Seus favoritos</TooltipContent>
      </Tooltip>

      <SheetContent>
        <SheetHeader>
          <SheetTitle className="font-display">Favoritos</SheetTitle>
          <SheetDescription>
            {favorites.length > 0
              ? `${favorites.length} POI(s) favoritado(s) — toque pra voar até eles.`
              : "Você ainda não favoritou nenhum POI. Toque na estrela no card de um POI pra guardá-lo aqui."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 overflow-y-auto px-4">
          {favorites.map((poi, index) => {
            const category = categoryById.get(poi.category_id);
            const Icon = getPoiIcon(poi, category);
            const categoryColor = category?.color_hex ?? "var(--border)";
            return (
              <MotionListItem key={poi.id} index={index}>
                <button
                  type="button"
                  onClick={() => flyToPoi({ id: poi.id, lat: poi.lat, lng: poi.lng })}
                  className="flex w-full items-center gap-2 rounded-lg border border-border border-l-4 bg-card p-3 text-left transition-colors hover:bg-muted"
                  style={{ borderLeftColor: categoryColor }}
                >
                  <Icon className="size-4 shrink-0" style={{ color: categoryColor }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{poi.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {category?.name ?? "Sem categoria"}
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
