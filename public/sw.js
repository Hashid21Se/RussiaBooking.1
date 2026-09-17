/**
 * RussiaBooking Production Service Worker
 * Fully compliant with PWABuilder & PWA standards
 * Version: 1.0.0
 */

const CACHE_VERSION = 'russiabooking-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Static Shell & Core Brand Assets to Pre-cache on Install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-192-maskable.png',
  '/icons/icon-512-maskable.png',
  '/screenshots/home-mobile.png',
  '/screenshots/search-mobile.png',
  '/screenshots/hotel-mobile.png'
];

// Sensitive API routes that MUST NEVER be cached
const SENSITIVE_API_PATTERNS = [
  /\/api\/auth\//,
  /\/api\/payments\//,
  /\/api\/bookings/,
  /\/api\/user\//,
  /\/api\/csrf-token/,
  /\/api\/admin\//
];

// 1. INSTALL LIFECYCLE
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // Use Promise.allSettled so a single missing asset doesn't fail the whole install
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          fetch(url, { credentials: 'same-origin' })
            .then((response) => {
              if (response.ok) {
                return cache.put(url, response);
              }
            })
            .catch((err) => {
              console.warn('[ServiceWorker] Precache skipped for:', url, err.message);
            })
        )
      );
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 2. ACTIVATE LIFECYCLE - Clean up older versioned caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 3. FETCH INTERCEPTION WITH SAFE ARCHITECTURE
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // A. Only intercept HTTP/HTTPS GET requests
  if (request.method !== 'GET') {
    return;
  }

  // B. Bypass chrome-extension and non-http schemes
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // C. NEVER cache sensitive APIs, user data, or payments
  const isSensitive = SENSITIVE_API_PATTERNS.some((pattern) => pattern.test(url.pathname));
  if (isSensitive) {
    return; // Pass through straight to network
  }

  // D. HTML Page Navigation (Single Page App Shell fallback)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put('/', clone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline navigation fallback: return cached SPA index shell
          const cachedIndex = await caches.match('/');
          if (cachedIndex) return cachedIndex;
          return new Response(
            `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>RussiaBooking Offline</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:sans-serif;text-align:center;padding:40px;background:#0F141C;color:#F8FAFC;"><h1 style="color:#C8102E;">RussiaBooking</h1><p>أنت تتصفح حالياً في وضع عدم الاتصال بالإنترنت.</p><button onclick="location.reload()" style="background:#C8102E;color:#fff;border:none;padding:12px 24px;border-radius:12px;font-weight:bold;cursor:pointer;">إعادة المحاولة</button></body></html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // E. Read-Only Public APIs (e.g. /api/hotels) -> Network First with dynamic cache fallback
  if (url.pathname.startsWith('/api/hotels') || url.pathname.startsWith('/api/health')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, clone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(JSON.stringify({ offline: true, error: 'Network unavailable' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // F. Static Assets (Scripts, Styles, Images, Fonts) -> Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/screenshots/') ||
    /\.(js|css|png|jpg|jpeg|svg|webp|woff2|woff|ttf|ico)$/i.test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              const clone = networkResponse.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, clone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // G. Default: Network with Cache Fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// 4. MESSAGE EVENT - Allow frontend to trigger skipWaiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
