"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Transição de entrada (fade + leve deslize) pras páginas "de verdade" do
 * app — hoje só a pública `/p/[slug]` (Sprint 6); o resto é SPA com painéis
 * overlay, que já tem transição própria via `Sheet`. */
export function FadeInPage({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
