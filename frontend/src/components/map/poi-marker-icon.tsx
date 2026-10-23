import L from "leaflet";
import {
  Activity,
  Drama,
  Home,
  Stethoscope,
  Store,
  Trees,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";

// Mesmas categorias do seed do backend (backend/alembic/versions/*_seed_default_categories.py)
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  alimentacao: Utensils,
  comercio: Store,
  saude: Stethoscope,
  lazer: Trees,
  entretenimento: Drama,
  residencial: Home,
  status: Activity,
};

// Mesmos tokens de cor do globals.css (--category-*)
const CATEGORY_COLOR_VARS: Record<string, string> = {
  alimentacao: "var(--category-alimentacao)",
  comercio: "var(--category-comercio)",
  saude: "var(--category-saude)",
  lazer: "var(--category-lazer)",
  entretenimento: "var(--category-entretenimento)",
  residencial: "var(--category-residencial)",
  status: "var(--category-status)",
};

export function getCategoryIcon(categorySlug: string): LucideIcon {
  return CATEGORY_ICONS[categorySlug] ?? Store;
}

export function createPoiIcon(categorySlug: string): L.DivIcon {
  const Icon = getCategoryIcon(categorySlug);
  const color = CATEGORY_COLOR_VARS[categorySlug] ?? "var(--primary)";
  const iconSvg = renderToStaticMarkup(
    <Icon color="white" size={16} strokeWidth={2.5} />,
  );

  return L.divIcon({
    html: `<div style="background:${color};width:32px;height:32px;border-radius:9999px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);">${iconSvg}</div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}
