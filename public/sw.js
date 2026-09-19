// Samuel - Set-and-forget strictly Cache-Only offline proxy
// This worker does NOT contain hardcoded hashes or version lists.
// It acts as a deterministic offline-first proxy:
// - If ?sw-strategy=network is present, it explicitly bypasses cache to fetch from network.
// - For all other same-origin requests, it serves STRICTLY from CacheStorage.
// - If an asset is not in cache, it returns 504 Gateway Timeout (NEVER hangs on network in the field).

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Only intercept same-origin requests
  if (url.origin !== self.location.origin) return;

  // 1. Explicit network bypass requested by client (e.g. manual updates)
  if (url.searchParams.get('sw-strategy') === 'network') {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. Strict Cache-Only for everything else (NO silent network fallback!)
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      // Return 504 Gateway Timeout if not in cache (guarantees 0ms hang when offline)
      return new Response('Asset not found in offline cache', {
        status: 504,
        statusText: 'Gateway Timeout (Cache Only)'
      });
    })
  );
});
