// Samuel - Set-and-forget strictly Cache-Only offline proxy
// This worker does NOT contain hardcoded hashes or version lists.
// It acts as a deterministic offline-first proxy:
// - If ?sw-strategy=network is present, it explicitly bypasses cache to fetch from network.
// - For all other same-origin requests, it serves STRICTLY from CacheStorage.
// - If an asset is not in cache, it returns 504 Gateway Timeout (NEVER hangs on network in the field).
//   Exceptions, so the app can never brick itself (see handleFetch): while the app is not installed
//   at all, a miss falls back to the network; if it is installed but the page itself is missing, a
//   self-contained page offers to wipe everything and restart onboarding.
//
// App cache versioning: the client (src/lib/services/appCacheService.ts) downloads
// each new app version into its own cache `samuel-app-<buildTime>` and, only once every
// asset has been verified, writes a pointer into the `samuel-meta` cache naming the
// ACTIVE app cache. This worker reads that pointer to decide which cache serves app
// requests, so a stale/partial version cache is never served. No valid pointer means
// the app is not installed.

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
    // treat as not installed
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

  // 2. Installed, but the page itself is missing: the cache is corrupt. Don't
  // mix in a (possibly newer) index.html from the network against older
  // cached scripts - offer a full wipe and a clean onboarding instead.
  if (activeName && request.mode === 'navigate') {
    return brokenCachePage();
  }

  // 3. Not installed at all (first run never finished, the app was closed
  // before downloading, or iOS evicted CacheStorage while keeping this
  // registration). There is nothing to serve cache-only - a 504 here would
  // brick the app, as index.html with its first-run screen could never load
  // again. Go to the network; offline, navigations get a retry page.
  if (!activeName) {
    try {
      return await fetchWithTimeout(request, NETWORK_FALLBACK_TIMEOUT_MS);
    } catch {
      if (request.mode === 'navigate') return offlinePage();
    }
  }

  // Return 504 Gateway Timeout if not in cache (guarantees 0ms hang when offline)
  return new Response('Asset not found in offline cache', {
    status: 504,
    statusText: 'Gateway Timeout (Cache Only)'
  });
}

const NETWORK_FALLBACK_TIMEOUT_MS = 10000;

function fetchWithTimeout(request, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    fetch(request).then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

// Self-contained status pages: in these states nothing else can be loaded.
function statusPage(title, text, buttonLabel, script) {
  const html = `<!doctype html>
<html lang="cs">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="theme-color" content="#000000" />
<title>Samuel</title>
<style>
  html, body { margin: 0; height: 100%; background: #000; color: #fff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
    padding: calc(24px + env(safe-area-inset-top)) 24px calc(24px + env(safe-area-inset-bottom));
    box-sizing: border-box; text-align: center; }
  h1 { font-size: 16px; margin: 0; }
  p { font-size: 13px; line-height: 1.5; color: #b3b3b3; max-width: 320px; margin: 0; }
  .warn { color: #fbbf24; }
  button { min-height: 52px; padding: 0 24px; background: #00d2ff; color: #000; font-size: 15px;
    font-weight: 700; border: none; border-radius: 6px; }
  button:disabled { opacity: 0.6; }
</style>
</head>
<body>
  <h1>${title}</h1>
  <p>${text}</p>
  <p id="offline-warn" class="warn" hidden>Jste offline. Po smazání půjde aplikace stáhnout až s připojením.</p>
  <button id="action" type="button">${buttonLabel}</button>
  <script>${script}</script>
</body>
</html>`;
  return new Response(html, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

// The app is not stored on the device and the network is down.
function offlinePage() {
  return statusPage(
    'Samuel není v zařízení uložen',
    'Připojte se k internetu a zkuste to znovu. Aplikace se stáhne a pak poběží offline.',
    'Zkusit znovu',
    "document.getElementById('action').onclick = function () { location.reload(); };"
  );
}

// Must stay identical to wipeAllAndRestart() in index.html - neither place
// can share code, as both run when the app itself can no longer load.
const WIPE_ALL_SCRIPT = `
// Wipes ALL offline data (app caches, dictionary DB, SW registration) and
// restarts onboarding from the network. "full" also clears localStorage and
// sessionStorage (user settings); otherwise only the dictionary metadata.
// Can never hang: it navigates once every step settles or after a hard
// deadline, whichever comes first. Any DB worker must already be dead
// (terminated, or gone with the previous page); files it held stay locked
// for a moment, so OPFS removal is retried, and whatever still survives is
// orphaned by the missing pointer and unlinked by the next DB worker.
function wipeAllAndRestart(full) {
  var navigated = false;
  function restart() {
    if (navigated) return;
    navigated = true;
    location.href = '/?sw-strategy=network';
  }
  setTimeout(restart, 4000);

  try {
    if (full) {
      localStorage.clear();
      sessionStorage.clear();
    } else {
      localStorage.removeItem('samuel_words_db_meta');
    }
  } catch (e) {}
  try { indexedDB.deleteDatabase('samuel_offline_storage'); } catch (e) {}

  function settle(run) {
    try {
      return Promise.resolve(run()).catch(function (e) { console.warn('Wipe step failed', e); });
    } catch (e) {
      console.warn('Wipe step failed', e);
      return Promise.resolve();
    }
  }
  function wipeOpfs(attemptsLeft) {
    return navigator.storage.getDirectory().then(function (root) {
      // Pointer first: without it no dictionary counts as installed.
      return root.removeEntry('samuel-db-active.txt').catch(function () {}).then(function () {
        var names = [];
        if (!root.keys) return names;
        var it = root.keys();
        function step() {
          return it.next().then(function (r) {
            if (r.done) return names;
            names.push(r.value);
            return step();
          });
        }
        return step();
      }).then(function (names) {
        return Promise.all(names.map(function (n) {
          return root.removeEntry(n, { recursive: true }).then(
            function () { return true; },
            function () { return false; }
          );
        }));
      }).then(function (removed) {
        if (removed.indexOf(false) === -1 || attemptsLeft <= 1) return;
        return new Promise(function (r) { setTimeout(r, 400); }).then(function () {
          return wipeOpfs(attemptsLeft - 1);
        });
      });
    });
  }

  Promise.all([
    settle(function () {
      if (!('caches' in window)) return;
      return caches.keys().then(function (names) {
        return Promise.all(names.map(function (n) { return caches.delete(n); }));
      });
    }),
    settle(function () {
      if (!navigator.storage || !navigator.storage.getDirectory) return;
      return wipeOpfs(5);
    }),
    settle(function () {
      // Unregister so the next load is uncontrolled like a brand new
      // visitor; otherwise the cache-only worker would 504 its scripts.
      if (!('serviceWorker' in navigator)) return;
      return navigator.serviceWorker.getRegistrations().then(function (regs) {
        return Promise.all(regs.map(function (r) { return r.unregister(); }));
      });
    })
  ]).then(restart, restart);
}
if (!navigator.onLine) document.getElementById('offline-warn').hidden = false;
document.getElementById('action').onclick = function () {
  this.disabled = true;
  this.textContent = 'Mažu…';
  wipeAllAndRestart(false);
};
`;

// Installed, but the offline data is corrupt.
function brokenCachePage() {
  return statusPage(
    'Offline data jsou poškozená',
    'Smažte je včetně slovníku a stáhněte aplikaci znovu. Stažení vyžaduje připojení.',
    'Smazat vše a stáhnout znovu',
    WIPE_ALL_SCRIPT
  );
}


self.addEventListener('fetch', (event) => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Only intercept same-origin requests
  if (url.origin !== self.location.origin) return;

  // 1. Explicit network bypass requested by client (e.g. manual updates, downloading words.db)
  if (url.searchParams.get('sw-strategy') === 'network') {
    return;
  }

  // 2. Strict Cache-Only for everything else (NO silent network fallback!)
  event.respondWith(handleFetch(event.request));
});
