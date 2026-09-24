/**
 * App Asset Cache Service for Samuel (Offline PWA)
 * Manages CacheStorage for core application assets.
 */

export const APP_CACHE_NAME = 'samuel-app';
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
 * Checks if application assets are cached and ready for offline boot.
 */
export async function isAppInstalled(): Promise<boolean> {
  try {
    if (!('caches' in window)) return false;
    const hasCache = await caches.has(APP_CACHE_NAME);
    if (!hasCache) return false;
    const cache = await caches.open(APP_CACHE_NAME);
    const match = (await cache.match('/index.html')) || (await cache.match('/'));
    return Boolean(match);
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
 * Downloads all application assets listed in version.json into CacheStorage (samuel-app).
 */
export async function downloadAppAssets(
  assets: string[],
  onProgress?: (percent: number, current: number, total: number, file: string) => void
): Promise<void> {
  if (!('caches' in window)) {
    throw new Error('CacheStorage API is not supported in this browser.');
  }

  const cache = await caches.open(APP_CACHE_NAME);
  const total = assets.length;
  let completed = 0;

  for (const rawAsset of assets) {
    const cleanUrl = rawAsset.split('?')[0];
    const networkUrl = cleanUrl.includes('?')
      ? `${cleanUrl}&sw-strategy=network&t=${Date.now()}`
      : `${cleanUrl}?sw-strategy=network&t=${Date.now()}`;

    try {
      const response = await fetch(networkUrl);
      if (!response.ok) {
        throw new Error(`Chyba při stahování ${cleanUrl}: ${response.status}`);
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
    } catch (err) {
      console.error(`Failed to cache asset ${cleanUrl}:`, err);
      throw err;
    }
  }

  // Also cache version.json inside app cache
  try {
    const vRes = await fetch('/version.json?sw-strategy=network&t=' + Date.now());
    if (vRes.ok) {
      await cache.put('/version.json', vRes);
    }
  } catch {}
}
