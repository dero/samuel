/**
 * Persistent Storage Service for Samuel (Offline PWA)
 * Wraps the StorageManager API (navigator.storage) so the ~100MB+ of
 * CacheStorage this app relies on is not silently evicted by the browser
 * under storage pressure (or, on Safari, after ~7 days without interaction
 * for sites not added to the home screen).
 */

export interface StorageEstimateInfo {
  usageBytes: number | null;
  quotaBytes: number | null;
}

/**
 * Whether the StorageManager API is available at all.
 */
export function isStorageManagerSupported(): boolean {
  return typeof navigator !== 'undefined' && 'storage' in navigator;
}

/**
 * Checks whether this origin's storage is already persistent (best-effort
 * protection from eviction).
 */
export async function isStoragePersisted(): Promise<boolean> {
  try {
    if (!isStorageManagerSupported() || !navigator.storage.persisted) return false;
    return await navigator.storage.persisted();
  } catch {
    return false;
  }
}

/**
 * Requests persistent storage from the browser. Resolves to whether
 * persistence is granted (which may already have been true). Never throws.
 */
export async function requestStoragePersistence(): Promise<boolean> {
  try {
    if (!isStorageManagerSupported() || !navigator.storage.persist) return false;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/**
 * Reads current storage usage/quota via navigator.storage.estimate().
 */
export async function getStorageEstimate(): Promise<StorageEstimateInfo> {
  try {
    if (!isStorageManagerSupported() || !navigator.storage.estimate) {
      return { usageBytes: null, quotaBytes: null };
    }
    const estimate = await navigator.storage.estimate();
    return {
      usageBytes: typeof estimate.usage === 'number' ? estimate.usage : null,
      quotaBytes: typeof estimate.quota === 'number' ? estimate.quota : null
    };
  } catch {
    return { usageBytes: null, quotaBytes: null };
  }
}

/**
 * Rough iOS/iPadOS Safari detection, used only to show a home-screen hint -
 * iOS grants persistence almost exclusively to home-screen installed PWAs.
 */
export function isLikelyIos(): boolean {
  try {
    const ua = navigator.userAgent || '';
    const isAppleTouch = /iPad|iPhone|iPod/.test(ua);
    const isIpadOsDesktopMode =
      navigator.platform === 'MacIntel' && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1;
    return isAppleTouch || isIpadOsDesktopMode;
  } catch {
    return false;
  }
}
