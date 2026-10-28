"use client";

import { Compass, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";

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
import { useRecommendations } from "@/hooks/use-recommendations";
import { submitAiFeedback } from "@/lib/api-client";
import { useMapStore } from "@/stores/map-store";
import type { Recommendation } from "@/types/poi";

interface ExplorePanelProps {
  isAuthenticated: boolean;
}

export function ExplorePanel({ isAuthenticated }: ExplorePanelProps) {
  const [open, setOpen] = useState(false);
  const userPosition = useMapStore((s) => s.userPosition);
  const flyToPoi = useMapStore((s) => s.flyToPoi);

  const { data: recommendations = [], isLoading } = useRecommendations(
    userPosition,
    isAuthenticated && open,
  );

  if (!isAuthenticated) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
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
            <Compass />
            <span className="sr-only">Explorar por aqui</span>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">Explorar</TooltipContent>
      </Tooltip>

      <SheetContent>
        <SheetHeader>
          <SheetTitle className="font-display">Explorar por aqui</SheetTitle>
          <SheetDescription>
            {!userPosition
              ? "Não foi possível obter sua localização atual."
              : "Sugestões da IA com base nos POIs públicos num raio de 2km — toque pra ir até um."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 overflow-y-auto px-4">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg border border-border bg-muted/40"
              />
            ))}

          {!isLoading && userPosition && recommendations.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma sugestão por aqui ainda — explore outra área do mapa ou cadastre mais POIs
              públicos na região.
            </p>
          )}

          {recommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.poi_id}
              recommendation={recommendation}
              onVisit={() =>
                flyToPoi({
                  id: recommendation.poi_id,
                  lat: recommendation.poi_lat,
                  lng: recommendation.poi_lng,
                })
              }
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function RecommendationCard({
  recommendation,
  onVisit,
}: {
  recommendation: Recommendation;
  onVisit: () => void;
}) {
  const [feedback, setFeedback] = useState<"useful" | "not-useful" | null>(null);

  const sendFeedback = async (useful: boolean, event: React.MouseEvent) => {
    event.stopPropagation();
    setFeedback(useful ? "useful" : "not-useful");
    await submitAiFeedback({ poiId: recommendation.poi_id, agent: "recommender", useful });
  };

  return (
    <button
      type="button"
      onClick={onVisit}
      className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-muted"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{recommendation.poi_name}</p>
          <p className="text-xs text-muted-foreground">{recommendation.category_name}</p>
        </div>
        <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
          {recommendation.priority_score}/10
        </span>
      </div>
      <p className="text-xs text-foreground">{recommendation.reason}</p>
      <div className="flex items-center gap-1.5 pt-0.5">
        <button
          type="button"
          onClick={(event) => sendFeedback(true, event)}
          disabled={feedback !== null}
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          aria-label="Sugestão útil"
        >
          <ThumbsUp className={feedback === "useful" ? "size-3 fill-primary text-primary" : "size-3"} />
        </button>
        <button
          type="button"
          onClick={(event) => sendFeedback(false, event)}
          disabled={feedback !== null}
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          aria-label="Sugestão não útil"
        >
          <ThumbsDown className={feedback === "not-useful" ? "size-3 fill-destructive text-destructive" : "size-3"} />
        </button>
        {feedback && <span className="text-[10px] text-muted-foreground">Obrigado!</span>}
      </div>
    </button>
  );
}
