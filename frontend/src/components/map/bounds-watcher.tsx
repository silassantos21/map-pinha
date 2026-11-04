"use client";

import { useEffect, useRef } from "react";
import { useMap, useMapEvents } from "react-leaflet";

import { useMapStore } from "@/stores/map-store";
import type { MapBounds } from "@/types/poi";

const DEBOUNCE_MS = 200;
// Tolerância pra considerar os bounds "iguais" (graus) — evita commitar no
// store uma mudança desprezível (ex: o fim de um `flyTo` de centralização, ou
// qualquer microajuste de posição do Leaflet), que senão realimentava a
// query de POIs sem necessidade real.
const EPSILON = 1e-5;

function almostEqual(a: MapBounds | null, b: MapBounds): boolean {
  if (!a) return false;
  return (
    Math.abs(a.minLat - b.minLat) < EPSILON &&
    Math.abs(a.minLng - b.minLng) < EPSILON &&
    Math.abs(a.maxLat - b.maxLat) < EPSILON &&
    Math.abs(a.maxLng - b.maxLng) < EPSILON
  );
}

/** Mantém `mapBounds` no store sincronizado com a área visível do mapa
 * principal — é o que alimenta a query de POIs (pan/zoom = nova busca). */
export function BoundsWatcher() {
  const map = useMap();
  const setMapBounds = useMapStore((s) => s.setMapBounds);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reportBounds = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const bounds = map.getBounds();
      const next: MapBounds = {
        minLat: bounds.getSouth(),
        minLng: bounds.getWest(),
        maxLat: bounds.getNorth(),
        maxLng: bounds.getEast(),
      };
      const current = useMapStore.getState().mapBounds;
      if (!almostEqual(current, next)) {
        setMapBounds(next);
      }
    }, DEBOUNCE_MS);
  };

  useMapEvents({
    moveend: reportBounds,
    zoomend: reportBounds,
  });

  useEffect(() => {
    reportBounds();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}
