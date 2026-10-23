"use client";

import { useMapEvents } from "react-leaflet";

import { useMapStore } from "@/stores/map-store";

/** Enquanto o formulário de criação estiver aberto (`isCreatingPoi`), todo
 * clique no mapa atualiza a posição de rascunho (e o endereço, via
 * geocodificação reversa) — o usuário pode clicar quantas vezes quiser pra
 * ajustar, mesmo depois de já ter buscado por endereço ou lat/lng. */
export function PoiPlacementHandler() {
  const isCreatingPoi = useMapStore((s) => s.isCreatingPoi);
  const setDraftPoiPosition = useMapStore((s) => s.setDraftPoiPosition);

  useMapEvents({
    click: (event) => {
      if (!isCreatingPoi) return;
      setDraftPoiPosition({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return null;
}
