// sw.js - Service Worker with background music cache

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
  '/VibeDrips/assets/music/Losstime.mp3' // ← Background music cached (one-time download)
];

// Install service worker and cache files
self.addEventListener('install', event => {
  console.log('Service Worker installing... Caching background music.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell and background music');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch strategy: Cache-first for music, Network-first for products
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Always fetch product data fresh from network (never cache)
  if (url.pathname.includes('/assets/data/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Return offline message if network fails
          return new Response(
            JSON.stringify({ error: 'Offline - products require internet' }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }
  
  // Cache-first for everything else (including music)
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Clean up old caches on activation
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
