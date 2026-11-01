// Service worker do MaPinha (PWA, Sprint 6) — escopo DELIBERADAMENTE restrito
// a cachear tiles do mapa (Stadia Maps/ESRI). Não cacheia o app shell (JS/CSS
// do Next.js): o nome dos arquivos muda a cada build, cachear isso sem uma
// estratégia de invalidação coordenada arriscaria servir um bundle velho
// depois de um deploy — risco real, benefício pequeno enquanto o app ainda
// nem tem deploy. Tiles são diferentes: a mesma URL (z/x/y) sempre devolve a
// mesma imagem, então cachear é 100% seguro e já cobre o caso de uso real
// ("cache offline parcial do mapa" — áreas já visitadas continuam
// renderizando com conexão ruim ou offline).

const TILE_CACHE = "mapinha-tiles-v1";
const TILE_HOSTS = ["tiles.stadiamaps.com", "server.arcgisonline.com"];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== TILE_CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (!TILE_HOSTS.includes(url.hostname)) return;

  event.respondWith(
    caches.open(TILE_CACHE).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      try {
        const response = await fetch(event.request);
        if (response.ok) cache.put(event.request, response.clone());
        return response;
      } catch {
        return cached ?? Response.error();
      }
    }),
  );
});
