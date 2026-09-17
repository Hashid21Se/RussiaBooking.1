/**
 * Production Service Worker Registration for RussiaBooking
 * Manages service worker lifecycle, updates, and offline readiness
 */

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Register when page has loaded to avoid blocking initial critical render
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        // Check for updates periodically (e.g. every hour)
        setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 60 * 1000);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available; emit custom event if UI wants to show an update banner
              window.dispatchEvent(new CustomEvent('pwa-update-available', { detail: registration }));
            }
          });
        });
      })
      .catch((error) => {
        // Some sandboxed iframes disallow service workers; fail gracefully
        console.warn('[PWA] Service Worker registration skipped or failed:', error.message);
      });
  });
}

export function unregisterServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.warn('[PWA] Service Worker unregister failed:', error.message);
      });
  }
}
