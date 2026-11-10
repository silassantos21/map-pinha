import {
  Anchor,
  Activity,
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
  Store,
  Stethoscope,
  TrainFront,
  Trees,
  Trophy,
  Utensils,
  Wrench,
} from "lucide-react-native";

// Espelha `frontend/src/lib/poi-icons.ts` (mesmas chaves kebab-case gravadas
// como `icon_name` no banco) — `lucide-react-native` é a porta oficial do
// `lucide-react` usado na web, então os nomes dos ícones são idênticos, só
// o pacote muda. Qualquer `icon_name` novo adicionado na web precisa ser
// espelhado aqui também.
export const ICON_REGISTRY: Record<string, LucideIcon> = {
  // Ícones fixos das categorias-semente
  utensils: Utensils,
  store: Store,
  stethoscope: Stethoscope,
  trees: Trees,
  drama: Drama,
  home: Home,
  activity: Activity,
  // Seletor livre (categoria "outros")
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

const DEFAULT_ICON = Store;

export function resolveIconName(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return DEFAULT_ICON;
  return ICON_REGISTRY[iconName] ?? DEFAULT_ICON;
}
