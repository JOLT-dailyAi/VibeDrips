// sw.js - Service worker for VibeDrips PWA

const CACHE_NAME = 'vibedrips-v1.5'; 
const urlsToCache = [
  '/VibeDrips/',
  '/VibeDrips/index.html',
  
  // CSS Files
  '/VibeDrips/assets/css/main.css',
  '/VibeDrips/assets/css/utils/glass.css',
  '/VibeDrips/assets/css/components/currency-modal.css',
  '/VibeDrips/assets/css/components/product-modal.css',
  
  // Core JS Files
  '/VibeDrips/assets/js/main.js',
  '/VibeDrips/assets/js/dom-cache.js',
  '/VibeDrips/assets/js/theme-toggle.js',
  '/VibeDrips/assets/js/event-handlers.js',
  '/VibeDrips/assets/js/ui-states.js',
  
  // Modal JS Files (NEW - replaced modal-manager.js)
  '/VibeDrips/assets/js/currency-modal.js',
  '/VibeDrips/assets/js/product-modal.js',
  '/VibeDrips/assets/js/modal-utils.js',
  
  // Data Loader JS Files
  '/VibeDrips/assets/js/currency-loader.js',
  '/VibeDrips/assets/js/product-loader.js',
  '/VibeDrips/assets/js/filter-manager.js',
  '/VibeDrips/assets/js/products.js',
  '/VibeDrips/assets/js/glass-settings.js',
  
  // PWA & Feature JS Files
  '/VibeDrips/assets/js/install-prompt.js',
  '/VibeDrips/assets/js/music-control.js',
  '/VibeDrips/assets/js/share.js',
  
  // Images
  '/VibeDrips/assets/images/VibeDrips.png',
  '/VibeDrips/assets/images/VibeDrips_DP.png',
  '/VibeDrips/assets/images/VibeDrips_logo.png',
  '/VibeDrips/assets/images/linktree.png',
  
  // Music
  '/VibeDrips/assets/music/Losstime.mp3',
  
  // Manifest
  '/VibeDrips/manifest.json'
];

// Install - cache all resources
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Install complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch(error => {
        console.error('[SW] Install failed:', error);
      })
  );
});

// Activate - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[SW] Activated');
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch strategy
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Don't cache external resources (CDN, APIs, etc)
  if (!url.pathname.startsWith('/VibeDrips/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Network-first for product data (always fresh)
  if (url.pathname.includes('/assets/data/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone and cache the response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Last resort - error response
              return new Response(
                JSON.stringify({ error: 'Offline - products require internet' }),
                { headers: { 'Content-Type': 'application/json' } }
              );
            });
        })
    );
    return;
  }
  
  // Cache-first for everything else (static assets)
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // Not in cache, fetch from network
        return fetch(event.request)
          .then(response => {
            // Cache the fetched response
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          });
      })
  );
});
