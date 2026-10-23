import type { Map as LeafletMap } from "leaflet";

// A Sheet de criação/edição de POI cobre a parte direita da tela (até
// sm:max-w-sm = 384px) — sem esse deslocamento, o marcador de rascunho podia
// cair exatamente atrás dela, escondido, e o usuário não tinha como arrastá-lo.
const SHEET_OFFSET_PX = 170;

/** Centraliza o mapa num ponto, mas deslocado pra a esquerda na tela, pra
 * sobrar visível fora da área que a Sheet lateral direita vai cobrir. */
export function flyToVisibleNextToSheet(
  map: LeafletMap,
  lat: number,
  lng: number,
  minZoom = 16,
): void {
  const targetZoom = Math.max(map.getZoom(), minZoom);
  const targetPoint = map.project([lat, lng], targetZoom);
  const offsetCenterPoint = targetPoint.add([SHEET_OFFSET_PX, 0]);
  const offsetCenterLatLng = map.unproject(offsetCenterPoint, targetZoom);
  map.flyTo(offsetCenterLatLng, targetZoom, { duration: 1 });
}
