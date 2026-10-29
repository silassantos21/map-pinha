export type MapThemeId = "cartoon" | "rpg" | "urbano" | "satelite";

export interface MapTheme {
  id: MapThemeId;
  label: string;
  /** Token de cor definido em globals.css (--map-theme-*) */
  accentClassName: string;
  tileUrl: string;
  attribution: string;
  maxZoom: number;
}

const stadiaKey = process.env.NEXT_PUBLIC_STADIA_API_KEY;
const stadiaKeyParam = stadiaKey ? `?api_key=${stadiaKey}` : "";

const osmAttribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

const stadiaAttribution = `&copy; <a href="https://stadiamaps.com/" target="_blank" rel="noreferrer">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a> ${osmAttribution}`;

export const MAP_THEMES: Record<MapThemeId, MapTheme> = {
  cartoon: {
    id: "cartoon",
    label: "Cartoon",
    accentClassName: "bg-map-cartoon",
    // CartoDB descontinuou os tiles gratuitos sem conta (basemaps.cartocdn.com
    // passou a exigir API key) — usamos Stadia Maps pra todos os temas que
    // não são satélite, já que o ESRI é o único 100% sem key necessária.
    tileUrl: `https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png${stadiaKeyParam}`,
    attribution: stadiaAttribution,
    maxZoom: 20,
  },
  urbano: {
    id: "urbano",
    label: "Urbano",
    accentClassName: "bg-map-urbano",
    tileUrl: `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png${stadiaKeyParam}`,
    attribution: stadiaAttribution,
    maxZoom: 20,
  },
  rpg: {
    id: "rpg",
    label: "RPG",
    accentClassName: "bg-map-rpg",
    tileUrl: `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png${stadiaKeyParam}`,
    attribution: stadiaAttribution,
    maxZoom: 20,
  },
  satelite: {
    id: "satelite",
    label: "Satélite",
    accentClassName: "bg-map-satelite",
    tileUrl:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    maxZoom: 19,
  },
};

export const MAP_THEME_LIST = Object.values(MAP_THEMES);

export const DEFAULT_MAP_THEME: MapThemeId = "cartoon";
