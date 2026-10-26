import {
  Activity,
  Anchor,
  BookOpen,
  Briefcase,
  Building2,
  Bus,
  Camera,
  Car,
  Church,
  Coffee,
  Dog,
  Drama,
  Film,
  Flag,
  Flame,
  Gift,
  Globe,
  Heart,
  Home,
  Landmark,
  Library,
  type LucideIcon,
  Mic,
  Music,
  Newspaper,
  Palette,
  PawPrint,
  Plane,
  School,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Store,
  TrainFront,
  Trees,
  Trophy,
  Utensils,
  Wrench,
} from "lucide-react";

import type { Category, Poi } from "@/types/poi";

// Sem import de `leaflet` de propósito: este módulo é importado também pelo
// formulário de POI (`poi-form-sheet.tsx`), que é renderizado fora da árvore
// do mapa (sem a proteção `ssr: false`) — `leaflet` toca `window` ao
// carregar e quebra o SSR se importado aqui. `createPoiIcon` (que usa
// `L.divIcon`) fica isolado em `components/map/poi-marker-icon.tsx`.

// Ícones fixos das categorias padrão (seed do backend) + o conjunto livre
// oferecido no seletor da categoria "outros" (`ICON_PICKER_OPTIONS` abaixo).
// Chave = `icon_name` salvo no banco (categoria ou POI individual).
const ICON_REGISTRY: Record<string, LucideIcon> = {
  // categorias padrão
  utensils: Utensils,
  store: Store,
  stethoscope: Stethoscope,
  trees: Trees,
  drama: Drama,
  home: Home,
  activity: Activity,
  // seletor livre (categoria "outros")
  sparkles: Sparkles,
  church: Church,
  newspaper: Newspaper,
  landmark: Landmark,
  "building-2": Building2,
  flag: Flag,
  music: Music,
  "book-open": BookOpen,
  briefcase: Briefcase,
  car: Car,
  dog: Dog,
  gift: Gift,
  heart: Heart,
  camera: Camera,
  school: School,
  library: Library,
  flame: Flame,
  anchor: Anchor,
  plane: Plane,
  "train-front": TrainFront,
  bus: Bus,
  wrench: Wrench,
  palette: Palette,
  film: Film,
  mic: Mic,
  trophy: Trophy,
  "paw-print": PawPrint,
  coffee: Coffee,
  "shopping-bag": ShoppingBag,
  globe: Globe,
};

// Opções mostradas no seletor de ícone do formulário (subconjunto "livre" do
// registry acima, sem os ícones fixos de categoria) — rótulo em pt-BR.
export const ICON_PICKER_OPTIONS: { name: string; label: string }[] = [
  { name: "sparkles", label: "Outro" },
  { name: "church", label: "Igreja" },
  { name: "newspaper", label: "Notícia" },
  { name: "landmark", label: "Monumento" },
  { name: "building-2", label: "Prédio" },
  { name: "flag", label: "Bandeira" },
  { name: "music", label: "Música" },
  { name: "book-open", label: "Livro" },
  { name: "briefcase", label: "Trabalho" },
  { name: "car", label: "Carro" },
  { name: "dog", label: "Pet" },
  { name: "gift", label: "Presente" },
  { name: "heart", label: "Favorito" },
  { name: "camera", label: "Foto" },
  { name: "school", label: "Escola" },
  { name: "library", label: "Biblioteca" },
  { name: "flame", label: "Fogo" },
  { name: "anchor", label: "Náutico" },
  { name: "plane", label: "Viagem" },
  { name: "train-front", label: "Trem" },
  { name: "bus", label: "Ônibus" },
  { name: "wrench", label: "Oficina" },
  { name: "palette", label: "Arte" },
  { name: "film", label: "Cinema" },
  { name: "mic", label: "Show" },
  { name: "trophy", label: "Esporte" },
  { name: "paw-print", label: "Animal" },
  { name: "coffee", label: "Café" },
  { name: "shopping-bag", label: "Compras" },
  { name: "globe", label: "Outros lugares" },
];

const DEFAULT_ICON = Store;

export function resolveIconName(icon_name: string | null | undefined): LucideIcon {
  if (!icon_name) return DEFAULT_ICON;
  return ICON_REGISTRY[icon_name] ?? DEFAULT_ICON;
}

/** Ícone efetivo de um POI: o escolhido no próprio POI (categoria "outros")
 * tem prioridade; na ausência, cai pro ícone fixo da categoria. */
export function getPoiIcon(poi: Poi, category: Category | undefined): LucideIcon {
  return resolveIconName(poi.icon_name ?? category?.icon_name);
}

export function getCategoryIcon(category: Category | undefined): LucideIcon {
  return resolveIconName(category?.icon_name);
}
