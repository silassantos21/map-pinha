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
    <div className="pointer-events-auto flex shrink-0 items-center gap-0.5 rounded-full border border-border bg-card/80 p-0.5 backdrop-blur-md sm:gap-1 sm:p-1">
      {MAP_THEME_LIST.map((theme) => {
        const isActive = theme.id === activeTheme;
        return (
          <Tooltip key={theme.id}>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => setActiveTheme(theme.id)}
                  className="relative flex size-6 items-center justify-center rounded-full sm:size-7"
                  aria-label={`Tema ${theme.label}`}
                  aria-pressed={isActive}
                />
              }
            >
              {isActive && (
                <motion.div
                  layoutId="active-map-theme"
                  className="absolute inset-0 rounded-full border-2 border-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className={cn(theme.accentClassName, "size-3.5 rounded-full sm:size-4")} />
            </TooltipTrigger>
            <TooltipContent>Tema {theme.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
