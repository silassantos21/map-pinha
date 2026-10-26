"use client";

import { Car, Footprints, X } from "lucide-react";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { useRoute } from "@/hooks/use-route";
import { appleMapsUrl, googleMapsUrl, isApplePlatform } from "@/lib/deep-links";
import { cn } from "@/lib/utils";
import { useMapStore } from "@/stores/map-store";

export function RoutePanel() {
  const userPosition = useMapStore((s) => s.userPosition);
  const activeRouteTarget = useMapStore((s) => s.activeRouteTarget);
  const clearRoute = useMapStore((s) => s.clearRoute);
  const routeProfile = useMapStore((s) => s.routeProfile);
  const setRouteProfile = useMapStore((s) => s.setRouteProfile);

  const [showAppleMaps, setShowAppleMaps] = useState(false);
  useEffect(() => setShowAppleMaps(isApplePlatform()), []);

  const {
    data: route,
    isLoading,
    isError,
  } = useRoute(userPosition, activeRouteTarget, routeProfile);

  if (!activeRouteTarget) return null;

  const distanceKm = route ? (route.distance_m / 1000).toFixed(1) : null;
  const durationMin = route ? Math.max(1, Math.round(route.duration_s / 60)) : null;

  return (
    <div className="pointer-events-auto absolute bottom-4 left-4 z-20 flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-2.5 rounded-xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground">Como chegar</p>
          <p className="truncate font-display text-sm text-foreground">{activeRouteTarget.name}</p>
        </div>
        <button
          type="button"
          onClick={clearRoute}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Fechar rota"
        >
          <X className="size-4" />
        </button>
      </div>

      {!userPosition ? (
        <p className="text-xs text-destructive">Não foi possível obter sua localização atual.</p>
      ) : (
        <>
          <div className="flex gap-1 rounded-md bg-background p-0.5">
            <button
              type="button"
              onClick={() => setRouteProfile("driving")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 rounded-sm px-2 py-1 text-[11px] font-medium transition-colors",
                routeProfile === "driving"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Car className="size-3.5" /> Carro
            </button>
            <button
              type="button"
              onClick={() => setRouteProfile("walking")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 rounded-sm px-2 py-1 text-[11px] font-medium transition-colors",
                routeProfile === "walking"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Footprints className="size-3.5" /> A pé
            </button>
          </div>

          {isLoading && <p className="text-xs text-muted-foreground">Calculando rota...</p>}
          {isError && (
            <p className="text-xs text-destructive">Não foi possível calcular a rota agora.</p>
          )}
          {route && (
            <p className="text-sm text-foreground">
              <span className="font-medium">{distanceKm} km</span>{" "}
              <span className="text-muted-foreground">· {durationMin} min</span>
            </p>
          )}

          <div className="flex gap-1.5">
            <a
              href={googleMapsUrl(userPosition, activeRouteTarget, routeProfile)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1")}
            >
              Google Maps
            </a>
            {showAppleMaps && (
              <a
                href={appleMapsUrl(userPosition, activeRouteTarget, routeProfile)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1")}
              >
                Apple Maps
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}
