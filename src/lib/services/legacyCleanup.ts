/**
 * Legacy IndexedDB Storage Purger
 * Purges old ~102MB IndexedDB database ('samuel_offline_storage') from prior versions.
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
