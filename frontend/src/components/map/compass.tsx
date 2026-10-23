"use client";

import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import { useMap } from "react-leaflet";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const DEFAULT_CENTER: [number, number] = [-23.5505, -46.6333]; // São Paulo
const DEFAULT_ZOOM = 13;

export function MapCompass() {
  const map = useMap();

  return (
    <motion.div
      className="pointer-events-auto absolute top-32 right-4 z-[1000]"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              size="icon-lg"
              variant="secondary"
              className="rounded-full border border-border bg-card/80 shadow-lg backdrop-blur-md"
              onClick={() => map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 1 })}
              aria-label="Resetar vista do mapa"
            />
          }
        >
          <motion.span
            className="flex"
            animate={{ rotate: [0, -6, 6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Compass className="size-5" />
          </motion.span>
        </TooltipTrigger>
        <TooltipContent side="left">Voltar pra vista inicial</TooltipContent>
      </Tooltip>
    </motion.div>
  );
}
