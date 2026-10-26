import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";

import { getPoiIcon } from "@/lib/poi-icons";
import type { Category, Poi } from "@/types/poi";

export { getCategoryIcon, getPoiIcon, resolveIconName, ICON_PICKER_OPTIONS } from "@/lib/poi-icons";

export function createPoiIcon(poi: Poi, category: Category | undefined): L.DivIcon {
  const Icon = getPoiIcon(poi, category);
  const color = category?.color_hex ?? "var(--primary)";
  const iconSvg = renderToStaticMarkup(<Icon color="white" size={16} strokeWidth={2.5} />);

  return L.divIcon({
    html: `<div style="background:${color};width:32px;height:32px;border-radius:9999px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);">${iconSvg}</div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}
