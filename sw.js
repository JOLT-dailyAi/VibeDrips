// sw.js - Service worker for VibeDrips PWA
// IMPORTANT: Update CACHE_VERSION every time you update products.csv

const CACHE_VERSION = 'v3.0'; // Jump to v3 instead of auto-increment ⬅️ INCREMENT THIS ON EVERY CSV UPDATE (v2.1, v2.2, etc.)
const CACHE_NAME = `vibedrips-static-${CACHE_VERSION}`;
const DATA_CACHE = `vibedrips-data-${CACHE_VERSION}`;

const urlsToCache = [
  '/VibeDrips/',
  '/VibeDrips/index.html',
  
  // CSS Files - Base & Layout
  '/VibeDrips/assets/css/main.css',
  '/VibeDrips/assets/css/base/reset.css',
  '/VibeDrips/assets/css/base/variables.css',
  '/VibeDrips/assets/css/layout/header.css',
  '/VibeDrips/assets/css/layout/footer.css',
  '/VibeDrips/assets/css/layout/grid.css',
  
  // CSS Files - Components
  '/VibeDrips/assets/css/components/filters.css',
  '/VibeDrips/assets/css/components/buttons.css',
  '/VibeDrips/assets/css/components/product-card.css',
  '/VibeDrips/assets/css/components/modals.css',
  '/VibeDrips/assets/css/components/currency-modal.css',
  '/VibeDrips/assets/css/components/product-modal.css',
  '/VibeDrips/assets/css/components/reels-modal.css',
  '/VibeDrips/assets/css/components/reels-feed.css',
  '/VibeDrips/assets/css/components/badges.css',
  '/VibeDrips/assets/css/components/stats.css',
  
  // CSS Files - States
  '/VibeDrips/assets/css/states/loading.css',
  '/VibeDrips/assets/css/states/error.css',
  '/VibeDrips/assets/css/states/empty.css',
  
  // CSS Files - Themes & Utils
  '/VibeDrips/assets/css/themes/light-theme.css',
  '/VibeDrips/assets/css/themes/dark-theme.css',
  '/VibeDrips/assets/css/utils/glass.css',
  '/VibeDrips/assets/css/utils/floating.css',
  '/VibeDrips/assets/css/utils/responsive.css',
  
  // Core JS Files
  '/VibeDrips/assets/js/main.js',
  '/VibeDrips/assets/js/dom-cache.js',
  '/VibeDrips/assets/js/theme-toggle.js',
  '/VibeDrips/assets/js/event-handlers.js',
  '/VibeDrips/assets/js/ui-states.js',
  
  // Modal JS Files
  '/VibeDrips/assets/js/currency-modal.js',
  '/VibeDrips/assets/js/product-modal.js',
  '/VibeDrips/assets/js/modal-utils.js',
  '/VibeDrips/assets/js/reels-modal.js',
  '/VibeDrips/assets/js/reels-feed.js',
  
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

// Install - cache static resources only
self.addEventListener('install', event => {
  console.log(`[SW ${CACHE_VERSION}] Installing...`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log(`[SW ${CACHE_VERSION}] Caching static files`);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log(`[SW ${CACHE_VERSION}] Install complete - skipping waiting`);
        return self.skipWaiting(); // Activate immediately
      })
      .catch(error => {
        console.error(`[SW ${CACHE_VERSION}] Install failed:`, error);
      })
  );
});

// Activate - clean up old caches
self.addEventListener('activate', event => {
  console.log(`[SW ${CACHE_VERSION}] Activating...`);
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete any cache that doesn't match current version
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE) {
            console.log(`[SW ${CACHE_VERSION}] Deleting old cache:`, cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log(`[SW ${CACHE_VERSION}] Activated - claiming clients`);
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Listen for skip waiting message from update prompt
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log(`[SW ${CACHE_VERSION}] Received SKIP_WAITING message`);
    self.skipWaiting();
  }
});

// Fetch strategy
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Don't cache external resources (CDN, APIs, etc)
  if (!url.pathname.startsWith('/VibeDrips/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // NETWORK-FIRST for product data (always fresh, cache as backup)
  if (url.pathname.includes('/assets/data/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone and update data cache
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DATA_CACHE).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          console.log(`[SW ${CACHE_VERSION}] Network failed, using cached data`);
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // Last resort - error response
              return new Response(
                JSON.stringify({ 
                  error: 'Offline - products require internet connection',
                  cached: false 
                }),
                { 
                  status: 503,
                  headers: { 'Content-Type': 'application/json' } 
                }
              );
            });
        })
    );
    return;
  }
  
  // CACHE-FIRST for everything else (static assets)
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(event.request)
          .then(response => {
            // Cache successful responses
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

// Nuclear option - clear everything
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

