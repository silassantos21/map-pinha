import { create } from "zustand";

import { DEFAULT_MAP_THEME, type MapThemeId } from "@/lib/map-themes";
import type { LatLng, MapBounds, RouteProfile } from "@/types/poi";

interface MapState {
  activeTheme: MapThemeId;
  setActiveTheme: (theme: MapThemeId) => void;

  // Bounding box atual do mapa principal — alimenta a query de POIs visíveis.
  mapBounds: MapBounds | null;
  setMapBounds: (bounds: MapBounds) => void;

  // Filtros de busca (chips de categoria + busca por texto no header).
  activeCategorySlug: string | null;
  setActiveCategorySlug: (slug: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Fluxo de criação de POI: o formulário abre direto ao clicar no "+" do
  // HUD, sem exigir posição ainda — o usuário pode clicar no mapa, buscar
  // por endereço ou digitar lat/lng, nessa ordem ou em qualquer uma delas.
  isCreatingPoi: boolean;
  startCreatingPoi: () => void;
  cancelCreatingPoi: () => void;
  draftPoiPosition: LatLng | null;
  // Define a posição de rascunho "de fora" (clique no mapa, busca por
  // endereço/coordenadas no formulário) — isso também pede um voo do mapa até
  // lá (via `pendingFlyTo`, observado por um componente dentro do MapView,
  // já que o formulário não tem acesso direto à instância do Leaflet).
  setDraftPoiPosition: (position: LatLng) => void;
  // Só atualiza a posição sem pedir voo — usado pelo próprio arrastar do
  // marcador de rascunho, que já está visível onde o usuário o soltou.
  updateDraftPositionFromDrag: (position: LatLng) => void;
  pendingFlyTo: LatLng | null;
  clearPendingFlyTo: () => void;

  // Fluxo de edição: reaproveita o mesmo marcador de rascunho (arrastável,
  // pra permitir reposicionar) e o mesmo formulário, só que pré-preenchido.
  editingPoiId: string | null;
  startEditingPoi: (poi: { id: string; lat: number; lng: number }) => void;
  stopEditingPoi: () => void;

  // Navegação até um POI específico (lista, busca, favoritos) — guarda a
  // posição em vez de só o id, pra funcionar mesmo quando o POI não está
  // carregado na área visível atual do mapa (ex: favorito "longe").
  selectedPoiTarget: LatLng & { id: string } | null;
  flyToPoi: (poi: { id: string; lat: number; lng: number }) => void;

  // Posição atual do usuário (geolocalização) — espelhada aqui a partir do
  // `useGeolocation()` chamado em `MapView` (dentro da árvore do mapa) pra
  // ficar disponível também pro painel de rota, que vive fora dela.
  userPosition: LatLng | null;
  setUserPosition: (position: LatLng | null) => void;

  // Fluxo de rota: destino escolhido (via botão "Como chegar" num POI) +
  // modo de transporte. A origem é sempre `userPosition`.
  activeRouteTarget: (LatLng & { id: string; name: string }) | null;
  startRouteTo: (poi: { id: string; name: string; lat: number; lng: number }) => void;
  clearRoute: () => void;
  routeProfile: RouteProfile;
  setRouteProfile: (profile: RouteProfile) => void;

  // Modo de navegação simplificado: enquanto ativo, o mapa segue a posição
  // do usuário em vez de ficar enquadrando a rota inteira (ver RouteLayer).
  isNavigating: boolean;
  startNavigating: () => void;
  stopNavigating: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  activeTheme: DEFAULT_MAP_THEME,
  setActiveTheme: (theme) => set({ activeTheme: theme }),

  mapBounds: null,
  setMapBounds: (bounds) => set({ mapBounds: bounds }),

  activeCategorySlug: null,
  setActiveCategorySlug: (slug) => set({ activeCategorySlug: slug }),
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),

  isCreatingPoi: false,
  startCreatingPoi: () => set({ isCreatingPoi: true, editingPoiId: null, draftPoiPosition: null }),
  cancelCreatingPoi: () => set({ isCreatingPoi: false, draftPoiPosition: null, pendingFlyTo: null }),
  draftPoiPosition: null,
  setDraftPoiPosition: (position) => set({ draftPoiPosition: position, pendingFlyTo: position }),
  updateDraftPositionFromDrag: (position) => set({ draftPoiPosition: position }),
  pendingFlyTo: null,
  clearPendingFlyTo: () => set({ pendingFlyTo: null }),

  editingPoiId: null,
  startEditingPoi: (poi) =>
    set({
      editingPoiId: poi.id,
      isCreatingPoi: false,
      draftPoiPosition: { lat: poi.lat, lng: poi.lng },
      pendingFlyTo: { lat: poi.lat, lng: poi.lng },
    }),
  stopEditingPoi: () => set({ editingPoiId: null, draftPoiPosition: null }),

  selectedPoiTarget: null,
  flyToPoi: (poi) => set({ selectedPoiTarget: poi }),

  userPosition: null,
  setUserPosition: (position) => set({ userPosition: position }),

  activeRouteTarget: null,
  startRouteTo: (poi) => set({ activeRouteTarget: poi, isNavigating: false }),
  clearRoute: () => set({ activeRouteTarget: null, isNavigating: false }),
  routeProfile: "driving",
  setRouteProfile: (profile) => set({ routeProfile: profile }),

  isNavigating: false,
  startNavigating: () => set({ isNavigating: true }),
  stopNavigating: () => set({ isNavigating: false }),
}));
