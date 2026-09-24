/**
 * Offline Cache Service Orchestrator for Samuel (100% Offline-First PWA)
 * Coordinates App asset cache, DB cache, and nuclear reset.
 */

export * from './appCacheService';
export * from './dbCacheService';
export * from './legacyCleanup';

import { cleanupLegacyIndexedDb } from './legacyCleanup';

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
