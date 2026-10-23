import type { Category, MapBounds, Poi } from "@/types/poi";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/api/v1/categories`);
  if (!res.ok) throw new Error("Falha ao carregar categorias");
  return res.json();
}

interface FetchPoisParams {
  bounds?: MapBounds;
  categorySlug?: string | null;
  q?: string | null;
}

// Passa pelo BFF (`/api/pois`, Next.js), não direto pro FastAPI: o `user_id`
// é resolvido lá a partir da sessão autenticada no servidor, nunca de um
// parâmetro vindo do navegador — ver nota de segurança no SPRINTS.md.
export async function fetchPois({ bounds, categorySlug, q }: FetchPoisParams): Promise<Poi[]> {
  const params = new URLSearchParams();
  if (bounds) {
    params.set("min_lat", String(bounds.minLat));
    params.set("min_lng", String(bounds.minLng));
    params.set("max_lat", String(bounds.maxLat));
    params.set("max_lng", String(bounds.maxLng));
  }
  if (categorySlug) params.set("category_slug", categorySlug);
  if (q) params.set("q", q);

  const res = await fetch(`/api/pois?${params.toString()}`);
  if (!res.ok) throw new Error("Falha ao carregar POIs");
  return res.json();
}

export async function fetchPoiById(id: string): Promise<Poi> {
  const res = await fetch(`/api/pois/${id}`);
  if (!res.ok) throw new Error("Falha ao carregar o POI");
  return res.json();
}

export async function fetchFavorites(): Promise<Poi[]> {
  const res = await fetch("/api/favorites");
  if (!res.ok) throw new Error("Falha ao carregar favoritos");
  return res.json();
}

export async function fetchMyPois(): Promise<Poi[]> {
  const res = await fetch("/api/pois/mine");
  if (!res.ok) throw new Error("Falha ao carregar seus POIs");
  return res.json();
}
