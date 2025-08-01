const CACHE_NAME = 'hardware-repair-v1.0.0';
const urlsToCache = [
  '/hardware-repair-system/',
  '/hardware-repair-system/static/js/bundle.js',
  '/hardware-repair-system/static/css/main.css',
  '/hardware-repair-system/manifest.json',
  '/hardware-repair-system/icon-192.png',
  '/hardware-repair-system/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
