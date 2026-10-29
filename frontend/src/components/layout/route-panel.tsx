"use client";

import { Car, Footprints, Navigation, Square, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useRoute } from "@/hooks/use-route";
import { saveRouteHistory } from "@/lib/api-client";
import { appleMapsUrl, googleMapsUrl, isApplePlatform } from "@/lib/deep-links";
import { cn } from "@/lib/utils";
import { useMapStore } from "@/stores/map-store";

// "Chegou" quando a rota até o destino cai abaixo disso — threshold generoso
// o bastante pra não exigir precisão de GPS perfeita.
const ARRIVAL_THRESHOLD_M = 30;

interface RoutePanelProps {
  isAuthenticated: boolean;
}

export function RoutePanel({ isAuthenticated }: RoutePanelProps) {
  const userPosition = useMapStore((s) => s.userPosition);
  const activeRouteTarget = useMapStore((s) => s.activeRouteTarget);
  const clearRoute = useMapStore((s) => s.clearRoute);
  const routeProfile = useMapStore((s) => s.routeProfile);
  const setRouteProfile = useMapStore((s) => s.setRouteProfile);
  const isNavigating = useMapStore((s) => s.isNavigating);
  const startNavigating = useMapStore((s) => s.startNavigating);
  const stopNavigating = useMapStore((s) => s.stopNavigating);

  const [showAppleMaps, setShowAppleMaps] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- precisa ficar no efeito (só roda no cliente): checar a plataforma durante o render quebraria o SSR
    setShowAppleMaps(isApplePlatform());
  }, []);

  const {
    data: route,
    isLoading,
    isError,
  } = useRoute(userPosition, activeRouteTarget, routeProfile);

  // Salva no histórico uma vez por destino escolhido (não a cada
  // recalculo por atualização de GPS) — só pra quem está logado.
  const savedForTargetId = useRef<string | null>(null);
  useEffect(() => {
    if (!isAuthenticated || !route || !userPosition || !activeRouteTarget) return;
    if (savedForTargetId.current === activeRouteTarget.id) return;
    savedForTargetId.current = activeRouteTarget.id;
    saveRouteHistory({
      poiId: activeRouteTarget.id,
      origin: userPosition,
      distanceM: route.distance_m,
      durationS: route.duration_s,
    });
  }, [isAuthenticated, route, userPosition, activeRouteTarget]);

  // Detecção de chegada no modo navegação — encerra a rota sozinha.
  useEffect(() => {
    if (!isNavigating || !route) return;
    if (route.distance_m > ARRIVAL_THRESHOLD_M) return;
    toast.add({
      title: "Você chegou!",
      description: activeRouteTarget?.name,
      type: "success",
    });
    clearRoute();
  }, [isNavigating, route, activeRouteTarget, clearRoute]);

  if (!activeRouteTarget) return null;

  const distanceKm = route ? (route.distance_m / 1000).toFixed(1) : null;
  const durationMin = route ? Math.max(1, Math.round(route.duration_s / 60)) : null;

  return (
    <div className="pointer-events-auto absolute bottom-4 left-4 z-20 flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-2.5 rounded-xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground">
            {isNavigating ? "Navegando até" : "Como chegar"}
          </p>
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
              disabled={isNavigating}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 rounded-sm px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-50",
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
              disabled={isNavigating}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 rounded-sm px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-50",
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

          <Button
            type="button"
            size="sm"
            variant={isNavigating ? "destructive" : "accent"}
            onClick={isNavigating ? stopNavigating : startNavigating}
            disabled={!route}
          >
            {isNavigating ? (
              <>
                <Square className="size-3.5" /> Parar navegação
              </>
            ) : (
              <>
                <Navigation className="size-3.5" /> Iniciar navegação
              </>
            )}
          </Button>

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
