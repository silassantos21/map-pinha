import type { Map as LeafletMap } from "leaflet";

// A Sheet de criação/edição de POI cobre a parte direita da tela no desktop
// (até sm:max-w-sm = 384px) — sem esse deslocamento, o marcador de rascunho
// podia cair exatamente atrás dela, escondido, e o usuário não tinha como
// arrastá-lo.
const DESKTOP_SHEET_OFFSET_PX = 170;
// No mobile a mesma Sheet abre embaixo (`max-h-[50vh]`, reduzido de 65vh —
// ver `poi-form-sheet.tsx`), não do lado — um deslocamento horizontal não
// ajuda em nada aí (e ainda empurra o ponto pra um lugar sem motivo, visto
// como "o mapa pulou pra outro canto"). O que precisa é empurrar o ponto pra
// CIMA, só o suficiente pra passar da borda superior da Sheet. Com 50vh de
// Sheet, essa borda já fica bem perto do centro vertical da tela (ponto de
// partida antes de qualquer offset) — bem menos deslocamento que os 140px
// usados quando a Sheet cobria 65vh, já que a faixa livre de mapa aumentou.
const MOBILE_SHEET_OFFSET_PX = 40;
// Mesmo breakpoint usado em `useMediaQuery("(max-width: 639px)")`
// (`hooks/use-media-query.ts`) pra decidir o lado da Sheet.
const MOBILE_BREAKPOINT_PX = 640;
// Fração da altura da tela usada pra "subir" o POI selecionado no mobile, pra
// ele ficar centralizado na faixa de mapa que sobra visível acima da Sheet de
// detalhes (que pode cobrir até 75vh, variando com o conteúdo do card) — é
// uma estimativa por proporção de tela, não uma medida exata do DOM da Sheet.
const MOBILE_CENTER_ABOVE_SHEET_RATIO = 0.22;

function flyToProjectedOffset(
  map: LeafletMap,
  lat: number,
  lng: number,
  zoom: number,
  offsetPx: [number, number],
): void {
  const targetPoint = map.project([lat, lng], zoom);
  const offsetLatLng = map.unproject(targetPoint.add(offsetPx), zoom);
  map.flyTo(offsetLatLng, zoom, { duration: 1 });
}

/** Centraliza o mapa num ponto, mas deslocado na tela pra sobrar visível fora
 * da área que a Sheet de criação/edição vai cobrir — lateral direita no
 * desktop, inferior no mobile. */
export function flyToVisibleNextToSheet(
  map: LeafletMap,
  lat: number,
  lng: number,
  minZoom = 16,
): void {
  const targetZoom = Math.max(map.getZoom(), minZoom);
  const isMobile = typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT_PX;
  const offsetPx: [number, number] = isMobile
    ? [0, MOBILE_SHEET_OFFSET_PX]
    : [DESKTOP_SHEET_OFFSET_PX, 0];
  flyToProjectedOffset(map, lat, lng, targetZoom, offsetPx);
}

/** Centraliza o mapa num POI só no instante em que ele é selecionado (clique
 * no marcador) — desktop: centro de verdade da tela, já que o card de
 * detalhes abre do lado sem cobrir o mapa; mobile: deslocado pra cima, pra
 * ficar centralizado na faixa visível acima da Sheet de detalhes (que cobre a
 * parte de baixo da tela). */
export function flyToSelectedPoi(map: LeafletMap, lat: number, lng: number, minZoom = 16): void {
  const targetZoom = Math.max(map.getZoom(), minZoom);
  const isMobile = typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT_PX;
  if (!isMobile) {
    map.flyTo([lat, lng], targetZoom, { duration: 1 });
    return;
  }
  const offsetY = window.innerHeight * MOBILE_CENTER_ABOVE_SHEET_RATIO;
  flyToProjectedOffset(map, lat, lng, targetZoom, [0, offsetY]);
}
