import Image from "next/image";

import { AuthButton } from "@/components/layout/auth-button";
import { NotificationBell } from "@/components/layout/notification-bell";
import { SearchBar } from "@/components/layout/search-bar";
import { ThemeSwitcher } from "@/components/map/theme-switcher";

interface HudHeaderProps {
  userId?: string | null;
}

export function HudHeader({ userId }: HudHeaderProps) {
  return (
    <header className="pointer-events-none flex items-center gap-1.5 sm:gap-3">
      <div className="pointer-events-auto flex shrink-0 items-center gap-2 rounded-full border border-border bg-card/80 px-2.5 py-2 backdrop-blur-md sm:px-4">
        <Image src="/MaPinha.png" alt="MaPinha" width={24} height={24} className="size-6" />
        <span className="hidden font-display text-lg text-primary sm:inline">MaPinha</span>
      </div>

      <SearchBar userId={userId} />

      <ThemeSwitcher />

      <div className="pointer-events-auto shrink-0">
        <NotificationBell userId={userId} />
      </div>

      <div className="pointer-events-auto shrink-0">
        <AuthButton />
      </div>
    </header>
  );
}
