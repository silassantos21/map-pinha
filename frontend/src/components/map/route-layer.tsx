"use client";

import L from "leaflet";
import { useEffect, useRef } from "react";
import { Polyline, useMap } from "react-leaflet";

import { useRoute } from "@/hooks/use-route";
import { useMapStore } from "@/stores/map-store";

// Dirigindo, mais afastado pra ver contexto à frente; a pé, mais perto, já
// que a precisão de poucos metros importa mais nesse ritmo.
const NAV_FOLLOW_ZOOM = { driving: 16, walking: 18 } as const;

/** Desenha a rota ativa (botão "Como chegar" num POI) como uma polyline
 * tracejada animada. Fora do modo navegação, enquadra o mapa pra mostrar o
 * trajeto inteiro — só quando o destino muda, não a cada atualização de
 * posição (senão reenquadraria o mapa toda hora enquanto o GPS atualiza).
 * No modo navegação, acompanha a posição do usuário em vez de mostrar a
 * rota inteira (ver `isNavigating` no map-store). */
export function RouteLayer() {
  const map = useMap();
  const userPosition = useMapStore((s) => s.userPosition);
  const activeRouteTarget = useMapStore((s) => s.activeRouteTarget);
  const routeProfile = useMapStore((s) => s.routeProfile);
  const isNavigating = useMapStore((s) => s.isNavigating);

  const { data: route } = useRoute(userPosition, activeRouteTarget, routeProfile);

  const lastFittedTargetId = useRef<string | null>(null);
  useEffect(() => {
    if (!activeRouteTarget) {
      lastFittedTargetId.current = null;
      return;
    }
    if (!route || isNavigating) return;
    if (lastFittedTargetId.current === activeRouteTarget.id) return;
    lastFittedTargetId.current = activeRouteTarget.id;
    map.fitBounds(L.latLngBounds(route.geometry), { padding: [80, 80] });
  }, [route, activeRouteTarget, isNavigating, map]);

  const hasSnappedRef = useRef(false);
  useEffect(() => {
    if (!isNavigating) {
      hasSnappedRef.current = false;
      return;
    }
    if (!userPosition) return;
    if (!hasSnappedRef.current) {
      hasSnappedRef.current = true;
      map.flyTo([userPosition.lat, userPosition.lng], NAV_FOLLOW_ZOOM[routeProfile], { duration: 1 });
    } else {
      map.panTo([userPosition.lat, userPosition.lng], { animate: true, duration: 0.5 });
    }
  }, [isNavigating, userPosition, routeProfile, map]);

  if (!route) return null;

  return (
    <Polyline
      positions={route.geometry}
      pathOptions={{
        color: "var(--primary)",
        weight: 5,
        opacity: 0.9,
        dashArray: "12, 10",
        className: "mappin-route-line",
      }}
    />
  );
}
