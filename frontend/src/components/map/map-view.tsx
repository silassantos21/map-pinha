"use client";

import L from "leaflet";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

import { BoundsWatcher } from "@/components/map/bounds-watcher";
import { MapControls } from "@/components/map/map-controls";
import { DraftFlyToWatcher } from "@/components/map/draft-flyto-watcher";
import { DraftPoiMarker } from "@/components/map/draft-poi-marker";
import { LocationLoadingOverlay } from "@/components/map/location-loading-overlay";
import { PoiCardPopup } from "@/components/map/poi-card-popup";
import { PoiPlacementHandler } from "@/components/map/poi-placement-handler";
import { createPoiIcon } from "@/components/map/poi-marker-icon";
import { RouteLayer } from "@/components/map/route-layer";
import { SelectedPoiFlyTo } from "@/components/map/selected-poi-flyto";
import { useCategories } from "@/hooks/use-categories";
import { useGeolocation } from "@/hooks/use-geolocation";
import { usePois } from "@/hooks/use-pois";
import { MAP_THEMES } from "@/lib/map-themes";
import { useMapStore } from "@/stores/map-store";

const DEFAULT_CENTER: [number, number] = [-23.5505, -46.6333]; // São Paulo

// Azul do círculo central do pin da logo — faz o marcador "você está aqui"
// ecoar literalmente o próprio ícone do app, em vez da cor de marca genérica.
const USER_MARKER_ICON = L.divIcon({
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:var(--brand-sky);border:3px solid white;box-shadow:0 0 0 4px rgba(42,145,211,0.3);"></div>',
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

interface UserLocationMarkerProps {
  position: { lat: number; lng: number } | null;
}

function UserLocationMarker({ position }: UserLocationMarkerProps) {
  const map = useMap();
  const hasCenteredRef = useRef(false);

  // Centraliza só na primeira localização obtida — atualizações seguintes do
  // watchPosition não devem "puxar" o mapa de volta enquanto o usuário navega
  // (isso é o que o botão de centralizar em MapControls faz, sob demanda).
  useEffect(() => {
    if (position && !hasCenteredRef.current) {
      hasCenteredRef.current = true;
      map.flyTo([position.lat, position.lng], 15, { duration: 1.2 });
    }
  }, [position, map]);

  if (!position) return null;

  return (
    <Marker position={[position.lat, position.lng]} icon={USER_MARKER_ICON}>
      <Popup>Você está aqui</Popup>
    </Marker>
  );
}

interface MapViewProps {
  userId?: string | null;
}

export function MapView({ userId }: MapViewProps) {
  const activeTheme = useMapStore((s) => s.activeTheme);
  const theme = MAP_THEMES[activeTheme];
  const { position, error: locationError } = useGeolocation();
  const setUserPosition = useMapStore((s) => s.setUserPosition);
  const flyToPoi = useMapStore((s) => s.flyToPoi);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Deep-link de compartilhamento (Sprint 6): a página pública `/p/[slug]`
  // manda o visitante de volta pra cá com `?poi=slug` quando ele clica em
  // "ver no mapa completo" — resolve o slug num id/lat/lng e voa até lá, só
  // na primeira renderização (não deve repetir se o usuário navegar depois).
  useEffect(() => {
    const slug = searchParams.get("poi");
    if (!slug) return;
    fetch(`/api/pois/by-slug/${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((poi) => {
        if (poi) flyToPoi({ id: poi.id, lat: poi.lat, lng: poi.lng });
      })
      .finally(() => router.replace("/", { scroll: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na carga inicial da página, não a cada mudança de searchParams/router
  }, []);

  // Espelha a posição no store — o painel de rota (RoutePanel) vive fora da
  // árvore do mapa e não tem como chamar `useGeolocation()` de novo sem abrir
  // uma segunda assinatura de `watchPosition`.
  useEffect(() => {
    setUserPosition(position);
  }, [position, setUserPosition]);

  // Mostra o overlay de loading só até a geolocalização resolver pela
  // primeira vez (sucesso OU erro/permissão negada) — depois disso nunca
  // mais reaparece, mesmo que uma atualização de posição falhe mais tarde.
  const [hasResolvedLocation, setHasResolvedLocation] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- trava (nunca volta a false): não é um valor derivável do render atual
    if (position || locationError) setHasResolvedLocation(true);
  }, [position, locationError]);

  const { data: categories } = useCategories();
  const { data: pois = [] } = usePois(userId);

  const categoriesById = useMemo(
    () => new Map((categories ?? []).map((category) => [category.id, category])),
    [categories],
  );

  const poiIcons = useMemo(
    () =>
      Object.fromEntries(
        pois.map((poi) => [poi.id, createPoiIcon(poi, categoriesById.get(poi.category_id))]),
      ),
    [pois, categoriesById],
  );

  // Rede de segurança: se a geolocalização nunca chamar sucesso nem erro
  // (acontece em alguns navegadores quando o prompt de permissão é ignorado),
  // não deixa o overlay de loading preso pra sempre.
  useEffect(() => {
    const timeout = setTimeout(() => setHasResolvedLocation(true), 8000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="relative h-full w-full">
      <LocationLoadingOverlay show={!hasResolvedLocation} />
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={13}
        zoomControl={false}
        // Sem isso, cliques em certos elementos dentro do conteúdo React do
        // popup (ex: tocar áudio) podiam ser mal-interpretados como "clique
        // fora do popup" e fechá-lo sozinho.
        closePopupOnClick={false}
        className="h-full w-full"
      >
        <TileLayer
          key={theme.id}
          url={theme.tileUrl}
          attribution={theme.attribution}
          maxZoom={theme.maxZoom}
          // Evita competir por tiles novos durante a própria animação de zoom
          // (gerava o "flash" cinza — o Leaflet pedia tiles do zoom final antes
          // da transição acabar); mantém um buffer maior de tiles já
          // carregados pra sumir menos área enquanto os novos chegam.
          updateWhenZooming={false}
          keepBuffer={4}
        />
        <BoundsWatcher />
        <PoiPlacementHandler />
        <MarkerClusterGroup chunkedLoading>
          {pois.map((poi) => (
            <Marker key={poi.id} position={[poi.lat, poi.lng]} icon={poiIcons[poi.id]}>
              <Popup maxWidth={440} minWidth={260} closeButton={false}>
                <PoiCardPopup poi={poi} currentUserId={userId} />
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
        <DraftPoiMarker />
        <DraftFlyToWatcher />
        <SelectedPoiFlyTo />
        <UserLocationMarker position={position} />
        <RouteLayer />
        <MapControls userPosition={position} />
      </MapContainer>
    </div>
  );
}
