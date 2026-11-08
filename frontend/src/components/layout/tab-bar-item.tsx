"use client";

import { forwardRef, type ComponentPropsWithoutRef, type MouseEvent } from "react";

import { cn } from "@/lib/utils";

interface TabBarButtonProps extends ComponentPropsWithoutRef<"button"> {
  disabled?: boolean;
}

/** Casca compartilhada dos 4 itens fixos da barra de navegação do rodapé
 * (reorganização do HUD, 08/11/2026) — ícone em cima, rótulo embaixo, slot
 * sempre presente mesmo pra quem exige login (em vez de sumir, como o
 * cluster de botões antigo fazia). Usado como `render` target de cada
 * `SheetTrigger` (`followers-panel.tsx`/`groups-panel.tsx`/
 * `route-history-panel.tsx`/`poi-panel.tsx`), exatamente como `Button` era
 * usado antes.
 *
 * `disabled` aqui não é o atributo HTML real (isso tiraria `pointer-events`
 * e o tooltip de aviso nunca abriria no hover) — mesmo truque já usado em
 * `poi-create-button-client.tsx` pro botão de criar POI pra visitante:
 * aparência desabilitada + clique inofensivo (`preventDefault`), Tooltip por
 * fora continua funcionando. */
export const TabBarButton = forwardRef<HTMLButtonElement, TabBarButtonProps>(function TabBarButton(
  { className, disabled, onClick, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-disabled={disabled ? "true" : undefined}
      onClick={
        disabled
          ? (event: MouseEvent<HTMLButtonElement>) => event.preventDefault()
          : onClick
      }
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium text-foreground transition-colors",
        disabled ? "cursor-not-allowed opacity-50" : "hover:text-primary",
        className,
      )}
      {...props}
    />
  );
});
