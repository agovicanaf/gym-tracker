// Bilinçli olarak minimal bir servis çalışanı.
//
// Bu site canlı veriye bağımlı (Postgres'ten her an taze veri çekiyor, ayrıca
// 2 saniyede bir çoklu-cihaz senkronizasyon polling'i var). Bu yüzden burada
// agresif bir "stale-while-revalidate" veya API önbellekleme stratejisi
// KASITLI OLARAK uygulanmıyor — kullanıcıya eski/yanlış antrenman verisi
// gösterme riski, PWA'nın "app gibi açılma" faydasından çok daha önemli.
//
// Tek amacı: iOS/Android'in PWA kurulabilirlik kriterini karşılamak
// (bir servis çalışanı kayıtlı olmalı) ve ikon/manifest gibi değişmeyen
// statik varlıkları önbellekleyerek ana ekrandan açılışı bir tık
// hızlandırmak. HTML sayfaları ve /api/* istekleri HİÇ önbelleklenmiyor,
// her zaman ağdan taze çekiliyor.

const STATIC_CACHE = "static-v1";
const STATIC_ASSETS = [
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Sadece bildiğimiz statik varlıklar için cache-first davranışı.
  // Her şeyin geri kalanı (sayfalar, /api/*) her zaman ağa gider.
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
