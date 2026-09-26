// Samuel - Set-and-forget strictly Cache-Only offline proxy
// This worker does NOT contain hardcoded hashes or version lists.
// It acts as a deterministic offline-first proxy:
// - If ?sw-strategy=network is present, it explicitly bypasses cache to fetch from network.
// - For all other same-origin requests, it serves STRICTLY from CacheStorage.
// - If an asset is not in cache, it returns 504 Gateway Timeout (NEVER hangs on network in the field).
//
// App cache versioning: the client (src/lib/services/appCacheService.ts) downloads
// each new app version into its own cache `samuel-app-<buildTime>` and, only once every
// asset has been verified, writes a pointer into the `samuel-meta` cache naming the
// ACTIVE app cache. This worker reads that pointer to decide which cache serves app
// requests, so a stale/partial version cache is never served. Legacy installs (from
// before this mechanism existed) have only the plain `samuel-app` cache and no pointer;
// that cache is treated as active until the client's first successful update migrates
// away from it.

const APP_CACHE_PREFIX = 'samuel-app-';
const LEGACY_APP_CACHE_NAME = 'samuel-app';
const META_CACHE_NAME = 'samuel-meta';
const ACTIVE_APP_CACHE_KEY = '/__meta/active-app-cache';

// In-memory cache of the resolved active app cache name.
// `undefined` = not yet resolved this SW lifetime, `null` = resolved to "none".
let activeAppCacheName;

async function resolveActiveAppCacheName() {
  try {
    const metaCache = await caches.open(META_CACHE_NAME);
    const res = await metaCache.match(ACTIVE_APP_CACHE_KEY, { ignoreVary: true });
    if (res) {
      const data = await res.json();
      if (data && data.name && (await caches.has(data.name))) {
        return data.name;
      }
    }
  } catch {
    // fall through to legacy check
  }

  try {
    if (await caches.has(LEGACY_APP_CACHE_NAME)) {
      return LEGACY_APP_CACHE_NAME;
    }
  } catch {
    // ignore
  }

  return null;
}

async function getActiveAppCacheName() {
  // Only ever memoize a REAL, found cache name. Never memoize "nothing found"
  // (null) - if we did, an unlucky fetch racing ahead of the very first
  // meta-pointer write (e.g. a first-run install still in progress) could
  // wedge this worker into permanently treating the app as uninstalled,
  // 504-ing every subsequent request even after the pointer is written.
  // Because we always re-resolve on a null hit, correctness is unaffected by
  // this race - only a handful of extra `caches.open` calls during startup.
  if (activeAppCacheName) {
    // A memoized name can go stale if the cache was deleted from OUTSIDE
    // this worker's knowledge (full data reset, or the recovery flow in
    // index.html) without a REFRESH_ACTIVE_APP_CACHE message landing first.
    // Trusting a stale name here would make `caches.open()` below silently
    // resurrect an EMPTY cache under the old name, permanently masking the
    // deletion (every request would 504 forever) until this worker restarts.
    // `caches.has()` is a cheap registry lookup, not a content read.
    const stillExists = await caches.has(activeAppCacheName);
    if (stillExists) return activeAppCacheName;
    activeAppCacheName = undefined;
  }
  const resolved = await resolveActiveAppCacheName();
  if (resolved) {
    activeAppCacheName = resolved;
  }
  return resolved;
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// The client tells us to re-read the pointer right after it atomically
// switches to a newly-installed version, instead of waiting for us to
// notice on our own (e.g. next SW restart).
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'REFRESH_ACTIVE_APP_CACHE') {
    activeAppCacheName = undefined;
  }
});

// Always ignore Vary when matching: we deterministically cache exactly one
// representation of each asset, so content-negotiation headers (Origin,
// Accept-Encoding, ...) differing between the original install-time fetch
// and a later real browser-issued request (e.g. a <link rel=stylesheet>
// preload for a dynamic import) must never cause a spurious cache miss.
const MATCH_OPTIONS = { ignoreSearch: true, ignoreVary: true };

async function handleFetch(request) {
  const activeName = await getActiveAppCacheName();

  // 1. Try the ACTIVE app cache first (never a stale version cache)
  if (activeName) {
    try {
      const appCache = await caches.open(activeName);
      const match = await appCache.match(request, MATCH_OPTIONS);
      if (match) return match;
    } catch {
      // fall through
    }
  }

  // 2. Fall back to any other non-stale-app cache (e.g. legacy `samuel-db`),
  // explicitly skipping stale/other versioned app caches and the meta cache.
  try {
    const names = await caches.keys();
    for (const name of names) {
      if (name === activeName) continue; // already checked above
      if (name.startsWith(APP_CACHE_PREFIX)) continue; // stale version cache
      if (name === META_CACHE_NAME) continue; // internal pointer storage, never a real asset
      const cache = await caches.open(name);
      const match = await cache.match(request, MATCH_OPTIONS);
      if (match) return match;
    }
  } catch {
    // fall through to 504 below
  }

  // Return 504 Gateway Timeout if not in cache (guarantees 0ms hang when offline)
  return new Response('Asset not found in offline cache', {
    status: 504,
    statusText: 'Gateway Timeout (Cache Only)'
  });
}

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
  event.respondWith(handleFetch(event.request));
});
