"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

import { flyToVisibleNextToSheet } from "@/lib/map-pan";
import { useMapStore } from "@/stores/map-store";

/** Observa `pendingFlyTo` (setado por `setDraftPoiPosition`/`startEditingPoi`
 * — clique no mapa, editar um POI, ou buscar por endereço/coordenadas no
 * formulário) e voa o mapa até lá, deslocado pra não ficar atrás da Sheet de
 * criação/edição. Fica num componente à parte porque quem dispara o pedido
 * (o formulário) não tem acesso direto à instância do Leaflet. */
export function DraftFlyToWatcher() {
  const map = useMap();
  const pendingFlyTo = useMapStore((s) => s.pendingFlyTo);
  const clearPendingFlyTo = useMapStore((s) => s.clearPendingFlyTo);

  useEffect(() => {
    if (!pendingFlyTo) return;
    flyToVisibleNextToSheet(map, pendingFlyTo.lat, pendingFlyTo.lng);
    clearPendingFlyTo();
  }, [pendingFlyTo, map, clearPendingFlyTo]);

  return null;
}
