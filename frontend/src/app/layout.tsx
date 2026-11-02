import type { Metadata, Viewport } from "next";
import { Inter, Silkscreen } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
// Estilo padrão dos balões de cluster (react-leaflet-cluster usa o
// leaflet.markercluster por baixo, mas não injeta o CSS dele sozinho) — sem
// isso, um cluster de 2+ POIs próximos renderiza só o número, sem nenhum
// estilo (bug real visto em produção: POIs na mesma coordenada ficavam
// "invisíveis" no mapa, só o número do cluster flutuando sem fundo).
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import { QueryProvider } from "@/components/providers/query-provider";
import { ServiceWorkerRegister } from "@/components/layout/sw-register";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const silkscreen = Silkscreen({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-silkscreen",
});

export const metadata: Metadata = {
  title: "MaPinha",
  description:
    "Mapa interativo gamificado com pontos de interesse personalizados.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MaPinha",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e1824",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${silkscreen.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <TooltipProvider delay={300}>
            <Toaster>{children}</Toaster>
          </TooltipProvider>
        </QueryProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
