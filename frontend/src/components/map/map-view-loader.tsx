"use client";

import dynamic from "next/dynamic";

import { MapPlaceholder } from "@/components/layout/map-placeholder";

interface MapViewProps {
  userId?: string | null;
}

export const MapViewLoader = dynamic<MapViewProps>(
  () => import("@/components/map/map-view").then((mod) => mod.MapView),
  { ssr: false, loading: () => <MapPlaceholder /> },
);
