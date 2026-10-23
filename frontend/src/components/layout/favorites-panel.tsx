"use client";

import { Star } from "lucide-react";

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
import { useFavorites } from "@/hooks/use-favorites";
import { useMapStore } from "@/stores/map-store";

interface FavoritesPanelProps {
  isAuthenticated: boolean;
}

export function FavoritesPanel({ isAuthenticated }: FavoritesPanelProps) {
  const { data: favorites = [] } = useFavorites(isAuthenticated);
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
              : "Você ainda não favoritou nenhum POI. Toque na estrela no popup de um POI pra guardá-lo aqui."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 overflow-y-auto px-4">
          {favorites.map((poi) => (
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
