"use client";

import L from "leaflet";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

import { BoundsWatcher } from "@/components/map/bounds-watcher";
import { MapControls } from "@/components/map/map-controls";
import { DraftFlyToWatcher } from "@/components/map/draft-flyto-watcher";
import { DraftPoiMarker } from "@/components/map/draft-poi-marker";
import { LocationLoadingOverlay } from "@/components/map/location-loading-overlay";
import { PoiPlacementHandler } from "@/components/map/poi-placement-handler";
import { createPoiIcon } from "@/components/map/poi-marker-icon";
import { RouteLayer } from "@/components/map/route-layer";
import { SelectedPoiCenterer } from "@/components/map/selected-poi-centerer";
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
  const selectPoi = useMapStore((s) => s.selectPoi);
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
  // `isLoading` (do React Query) só é true na PRIMEIRA busca de cada
  // combinação de filtros, sem nenhum dado anterior pra mostrar enquanto
  // isso — diferente de um pan/zoom normal, onde `placeholderData` já
  // mantém os marcadores antigos visíveis sem precisar de indicador nenhum.
  // Sem isso, achado real: o mapa fica com 0 marcadores e nenhum sinal de
  // que algo está carregando (ex: no cold start do plano gratuito da Render
  // em produção, a 1ª resposta pode demorar 30-50s) — parece travado.
  const { data: pois = [], isLoading: isLoadingPois } = usePois(userId);

  const categoriesById = useMemo(
    () => new Map((categories ?? []).map((category) => [category.id, category])),
    [categories],
  );

  // O React Query já reaproveita (structural sharing, padrão da lib) a
  // referência antiga de cada POI quando o conteúdo não mudou — mas isso só
  // funciona se o backend devolver a lista sempre na mesma ordem. O fix real
  // pro bug de marcador/popup "piscando" ficou no backend (`ORDER BY POI.id`
  // em `list_pois`, ver `backend/app/api/v1/pois.py`): sem ordem estável, o
  // Postgres podia devolver os mesmos POIs em ordens diferentes entre
  // chamadas, o structural sharing via de cada item como "novo", e todo
  // marcador recriava o ícone (`setIcon` destrói e recria o nó DOM) a cada
  // refetch — inclusive o do popup aberto. Com `pois` estável, este useMemo
  // só recalcula quando algo realmente mudou.
  const poiIcons = useMemo(
    () =>
      Object.fromEntries(
        pois.map((poi) => [poi.id, createPoiIcon(poi, categoriesById.get(poi.category_id))]),
      ),
    [pois, categoriesById],
  );

  const selectedPoiId = useMapStore((s) => s.selectedPoiId);
  const editingPoiId = useMapStore((s) => s.editingPoiId);

  // Ícone "selecionado" calculado à parte do `poiIcons` acima — só o POI
  // selecionado troca de referência de ícone quando a seleção muda (o resto
  // continua apontando pro mesmo objeto em `poiIcons`), em vez de recalcular
  // o mapa inteiro de ícones a cada seleção.
  const selectedPoi = pois.find((poi) => poi.id === selectedPoiId);
  const selectedIcon = useMemo(
    () =>
      selectedPoi
        ? createPoiIcon(selectedPoi, categoriesById.get(selectedPoi.category_id), true)
        : null,
    [selectedPoi, categoriesById],
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
      {isLoadingPois && (
        // bottom usa --hud-footer-height (definida em app-shell.tsx) pra não
        // ficar escondido atrás da barra de navegação do rodapé
        <div className="pointer-events-none absolute bottom-[calc(var(--hud-footer-height)+1.5rem)] left-1/2 z-[1000] -translate-x-1/2">
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-popover/90 px-3 py-1.5 text-xs text-muted-foreground shadow-lg backdrop-blur-sm">
            <Loader2 className="size-3.5 animate-spin" />
            Carregando pontos...
          </div>
        </div>
      )}
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
          {pois
            // Some durante a edição: o marcador de rascunho arrastável
            // (`DraftPoiMarker`) nasce exatamente na mesma posição do POI
            // real, e os dois sobrepostos tornavam incerto qual marcador
            // respondia ao arrastar. Igual já acontece ao criar um POI novo
            // (que não tem marcador "real" ainda), editar passa a mostrar só
            // o marcador de rascunho enquanto dura.
            .filter((poi) => poi.id !== editingPoiId)
            .map((poi) => (
              <Marker
                key={poi.id}
                position={[poi.lat, poi.lng]}
                icon={poi.id === selectedPoiId && selectedIcon ? selectedIcon : poiIcons[poi.id]}
                // O card de detalhes deixou de ser um Popup do Leaflet (ver
                // `PoiDetailSheet`, renderizado fora do mapa) — motivo: o
                // plugin de clustering remove/readiciona marcadores do mapa a
                // cada pan/zoom pra reagrupar, e isso fechava/reabria o popup
                // do marcador selecionado sozinho (o "pisca ao mexer o mapa"),
                // independente de qualquer estabilidade dos dados do POI.
                eventHandlers={{ click: () => selectPoi(poi.id) }}
              />
            ))}
        </MarkerClusterGroup>
        <DraftPoiMarker />
        <DraftFlyToWatcher />
        <SelectedPoiFlyTo />
        <SelectedPoiCenterer pois={pois} />
        <UserLocationMarker position={position} />
        <RouteLayer />
        <MapControls userPosition={position} />
      </MapContainer>
    </div>
  );
}
