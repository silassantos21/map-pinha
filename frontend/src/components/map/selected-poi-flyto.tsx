"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

import { useMapStore } from "@/stores/map-store";

/** Quando um POI é selecionado na lista, na busca ou nos favoritos, voa o
 * mapa principal até ele. A posição vem direto do store (não da lista de
 * POIs carregados na área visível), porque o alvo pode estar fora dela —
 * esse é exatamente o caso de uso de "ir pro favorito que está longe". */
export function SelectedPoiFlyTo() {
  const map = useMap();
  const target = useMapStore((s) => s.selectedPoiTarget);

  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 16), { duration: 1 });
  }, [target, map]);

  return null;
}
