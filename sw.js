/* Mi tren: copia sin conexión.
   Si cambias index.html, sube el número de versión de abajo (v1 -> v2) para que los móviles se actualicen. */
const CACHE = "mi-tren-v1";
const CORE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith((async () => {
    const hit = await caches.match(e.request, { ignoreSearch: true });
    const update = fetch(e.request).then(r => {
      if (r && (r.ok || r.type === "opaque")) {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return r;
    });
    if (hit) { e.waitUntil(update.catch(() => {})); return hit; }
    try { return await update; }
    catch (err) {
      if (e.request.mode === "navigate") { const page = await caches.match("index.html"); if (page) return page; }
      throw err;
    }
  })());
});
