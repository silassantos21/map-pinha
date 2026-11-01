"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface MotionListItemProps {
  index: number;
  children: ReactNode;
}

/** Entrada animada (fade + leve deslize de baixo pra cima) pros itens de
 * listas em painéis (Favoritos, Minhas rotas, Perfil — Sprint 6). Atraso
 * escalonado por índice, limitado a 300ms pra listas longas não demorarem
 * pra terminar de aparecer. */
export function MotionListItem({ index, children }: MotionListItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
    >
      {children}
    </motion.div>
  );
}
