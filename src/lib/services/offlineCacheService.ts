/**
 * Offline Cache Service Orchestrator for Samuel (100% Offline-First PWA)
 * Coordinates App asset cache, DB cache, and nuclear reset.
 */

export * from './appCacheService';
export * from './dbCacheService';
export * from './legacyCleanup';

import { terminateWorker } from '../db/dbClient';

/**
 * Wipes ALL local data (caches, OPFS dictionary, service worker, IndexedDB,
 * local/session storage) and navigates to the first-run screen.
 *
 * Cannot fail or hang: the DB worker is killed synchronously (aborting any
 * download and releasing its OPFS handles) instead of being asked to clean
 * up, and the wipe itself is `window.__samuelWipeAll` from index.html - the
 * same routine the boot recovery overlay uses - which navigates after a hard
 * deadline no matter which step stalls.
 */
export function resetAllOfflineData(): void {
  terminateWorker(new Error('Reset všech dat'));
  if (window.__samuelWipeAll) {
    window.__samuelWipeAll(true);
    return;
  }
  // index.html always defines it; never leave the user stuck regardless.
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    // ignore
  }
  window.location.href = '/?sw-strategy=network';
}
