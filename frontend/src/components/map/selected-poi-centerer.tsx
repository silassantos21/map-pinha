"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

import { flyToSelectedPoi } from "@/lib/map-pan";
import { useMapStore } from "@/stores/map-store";
import type { Poi } from "@/types/poi";

interface SelectedPoiCentererProps {
  pois: Poi[];
}

/** Centraliza o mapa só no instante em que um POI é selecionado (clique no
 * marcador, ver `selectPoi` em `stores/map-store.ts`) — não fica
 * re-centralizando a cada pan/zoom seguinte, só dispara quando a seleção em
 * si muda. Fica num componente à parte (igual `DraftFlyToWatcher`) porque
 * quem dispara a seleção (o `Marker`, dentro do `MarkerClusterGroup`) não tem
 * acesso direto à instância do Leaflet pra decidir o lado do deslocamento. */
export function SelectedPoiCenterer({ pois }: SelectedPoiCentererProps) {
  const map = useMap();
  const selectedPoiId = useMapStore((s) => s.selectedPoiId);

  useEffect(() => {
    if (!selectedPoiId) return;
    const poi = pois.find((p) => p.id === selectedPoiId);
    if (!poi) return;
    flyToSelectedPoi(map, poi.lat, poi.lng);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só deve disparar quando a seleção em si muda, não a cada atualização de `pois` (refetch não deve voltar a centralizar)
  }, [selectedPoiId, map]);

  return null;
}
