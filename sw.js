// sw.js - Cache only app shell, NOT data

const CACHE_NAME = 'vibedrips-shell-v1.2';
const urlsToCache = [
  '/VibeDrips/',
  '/VibeDrips/index.html',
  '/VibeDrips/assets/css/main.css',
  '/VibeDrips/assets/js/main.js',
  '/VibeDrips/assets/js/dom-cache.js',
  '/VibeDrips/assets/js/theme-toggle.js',
  '/VibeDrips/assets/js/products.js',
  '/VibeDrips/assets/images/VibeDrips.png',
  '/VibeDrips/assets/images/VibeDrips_DP.png'
   '/VibeDrips/assets/music/Losstime.mp3' // ← Background music cached (one-time download)
  // ❌ NO JSON files
  // ❌ NO music files
  // ❌ NO product images
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Network-first for JSON data (always fresh)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Always fetch JSON/music from network
  if (url.pathname.includes('/assets/data/') || 
      url.pathname.includes('/assets/music/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Cache-first for app shell
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

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
