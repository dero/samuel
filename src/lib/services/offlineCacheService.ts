/**
 * Offline Cache Service Orchestrator for Samuel (100% Offline-First PWA)
 * Coordinates App asset cache, DB cache, and nuclear reset.
 */

export * from './appCacheService';
export * from './dbCacheService';
export * from './legacyCleanup';

import { cleanupLegacyIndexedDb } from './legacyCleanup';
import { clearDatabaseCache, forceWipeOpfs } from './dbCacheService';
import { terminateWorker } from '../db/dbClient';

/**
 * Deletes all caches, unregisters service workers, cleans legacy databases,
 * and clears cache metadata, returning the app to the first-run state.
 * Guaranteed to never hang even if the DB worker was stuck or downloading.
 */
export async function resetAllOfflineData(): Promise<void> {
  // 0. Remove the dictionary DB from OPFS with a strict 1500ms timeout
  try {
    await Promise.race([
      clearDatabaseCache(),
      new Promise<void>((resolve) => setTimeout(resolve, 1500))
    ]);
  } catch (e) {
    console.warn('Graceful DB clear failed or timed out:', e);
  }

  // 1. Immediately terminate the DB worker so all OPFS sync handles are closed
  terminateWorker();

  // 2. Directly wipe all OPFS entries from the main thread
  await forceWipeOpfs();

  // 3. Delete all CacheStorage caches
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (e) {
      console.warn('Failed to delete caches:', e);
    }
  }

  // 4. Unregister all service workers
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    } catch (e) {
      console.warn('Failed to unregister service workers:', e);
    }
  }

  // 5. Clear IndexedDB
  try {
    cleanupLegacyIndexedDb();
  } catch (e) {
    console.warn('Failed to clean up legacy IndexedDB:', e);
  }

  // 6. Clear all LocalStorage and SessionStorage
  try {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
  } catch (e) {
    console.warn('Failed to clear localStorage / sessionStorage:', e);
  }
}
