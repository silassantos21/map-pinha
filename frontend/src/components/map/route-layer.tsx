"use client";

import L from "leaflet";
import { useEffect } from "react";
import { Polyline, useMap } from "react-leaflet";

import { useRoute } from "@/hooks/use-route";
import { useMapStore } from "@/stores/map-store";

/** Desenha a rota ativa (botão "Como chegar" num POI) como uma polyline
 * tracejada animada, e enquadra o mapa pra mostrar o trajeto inteiro assim
 * que os dados chegam. */
export function RouteLayer() {
  const map = useMap();
  const userPosition = useMapStore((s) => s.userPosition);
  const activeRouteTarget = useMapStore((s) => s.activeRouteTarget);
  const routeProfile = useMapStore((s) => s.routeProfile);

  const { data: route } = useRoute(userPosition, activeRouteTarget, routeProfile);

  useEffect(() => {
    if (!route) return;
    map.fitBounds(L.latLngBounds(route.geometry), { padding: [80, 80] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

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
