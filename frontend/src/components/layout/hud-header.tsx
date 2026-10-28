import Image from "next/image";

import { AuthButton } from "@/components/layout/auth-button";
import { SearchBar } from "@/components/layout/search-bar";
import { ThemeSwitcher } from "@/components/map/theme-switcher";

interface HudHeaderProps {
  userId?: string | null;
}

export function HudHeader({ userId }: HudHeaderProps) {
  return (
    <header className="pointer-events-none flex items-center gap-3">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 backdrop-blur-md">
        <Image src="/MaPinha.png" alt="" width={24} height={24} className="size-6" />
        <span className="font-display text-lg text-primary">MaPinha</span>
      </div>

      <SearchBar userId={userId} />

      <ThemeSwitcher />

      <div className="pointer-events-auto shrink-0">
        <AuthButton />
      </div>
    </header>
  );
}
