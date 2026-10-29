import type { Metadata } from "next";
import { Inter, Silkscreen } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";

import { QueryProvider } from "@/components/providers/query-provider";
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
      </body>
    </html>
  );
}
