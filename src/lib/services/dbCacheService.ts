/**
 * Database Cache Service for Samuel (Offline SQLite via OPFS)
 * Thin orchestration layer over the shared DB worker client (`dbClient.ts`):
 * install-state checks, verified streaming download, and local DB metadata
 * (still kept in localStorage on the main thread for versionService's update
 * detection).
 */

import type { AppVersionInfo } from './appCacheService';
import { dbClient, terminateWorker } from '../db/dbClient';

/** @deprecated Legacy CacheStorage name, kept only for reference/migration in dbWorker.ts. */
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
 * Checks if the dictionary database (words.db) is installed and openable,
 * asking the shared DB worker (which knows whether it found a file in OPFS
 * or, as a fallback, in memory).
 */
export async function isDbInstalled(): Promise<boolean> {
  return dbClient.isDbInstalled();
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
 * Downloads words.db and streams it directly into OPFS inside the shared DB
 * worker (never buffering the whole ~100+ MB file on the main thread), with
 * progress reporting, byte-length + SHA-256 verification against
 * `remoteVersion`, and a `PRAGMA quick_check` before the new DB is activated.
 * On any verification failure the previous DB (if any) is left untouched and
 * an Error with a Czech message is thrown.
 */
export async function downloadDatabase(
  remoteVersion?: AppVersionInfo | null,
  onProgress?: (percent: number, loadedBytes: number, totalBytes: number) => void
): Promise<void> {
  const dbUrl = '/words.db?sw-strategy=network&t=' + Date.now();

  const result = await dbClient.downloadDatabase(
    dbUrl,
    { sizeBytes: remoteVersion?.dbSizeBytes, hash: remoteVersion?.dbHash },
    (progress) => {
      onProgress?.(progress.percent, progress.loadedBytes, progress.totalBytes);
    }
  );

  saveDbMetaFromVersion(remoteVersion, result.sizeBytes);
  if (onProgress) onProgress(100, result.sizeBytes, result.sizeBytes);
}

/**
 * Directly removes all OPFS files and directories from the main thread,
 * ensuring no leftover database or lock handles persist.
 */
export async function forceWipeOpfs(): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.storage?.getDirectory) return;
  try {
    const root = await navigator.storage.getDirectory();
    try {
      await root.removeEntry('samuel-db-active.txt');
    } catch {
      // ignore
    }

    if ((root as any).values) {
      for await (const entry of (root as any).values()) {
        try {
          await root.removeEntry(entry.name, { recursive: true });
        } catch (e) {
          console.warn('[forceWipeOpfs] Could not remove entry:', entry.name, e);
        }
      }
    } else if ((root as any).keys) {
      const it = (root as any).keys();
      let res = await it.next();
      while (!res.done) {
        try {
          await root.removeEntry(res.value, { recursive: true });
        } catch (e) {
          console.warn('[forceWipeOpfs] Could not remove entry:', res.value, e);
        }
        res = await it.next();
      }
    }
  } catch (e) {
    console.warn('[forceWipeOpfs] OPFS wipe failed:', e);
  }
}

/**
 * Removes the dictionary database (OPFS and/or legacy CacheStorage) and its
 * local metadata. Fail-safe: if the DB worker is stuck or busy, terminates it
 * and wipes OPFS directly from the main thread.
 */
export async function clearDatabaseCache(): Promise<void> {
  try {
    await dbClient.deleteDb();
  } catch (e) {
    console.warn('Failed to clear database cache gracefully, forcing termination:', e);
    terminateWorker();
    await forceWipeOpfs();
  }
  try {
    localStorage.removeItem(DB_META_KEY);
  } catch (e) {
    console.warn('Failed to clear DB metadata:', e);
  }
}
