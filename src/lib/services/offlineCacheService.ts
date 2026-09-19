/**
 * Offline Cache Service for Samuel (100% Offline-First PWA)
 * Manages CacheStorage for application assets (samuel-app)
 * and SQLite dictionary database (samuel-db) using pure Cache API.
 * No IndexedDB dependencies.
 */

export const APP_CACHE_NAME = 'samuel-app';
export const DB_CACHE_NAME = 'samuel-db';
export const DB_META_KEY = 'samuel_words_db_meta';
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

export interface LocalDbMeta {
  dbHash: string;
  dbVersion: string;
  dbSizeBytes: number;
  dbUpdated: string;
  cachedAt: number;
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
 * Checks if the 102MB dictionary database (words.db) is cached offline.
 */
export async function isDbInstalled(): Promise<boolean> {
  try {
    if (!('caches' in window)) return false;
    const hasCache = await caches.has(DB_CACHE_NAME);
    if (!hasCache) return false;
    const cache = await caches.open(DB_CACHE_NAME);
    const match = await cache.match('/words.db');
    return Boolean(match);
  } catch {
    return false;
  }
}

/**
 * Automatically purges legacy IndexedDB database ('samuel_offline_storage')
 * from prior versions to reclaim ~102MB of disk space.
 */
export function cleanupLegacyIndexedDb(): void {
  try {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      indexedDB.deleteDatabase('samuel_offline_storage');
    }
  } catch (e) {
    console.warn('Could not delete legacy IndexedDB:', e);
  }
}

/**
 * Reads local DB metadata from localStorage.
 */
export function getLocalDbMeta(): LocalDbMeta | null {
  try {
    const raw = localStorage.getItem(DB_META_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Saves local DB metadata into localStorage.
 */
export function setLocalDbMeta(meta: LocalDbMeta): void {
  try {
    localStorage.setItem(DB_META_KEY, JSON.stringify(meta));
  } catch (e) {
    console.warn('Failed to save DB metadata:', e);
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

/**
 * Downloads words.db into CacheStorage (samuel-db) with streaming progress tracking.
 */
export async function downloadDatabase(
  remoteVersion?: AppVersionInfo | null,
  onProgress?: (percent: number, loadedBytes: number, totalBytes: number) => void
): Promise<ArrayBuffer> {
  if (!('caches' in window)) {
    throw new Error('CacheStorage API is not supported in this browser.');
  }

  const dbUrl = '/words.db?sw-strategy=network&t=' + Date.now();
  const response = await fetch(dbUrl);
  if (!response.ok) {
    throw new Error(`Chyba při stahování slovníku: ${response.status} ${response.statusText}`);
  }

  const contentLength = response.headers.get('content-length');
  const expectedTotal = contentLength
    ? parseInt(contentLength, 10)
    : remoteVersion?.dbSizeBytes || 106483712;

  if (!response.body) {
    const buffer = await response.arrayBuffer();
    const cache = await caches.open(DB_CACHE_NAME);
    await cache.put('/words.db', new Response(buffer, {
      headers: { 'Content-Type': 'application/x-sqlite3' }
    }));
    saveDbMetaFromVersion(remoteVersion, buffer.byteLength);
    if (onProgress) onProgress(100, buffer.byteLength, buffer.byteLength);
    return buffer;
  }

  const reader = response.body.getReader();
  let received = 0;
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.length;
      if (onProgress && expectedTotal > 0) {
        const percent = Math.min(99, Math.round((received / expectedTotal) * 100));
        onProgress(percent, received, expectedTotal);
      }
    }
  }

  const result = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  const buffer = result.buffer as ArrayBuffer;
  const cache = await caches.open(DB_CACHE_NAME);
  await cache.put('/words.db', new Response(buffer, {
    headers: { 'Content-Type': 'application/x-sqlite3' }
  }));

  saveDbMetaFromVersion(remoteVersion, buffer.byteLength);
  if (onProgress) onProgress(100, buffer.byteLength, buffer.byteLength);
  return buffer;
}

function saveDbMetaFromVersion(remoteVersion?: AppVersionInfo | null, sizeBytes = 0): void {
  const meta: LocalDbMeta = {
    dbHash: remoteVersion?.dbHash || 'unknown',
    dbVersion: remoteVersion?.dbVersion || 'initial',
    dbSizeBytes: sizeBytes || remoteVersion?.dbSizeBytes || 0,
    dbUpdated: remoteVersion?.dbUpdated || new Date().toISOString(),
    cachedAt: Date.now()
  };
  setLocalDbMeta(meta);
}

/**
 * Removes the dictionary database from CacheStorage.
 */
export async function clearDatabaseCache(): Promise<void> {
  try {
    await caches.delete(DB_CACHE_NAME);
    localStorage.removeItem(DB_META_KEY);
  } catch (e) {
    console.warn('Failed to clear database cache:', e);
  }
}

/**
 * Deletes all caches, unregisters service workers, cleans legacy databases,
 * and clears cache metadata, returning the app to the first-run state.
 */
export async function resetAllOfflineData(): Promise<void> {
  // 1. Delete all CacheStorage caches
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (e) {
      console.warn('Failed to delete caches:', e);
    }
  }

  // 2. Unregister all service workers
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    } catch (e) {
      console.warn('Failed to unregister service workers:', e);
    }
  }

  // 3. Clear IndexedDB
  cleanupLegacyIndexedDb();

  // 4. Clear all LocalStorage and SessionStorage
  try {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
  } catch (e) {
    console.warn('Failed to clear localStorage / sessionStorage:', e);
  }
}
