import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";

import { getPoiIcon } from "@/lib/poi-icons";
import type { Category, Poi } from "@/types/poi";

export { getCategoryIcon, getPoiIcon, resolveIconName, ICON_PICKER_OPTIONS } from "@/lib/poi-icons";

export function createPoiIcon(
  poi: Poi,
  category: Category | undefined,
  isSelected = false,
): L.DivIcon {
  const Icon = getPoiIcon(poi, category);
  const color = category?.color_hex ?? "var(--primary)";
  const iconSvg = renderToStaticMarkup(<Icon color="white" size={16} strokeWidth={2.5} />);

  // POI selecionado (card de detalhes aberto, ver `PoiDetailSheet`) vira um
  // pino clássico (gota) em vez do círculo padrão — desde que o card deixou
  // de ficar ancorado ao marcador, esse é o único vínculo visual entre "qual
  // marcador estou vendo no painel" e o mapa. O truque é CSS puro: um
  // quadrado com `border-radius` assimétrico girado -45deg forma a gota; o
  // conteúdo (ícone) contragira +45deg pra ficar reto dentro dela.
  if (isSelected) {
    return L.divIcon({
      html: `<div style="width:38px;height:38px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.5);"><div style="transform:rotate(45deg);">${iconSvg}</div></div>`,
      className: "",
      iconSize: [38, 38],
      iconAnchor: [19, 38],
    });
  }

  return L.divIcon({
    html: `<div style="background:${color};width:32px;height:32px;border-radius:9999px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);">${iconSvg}</div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}
