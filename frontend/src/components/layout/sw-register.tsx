"use client";

import { useEffect } from "react";

/** Registra o service worker (`public/sw.js`) assim que o app carrega — só
 * cacheia tiles do mapa, ver comentário no próprio arquivo do worker. Não
 * renderiza nada, é só um efeito colateral de boot. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Falha em registrar não deve quebrar o app — PWA é um extra, não um
      // requisito pra usar o mapa normalmente.
    });
  }, []);

  return null;
}
