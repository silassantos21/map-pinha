import { useSyncExternalStore } from "react";

function subscribe(query: string, onChange: () => void) {
  const mediaQueryList = window.matchMedia(query);
  mediaQueryList.addEventListener("change", onChange);
  return () => mediaQueryList.removeEventListener("change", onChange);
}

/** `false` no primeiro render (SSR-safe) — atualiza assim que o `matchMedia`
 * do navegador resolve, e volta a atualizar se a janela for redimensionada.
 * `useSyncExternalStore` em vez de `useEffect` + `setState` porque é
 * literalmente pra isso que ele existe (assinar uma fonte de verdade externa
 * ao React, como o `matchMedia` do navegador) — evita o anti-padrão de
 * disparar um `setState` síncrono dentro de um efeito. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => subscribe(query, onChange),
    () => window.matchMedia(query).matches,
    () => false,
  );
}
