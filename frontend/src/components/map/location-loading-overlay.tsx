"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

interface LocationLoadingOverlayProps {
  show: boolean;
}

/** Cobre o mapa (com o fundo borrado por baixo) enquanto a geolocalização do
 * usuário ainda não resolveu pela primeira vez. A logo "pula" como um pin
 * caindo/procurando no mapa — um loading state mais gamificado que um
 * spinner genérico (Sprint 6). */
export function LocationLoadingOverlay({ show }: LocationLoadingOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 z-[1100] flex flex-col items-center justify-center gap-3 bg-background/50 backdrop-blur-md"
        >
          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/MaPinha.png"
              alt="MaPinha"
              width={64}
              height={64}
              className="size-16 drop-shadow-[0_0_18px_rgba(117,174,75,0.45)]"
              priority
            />
          </motion.div>
          <p className="font-display text-xs tracking-wide text-muted-foreground">
            Localizando você...
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
