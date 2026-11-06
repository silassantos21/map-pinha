"use client";

import { List } from "lucide-react";

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
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCategories } from "@/hooks/use-categories";
import { useFavorites } from "@/hooks/use-favorites";
import { usePois } from "@/hooks/use-pois";
import { getPoiIcon } from "@/lib/poi-icons";
import { useMapStore } from "@/stores/map-store";
import type { Category, Poi } from "@/types/poi";

interface PoiPanelProps {
  userId?: string | null;
}

function PoiListItem({
  poi,
  categoryById,
  onClick,
}: {
  poi: Poi;
  categoryById: Map<string, Category>;
  onClick: () => void;
}) {
  const category = categoryById.get(poi.category_id);
  const Icon = getPoiIcon(poi, category);
  const categoryColor = category?.color_hex ?? "var(--border)";
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg border border-border border-l-4 bg-card p-3 text-left transition-colors hover:bg-muted"
      style={{ borderLeftColor: categoryColor }}
    >
      {/* eslint-disable-next-line react-hooks/static-components -- Icon vem de um registro fixo (ICON_REGISTRY em poi-icons.ts), referência estável */}
      <Icon className="size-4 shrink-0" style={{ color: categoryColor }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{poi.name}</p>
        <p className="text-xs text-muted-foreground">{category?.name ?? "Sem categoria"}</p>
      </div>
    </button>
  );
}

/** Painel "Ver POIs" (antes dois botões separados: lista de POIs próximos e
 * favoritos). Unificado em abas — mesmo padrão já usado no painel Social.
 * Sem estado controlado: a Sheet desmonta o conteúdo ao fechar, então
 * `defaultValue="nearby"` já garante reabrir sempre em "Próximos". */
export function PoiPanel({ userId }: PoiPanelProps) {
  const { data: pois = [] } = usePois(userId);
  const { data: favorites = [] } = useFavorites(userId != null);
  const { data: categories } = useCategories();
  const flyToPoi = useMapStore((s) => s.flyToPoi);

  const categoryById = new Map((categories ?? []).map((c) => [c.id, c]));

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
            <List />
            <span className="sr-only">Ver POIs</span>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">Ver POIs</TooltipContent>
      </Tooltip>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle className="font-display">POIs</SheetTitle>
          <SheetDescription className="sr-only">
            POIs próximos na área visível do mapa, e seus favoritos.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="nearby" className="flex min-h-0 flex-1 flex-col gap-3 px-4">
          <TabsList>
            <TabsTab value="nearby">Próximos</TabsTab>
            <TabsTab value="favorites">Favoritos</TabsTab>
          </TabsList>

          <TabsPanel value="nearby" className="gap-2 overflow-y-auto">
            <p className="px-1 text-xs text-muted-foreground">
              {pois.length > 0
                ? `${pois.length} POI(s) na área visível do mapa.`
                : "Nenhum POI na área visível — ajuste o mapa ou crie um novo."}
            </p>
            {pois.map((poi, index) => (
              <MotionListItem key={poi.id} index={index}>
                <PoiListItem
                  poi={poi}
                  categoryById={categoryById}
                  onClick={() => flyToPoi({ id: poi.id, lat: poi.lat, lng: poi.lng })}
                />
              </MotionListItem>
            ))}
          </TabsPanel>

          <TabsPanel value="favorites" className="gap-2 overflow-y-auto">
            <p className="px-1 text-xs text-muted-foreground">
              {favorites.length > 0
                ? `${favorites.length} POI(s) favoritado(s) — toque pra voar até eles.`
                : "Você ainda não favoritou nenhum POI. Toque na estrela no card de um POI pra guardá-lo aqui."}
            </p>
            {favorites.map((poi, index) => (
              <MotionListItem key={poi.id} index={index}>
                <PoiListItem
                  poi={poi}
                  categoryById={categoryById}
                  onClick={() => flyToPoi({ id: poi.id, lat: poi.lat, lng: poi.lng })}
                />
              </MotionListItem>
            ))}
          </TabsPanel>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
