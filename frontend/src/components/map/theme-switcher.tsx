"use client";

import { motion } from "framer-motion";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MAP_THEME_LIST } from "@/lib/map-themes";
import { cn } from "@/lib/utils";
import { useMapStore } from "@/stores/map-store";

export function ThemeSwitcher() {
  const activeTheme = useMapStore((s) => s.activeTheme);
  const setActiveTheme = useMapStore((s) => s.setActiveTheme);

  return (
    <div className="pointer-events-auto flex shrink-0 items-center gap-1 rounded-full border border-border bg-card/80 p-1 backdrop-blur-md">
      {MAP_THEME_LIST.map((theme) => {
        const isActive = theme.id === activeTheme;
        return (
          <Tooltip key={theme.id}>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => setActiveTheme(theme.id)}
                  className="relative flex size-7 items-center justify-center rounded-full"
                  aria-label={`Tema ${theme.label}`}
                  aria-pressed={isActive}
                />
              }
            >
              {isActive && (
                <motion.div
                  layoutId="active-map-theme"
                  className="absolute inset-0 rounded-full border-2 border-foreground"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className={cn(theme.accentClassName, "size-4 rounded-full")} />
            </TooltipTrigger>
            <TooltipContent>Tema {theme.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
