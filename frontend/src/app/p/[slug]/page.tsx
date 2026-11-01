import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Navigation } from "lucide-react";

import { FadeInPage } from "@/components/layout/fade-in-page";
import { googleMapsSearchUrl } from "@/lib/deep-links";
import { backendFetch } from "@/lib/api-server";
import { resolveIconName } from "@/lib/poi-icons";
import type { PoiPublic } from "@/types/poi";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// `no-store`: página pública, mas o dono pode editar/tornar privado o POI a
// qualquer momento — não queremos servir uma versão cacheada desatualizada
// (ex: continuar mostrando um POI que virou privado).
async function getPoi(slug: string): Promise<PoiPublic | null> {
  const res = await backendFetch(`/api/v1/pois/by-slug/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const poi = await getPoi(slug);
  if (!poi) {
    return { title: "POI não encontrado — MaPinha" };
  }

  const hero = poi.media.find((m) => m.media_type === "image" || m.media_type === "gif");
  const description =
    poi.description ?? `Confira "${poi.name}" no MaPinha, um mapa interativo gamificado.`;

  return {
    title: `${poi.name} — MaPinha`,
    description,
    openGraph: {
      title: poi.name,
      description,
      type: "website",
      images: hero ? [{ url: hero.thumbnail_url ?? hero.url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: poi.name,
      description,
      images: hero ? [hero.thumbnail_url ?? hero.url] : undefined,
    },
  };
}

export default async function PublicPoiPage({ params }: PageProps) {
  const { slug } = await params;
  const poi = await getPoi(slug);
  if (!poi) notFound();

  const Icon = resolveIconName(poi.icon_name ?? poi.category_icon_name);
  const visuals = poi.media.filter((m) => m.media_type === "image" || m.media_type === "gif");
  const audioTracks = poi.media.filter((m) => m.media_type === "audio");
  const hero = visuals[0];

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-4 py-10">
      <Link href="/" className="flex items-center gap-2 self-center">
        <Image src="/MaPinha.png" alt="" width={28} height={28} className="size-7" />
        <span className="font-display text-xl text-primary">MaPinha</span>
      </Link>

      <FadeInPage>
      <article className="overflow-hidden rounded-2xl border border-border bg-card">
        {hero && (
          // eslint-disable-next-line @next/next/no-img-element -- imagem vem do R2 (host externo, sem domínio fixo configurado em next.config.mjs)
          <img
            src={hero.media_type === "gif" ? hero.url : (hero.thumbnail_url ?? hero.url)}
            alt=""
            className="h-56 w-full object-cover"
          />
        )}

        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-2">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: poi.category_color_hex }}
            >
              {/* eslint-disable-next-line react-hooks/static-components -- Icon vem de um registro fixo (ICON_REGISTRY em poi-icons.ts), referência estável */}
              <Icon className="size-4 text-white" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-muted-foreground">
                {poi.category_name}
              </p>
              <h1 className="truncate font-display text-lg text-foreground">{poi.name}</h1>
            </div>
          </div>

          {poi.description && (
            <p className="text-sm text-foreground/90">{poi.description}</p>
          )}

          {poi.address && (
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              {poi.address}
            </p>
          )}

          {audioTracks.length > 0 && (
            <div className="flex flex-col gap-2">
              {audioTracks.map((track) => (
                <audio key={track.id} src={track.url} controls className="w-full" />
              ))}
            </div>
          )}

          {poi.owner_name && (
            <div className="flex items-center gap-2 border-t border-border pt-3">
              {poi.owner_avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- avatar vem do Google (host externo, sem domínio fixo configurado)
                <img
                  src={poi.owner_avatar_url}
                  alt=""
                  className="size-6 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="size-6 rounded-full bg-muted" />
              )}
              <p className="text-xs text-muted-foreground">
                Mapeado por <span className="text-foreground">{poi.owner_name}</span>
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Link
              href={`/?poi=${encodeURIComponent(poi.slug)}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
            >
              <MapPin className="size-4" />
              Ver no mapa completo
            </Link>
            <a
              href={googleMapsSearchUrl({ lat: poi.lat, lng: poi.lng })}
              target="_blank"
              rel="noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <Navigation className="size-4" />
              Abrir no Google Maps
            </a>
          </div>
        </div>
      </article>
      </FadeInPage>
    </main>
  );
}
