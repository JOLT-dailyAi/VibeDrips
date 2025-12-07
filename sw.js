// sw.js - Completely silent service worker

const CACHE_NAME = 'vibedrips-v1.2';
const urlsToCache = [
  '/VibeDrips/',
  '/VibeDrips/index.html',
  '/VibeDrips/assets/css/main.css',
  '/VibeDrips/assets/js/main.js',
  '/VibeDrips/assets/js/dom-cache.js',
  '/VibeDrips/assets/js/theme-toggle.js',
  '/VibeDrips/assets/js/event-handlers.js',
  '/VibeDrips/assets/js/ui-states.js',
  '/VibeDrips/assets/js/modal-manager.js',
  '/VibeDrips/assets/js/currency-loader.js',
  '/VibeDrips/assets/js/product-loader.js',
  '/VibeDrips/assets/js/filter-manager.js',
  '/VibeDrips/assets/js/products.js',
  '/VibeDrips/assets/images/VibeDrips.png',
  '/VibeDrips/assets/images/VibeDrips_DP.png',
  '/VibeDrips/assets/music/Losstime.mp3'
];

// Install silently (no console logs)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch strategy
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  if (url.pathname.includes('/assets/data/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(
            JSON.stringify({ error: 'Offline - products require internet' }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// Clean up old caches silently
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
