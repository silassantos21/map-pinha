"use client";

import type { LatLngBounds, LatLngTuple } from "leaflet";
import { useEffect, useState } from "react";
import { MapContainer, Rectangle, TileLayer, useMapEvents } from "react-leaflet";

import { MAP_THEMES } from "@/lib/map-themes";
import { useMapStore } from "@/stores/map-store";

// Quanto mais "afastado" (menos zoom) o minimapa fica em relação ao mapa principal
const MINIMAP_ZOOM_OFFSET = 5;

export function Minimap() {
  const activeTheme = useMapStore((s) => s.activeTheme);
  const theme = MAP_THEMES[activeTheme];

  const [center, setCenter] = useState<LatLngTuple | null>(null);
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);
  const [zoom, setZoom] = useState(13);

  const mainMap = useMapEvents({
    move: () => {
      setCenter([mainMap.getCenter().lat, mainMap.getCenter().lng]);
      setBounds(mainMap.getBounds());
    },
    zoomend: () => {
      setZoom(mainMap.getZoom());
      setBounds(mainMap.getBounds());
    },
  });

  useEffect(() => {
    setCenter([mainMap.getCenter().lat, mainMap.getCenter().lng]);
    setBounds(mainMap.getBounds());
    setZoom(mainMap.getZoom());
  }, [mainMap]);

  if (!center || !bounds) return null;

  return (
    <div className="pointer-events-none absolute bottom-24 left-4 z-[1000] hidden size-32 overflow-hidden rounded-xl border-2 border-border shadow-lg sm:block">
      <MapContainer
        center={center}
        zoom={Math.max(zoom - MINIMAP_ZOOM_OFFSET, 1)}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        className="h-full w-full"
      >
        <TileLayer url={theme.tileUrl} />
        <Rectangle
          bounds={bounds}
          pathOptions={{ color: "var(--primary)", weight: 2, fillOpacity: 0.1 }}
        />
      </MapContainer>
    </div>
  );
}
