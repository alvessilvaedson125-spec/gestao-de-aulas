// sw.js

const CACHE_NAME = "gestao-v304";
  const FILES_TO_CACHE = [
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "firebase-messaging-sw.js"
];

// Instala e armazena os arquivos no cache
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("[Service Worker] Cacheando arquivos essenciais");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting(); // ativa imediatamente
});

// Ativa e limpa caches antigos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removendo cache antigo:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim(); // assume controle das páginas abertas
});

// Intercepta requisições e responde com cache ou rede
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});