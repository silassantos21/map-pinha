"use client";

import L, { type LeafletEvent } from "leaflet";
import { Marker } from "react-leaflet";

import { useMapStore } from "@/stores/map-store";

const DRAFT_ICON = L.divIcon({
  html: '<div style="width:28px;height:28px;border-radius:9999px;background:var(--primary);opacity:0.85;border:3px dashed white;box-shadow:0 2px 8px rgba(0,0,0,0.4);animation:mappin-draft-pulse 1.4s ease-in-out infinite;"></div><style>@keyframes mappin-draft-pulse{0%,100%{transform:scale(1);}50%{transform:scale(1.15);}}</style>',
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

/** Marcador arrastável mostrado enquanto o usuário preenche o formulário de
 * criação — é o "preview em tempo real" da posição do novo POI. */
export function DraftPoiMarker() {
  const position = useMapStore((s) => s.draftPoiPosition);
  const updateDraftPositionFromDrag = useMapStore((s) => s.updateDraftPositionFromDrag);

  if (!position) return null;

  return (
    <Marker
      position={[position.lat, position.lng]}
      icon={DRAFT_ICON}
      draggable
      eventHandlers={{
        dragend: (event: LeafletEvent) => {
          const marker = event.target as L.Marker;
          const latlng = marker.getLatLng();
          updateDraftPositionFromDrag({ lat: latlng.lat, lng: latlng.lng });
        },
      }}
    />
  );
}
