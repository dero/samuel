/**
 * App Asset Cache Service for Samuel (Offline PWA)
 * Manages CacheStorage for core application assets using an ATOMIC, versioned
 * cache-swap strategy so a network drop mid-update can never leave the app
 * in a half-updated, unbootable state.
 *
 * Design:
 * - Every downloaded version lives in its own cache: `samuel-app-<buildTime>`.
 * - A tiny `samuel-meta` cache stores a pointer entry naming the currently
 *   ACTIVE app cache. The pointer is only written after every asset of the
 *   new version has been verified (response.ok + non-empty body), so the
 *   switch is atomic from the app's point of view.
 * - The Service Worker (public/sw.js) reads the same pointer to decide which
 *   cache to serve app requests from; it must be told to re-read it (see
 *   `notifyServiceWorkerOfUpdate`) or it re-reads it lazily when unset.
 * - Legacy installs (pre-this-mechanism) have only the plain `samuel-app`
 *   cache and no pointer. That cache is treated as active until the first
 *   successful update migrates away from it, at which point it is deleted.
 */

export const APP_CACHE_PREFIX = 'samuel-app-';
export const LEGACY_APP_CACHE_NAME = 'samuel-app';
export const META_CACHE_NAME = 'samuel-meta';
export const ACTIVE_APP_CACHE_KEY = '/__meta/active-app-cache';

// Kept for backwards compatibility with any external references.
export const APP_CACHE_NAME = LEGACY_APP_CACHE_NAME;
export const APP_META_KEY = 'samuel_app_meta';

export interface AppVersionInfo {
  appVersion: string;
  buildTime: number;
  entryJs?: string;
  appAssets?: string[];
  dbVersion?: string;
  dbHash?: string;
  dbSizeBytes?: number;
  dbUpdated?: string;
  sourceHash?: string;
}

/**
 * Resolves the name of the currently ACTIVE app cache:
 * 1. Reads the pointer from `samuel-meta` (if present and the cache it names
 *    still actually exists).
 * 2. Falls back to the legacy `samuel-app` cache for pre-pointer installs.
 * 3. Returns null if nothing usable is installed.
 */
export async function getActiveAppCacheName(): Promise<string | null> {
  if (!('caches' in window)) return null;

  try {
    const metaCache = await caches.open(META_CACHE_NAME);
    const res = await metaCache.match(ACTIVE_APP_CACHE_KEY, { ignoreVary: true });
    if (res) {
      const data = await res.json().catch(() => null);
      if (data?.name && (await caches.has(data.name))) {
        return data.name;
      }
    }
  } catch {
    // Fall through to legacy check
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

/**
 * Atomically writes the active app cache pointer into `samuel-meta`.
 */
async function setActiveAppCacheName(name: string, buildTime: number): Promise<void> {
  const metaCache = await caches.open(META_CACHE_NAME);
  await metaCache.put(
    ACTIVE_APP_CACHE_KEY,
    new Response(JSON.stringify({ name, buildTime }), {
      headers: { 'Content-Type': 'application/json' }
    })
  );
}

/**
 * Asks any controlling Service Worker to immediately re-read the active
 * cache pointer, instead of waiting for it to notice on its own.
 */
function notifyServiceWorkerOfUpdate(): void {
  try {
    navigator.serviceWorker?.controller?.postMessage({ type: 'REFRESH_ACTIVE_APP_CACHE' });
  } catch {
    // ignore - SW will still pick up the change lazily
  }
}

/**
 * Deletes every app-related cache except the one currently active
 * (stale versioned caches + the legacy cache once migrated away from).
 */
async function deleteStaleAppCaches(keepName: string): Promise<void> {
  try {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter(
          (n) => n !== keepName && (n === LEGACY_APP_CACHE_NAME || n.startsWith(APP_CACHE_PREFIX))
        )
        .map((n) => caches.delete(n))
    );
  } catch (e) {
    console.warn('Failed to clean up stale app caches:', e);
  }
}

/**
 * Checks if application assets are cached and ready for offline boot.
 * Reflects the active-cache pointer: the active cache must exist and contain
 * index.html, and (when feasible) the entry JS listed in its own cached
 * version.json.
 */
export async function isAppInstalled(): Promise<boolean> {
  try {
    if (!('caches' in window)) return false;

    const activeName = await getActiveAppCacheName();
    if (!activeName) return false;

    const cache = await caches.open(activeName);
    const hasIndex = Boolean(
      (await cache.match('/index.html', { ignoreVary: true })) ||
        (await cache.match('/', { ignoreVary: true }))
    );
    if (!hasIndex) return false;

    // Best-effort deeper check: verify the entry JS listed in the cached
    // version.json is also present. Never fails the whole check if this
    // metadata is missing or unreadable.
    try {
      const versionRes = await cache.match('/version.json', { ignoreVary: true });
      if (versionRes) {
        const versionData = (await versionRes.clone().json()) as AppVersionInfo | null;
        if (versionData?.entryJs) {
          const hasEntry = Boolean(await cache.match(versionData.entryJs, { ignoreVary: true }));
          if (!hasEntry) return false;
        }
      }
    } catch {
      // Ignore - index.html presence is enough of a signal on its own
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Fetches lightweight version.json bypassing SW cache.
 */
export async function fetchRemoteVersion(): Promise<AppVersionInfo | null> {
  try {
    const res = await fetch('/version.json?sw-strategy=network&t=' + Date.now(), {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Downloads and installs an application version ATOMICALLY:
 * 1. Downloads every asset into a fresh, dedicated cache
 *    (`samuel-app-<buildTime>`), verifying each response is ok and non-empty.
 * 2. Verifies index.html and the entry JS are present in the new cache.
 * 3. Only then flips the `samuel-meta` pointer to the new cache and notifies
 *    the Service Worker.
 * 4. Deletes old/stale app caches (including the legacy one, if any).
 *
 * On ANY failure, the partially-downloaded cache is deleted and the
 * previously active cache/pointer is left completely untouched, so the app
 * remains fully bootable offline on the old version.
 */
export async function installAppVersion(
  remoteVersion: AppVersionInfo,
  onProgress?: (percent: number, current: number, total: number, file: string) => void
): Promise<void> {
  if (!('caches' in window)) {
    throw new Error('CacheStorage API is not supported in this browser.');
  }

  const assets = remoteVersion.appAssets || [];
  if (assets.length === 0) {
    throw new Error('Chybí seznam aplikačních souborů k instalaci.');
  }
  if (!remoteVersion.buildTime) {
    throw new Error('Chybí verze sestavení (buildTime) pro instalaci.');
  }

  const newCacheName = `${APP_CACHE_PREFIX}${remoteVersion.buildTime}`;

  // Wipe any stale partial cache left behind by a previously interrupted attempt
  await caches.delete(newCacheName);

  const cache = await caches.open(newCacheName);
  const total = assets.length;
  let completed = 0;

  try {
    for (const rawAsset of assets) {
      const cleanUrl = rawAsset.split('?')[0];
      const networkUrl = cleanUrl.includes('?')
        ? `${cleanUrl}&sw-strategy=network&t=${Date.now()}`
        : `${cleanUrl}?sw-strategy=network&t=${Date.now()}`;

      const response = await fetch(networkUrl);
      if (!response.ok) {
        throw new Error(`Chyba při stahování ${cleanUrl}: ${response.status}`);
      }

      // Verify non-empty body before trusting this asset
      const checkBlob = await response.clone().blob();
      if (checkBlob.size === 0) {
        throw new Error(`Prázdný soubor při stahování: ${cleanUrl}`);
      }

      await cache.put(cleanUrl, response.clone());

      // Ensure both '/' and '/index.html' are cached
      if (cleanUrl === '/index.html') {
        await cache.put('/', response.clone());
      } else if (cleanUrl === '/') {
        await cache.put('/index.html', response.clone());
      }

      completed++;
      if (onProgress) {
        const percent = Math.round((completed / total) * 100);
        onProgress(percent, completed, total, cleanUrl);
      }
    }

    // Also cache version.json inside the new versioned cache
    try {
      const vRes = await fetch('/version.json?sw-strategy=network&t=' + Date.now());
      if (vRes.ok) {
        await cache.put('/version.json', vRes.clone());
      }
    } catch {
      // Non-fatal - version.json is metadata, not required to boot
    }

    // Final verification before switching the pointer
    const hasIndex = Boolean(await cache.match('/index.html', { ignoreVary: true }));
    if (!hasIndex) {
      throw new Error('Ověření selhalo: chybí index.html v nové mezipaměti.');
    }
    if (remoteVersion.entryJs) {
      const hasEntry = Boolean(await cache.match(remoteVersion.entryJs, { ignoreVary: true }));
      if (!hasEntry) {
        throw new Error('Ověření selhalo: chybí hlavní skript aplikace.');
      }
    }

    // Atomic switch: only now does the new version become "the" app
    await setActiveAppCacheName(newCacheName, remoteVersion.buildTime);
    notifyServiceWorkerOfUpdate();

    // Safe to clean up now that the pointer has moved on
    await deleteStaleAppCaches(newCacheName);
  } catch (err) {
    // Roll back: remove the partial new cache, old version stays untouched & bootable
    await caches.delete(newCacheName);
    throw err;
  }
}
