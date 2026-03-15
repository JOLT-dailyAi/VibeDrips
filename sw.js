// sw.js - Service worker for VibeDrips PWA
// CACHE_VERSION is now timestamp-based and auto-updated by the workflow

const CACHE_VERSION = 'v20260315T062256-data'; // High-vis bump
const CACHE_NAME = `vibedrips-static-${CACHE_VERSION}`;
const DATA_CACHE = `vibedrips-data-${CACHE_VERSION}`;

const urlsToCache = [
  './',
  'index.html',

  // CSS Files - Base & Layout
  'assets/css/main.css',
  'assets/css/base/reset.css',
  'assets/css/base/variables.css',
  'assets/css/layout/header.css',
  'assets/css/layout/footer.css',
  'assets/css/layout/grid.css',

  // CSS Files - Components
  'assets/css/components/filters.css',
  'assets/css/components/buttons.css',
  'assets/css/components/product-card.css',
  'assets/css/components/modals.css',
  'assets/css/components/currency-modal.css',
  'assets/css/components/product-modal.css',
  'assets/css/components/reels-modal.css',
  'assets/css/components/reels-feed.css',
  'assets/css/components/badges.css',
  'assets/css/components/stats.css',

  // CSS Files - States
  'assets/css/states/loading.css',
  'assets/css/states/error.css',
  'assets/css/states/empty.css',

  // CSS Files - Themes & Utils
  'assets/css/themes/light-theme.css',
  'assets/css/themes/dark-theme.css',
  'assets/css/utils/glass.css',
  'assets/css/utils/floating.css',
  'assets/css/utils/responsive.css',

  // Core JS Files
  'assets/js/main.js',
  'assets/js/dom-cache.js',
  'assets/js/theme-toggle.js',
  'assets/js/ui-states.js',

  // Modal JS Files
  'assets/js/currency-modal.js',
  'assets/js/product-modal.js',
  'assets/js/modal-utils.js',
  'assets/js/reels-modal.js',
  'assets/js/reels-feed.js',

  // Data Loader JS Files
  'assets/js/currency-loader.js',
  'assets/js/product-loader.js',
  'assets/js/products.js',
  'assets/js/glass-settings.js',

  // PWA & Feature JS Files
  'assets/js/install-prompt.js',
  'assets/js/music-control.js',
  'assets/js/share.js',
  'assets/js/clipboard-voyager.js',

  // Images
  'assets/images/VibeDrips.png',
  'assets/images/VibeDrips_DP.png',
  'assets/images/VibeDrips_logo.png',
  'assets/images/linktree.png',

  // Music
  'assets/music/Losstime.mp3',

  // Manifest
  'manifest.json'
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
        console.log(`[SW ${CACHE_VERSION}] Install complete`);
        // We removed self.skipWaiting() to allow the update prompt to control activation
      })
      .catch(error => {
        console.error(`[SW ${CACHE_VERSION}] Install failed:`, error);
      })
  );
});

// Activate - clean up old caches (timestamp version handles this)
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
    }).then(() => {
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
// Handle messages from the client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 🛡️ Method Guard: Only GET requests can be cached. 
  // Bypass HEAD, POST, etc. to prevent Cache API crashes.
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Don't cache external resources (CDN, APIs, etc)
  if (!url.pathname.startsWith('/')) {
    event.respondWith(
      fetch(event.request).catch(err => {
        console.warn(`[SW ${CACHE_VERSION}] External fetch failed:`, url.href);
        return new Response('External resource unavailable', { status: 503 });
      })
    );
    return;
  }

  // NETWORK-FIRST for product data (always fresh, cache as backup)
  if (url.pathname.includes('/data/')) {
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
