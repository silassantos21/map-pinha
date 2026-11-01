import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MaPinha — Mapa Gamificado",
    short_name: "MaPinha",
    description: "Mapa interativo gamificado com pontos de interesse personalizados.",
    start_url: "/",
    display: "standalone",
    background_color: "#0e1824",
    theme_color: "#0e1824",
    orientation: "portrait-primary",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
