import Image from "next/image";

import { AuthButton } from "@/components/layout/auth-button";
import { NotificationBell } from "@/components/layout/notification-bell";
import { SearchBar } from "@/components/layout/search-bar";

interface HudHeaderProps {
  userId?: string | null;
}

/** Topo do HUD (reorganização inspirada no Google Maps, 08/11/2026):
 * `ThemeSwitcher` migrou pra dentro do Leaflet (ver `map-controls.tsx`),
 * virando o botão "camadas" isolado na lateral do mapa — por isso sobra só
 * logo, busca, sino e avatar aqui, cada um com seu próprio espaço, igual
 * sempre foi (uma rodada anterior tentou sobrepor sino+avatar na borda da
 * busca; o dono do projeto não gostou do resultado, revertido). */
export function HudHeader({ userId }: HudHeaderProps) {
  return (
    <header className="pointer-events-none flex items-center gap-1.5 sm:gap-3">
      <div className="pointer-events-auto flex shrink-0 items-center gap-2 rounded-full border border-border bg-card/80 px-2.5 py-2 backdrop-blur-md sm:px-4">
        <Image src="/MaPinha.png" alt="MaPinha" width={24} height={24} className="size-6" />
        <span className="hidden font-display text-lg text-primary sm:inline">MaPinha</span>
      </div>

      <SearchBar userId={userId} />

      <div className="pointer-events-auto shrink-0">
        <NotificationBell userId={userId} />
      </div>

      <div className="pointer-events-auto shrink-0">
        <AuthButton />
      </div>
    </header>
  );
}
