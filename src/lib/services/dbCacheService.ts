/**
 * Database Cache Service for Samuel (Offline SQLite WASM)
 * Manages CacheStorage for dictionary database (words.db) and metadata.
 */

import type { AppVersionInfo } from './appCacheService';

export const DB_CACHE_NAME = 'samuel-db';
export const DB_META_KEY = 'samuel_words_db_meta';

export interface LocalDbMeta {
  dbHash: string;
  dbVersion: string;
  dbSizeBytes: number;
  dbUpdated: string;
  cachedAt: number;
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

export function saveDbMetaFromVersion(remoteVersion?: AppVersionInfo | null, sizeBytes = 0): void {
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
    await cache.put(
      '/words.db',
      new Response(buffer, {
        headers: { 'Content-Type': 'application/x-sqlite3' }
      })
    );
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
  await cache.put(
    '/words.db',
    new Response(buffer, {
      headers: { 'Content-Type': 'application/x-sqlite3' }
    })
  );

  saveDbMetaFromVersion(remoteVersion, buffer.byteLength);
  if (onProgress) onProgress(100, buffer.byteLength, buffer.byteLength);
  return buffer;
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
