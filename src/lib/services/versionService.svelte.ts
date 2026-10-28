/**
 * Version & Offline Management Service for Samuel (Svelte 5 Runes)
 * Single authoritative source of truth for:
 * - Current app version & build timestamp
 * - Cache status of App and Database
 * - Remote update checks (?sw-strategy=network)
 * - Safe updates and legacy cleanup
 */

import {
  isAppInstalled,
  isDbInstalled,
  fetchRemoteVersion,
  installAppVersion,
  downloadDatabase as downloadDbCore,
  clearDatabaseCache,
  resetAllOfflineData,
  cleanupLegacyIndexedDb,
  getLocalDbMeta,
  type AppVersionInfo,
  type LocalDbMeta
} from './offlineCacheService';
import { APP_BUILD_TIME, APP_VERSION } from '../constants';
import { dbClient, DownloadCancelledError } from '../db/dbClient';
import { navigation } from '../state/navigation.svelte';

export type VersionStatus =
  | 'idle'
  | 'checking'
  | 'downloading_app'
  | 'downloading_db'
  | 'error';

/** Outcome of the last update check: never run, server answered, or unreachable. */
export type UpdateCheckResult = 'none' | 'ok' | 'failed';

export interface VersionState {
  appVersion: string;
  buildTime: number;
  isAppInstalled: boolean;
  isDbInstalled: boolean;
  dbMeta: LocalDbMeta | null;
  remoteVersion: AppVersionInfo | null;
  appUpdateAvailable: boolean;
  dbUpdateAvailable: boolean;
  updateAvailable: boolean;
  lastCheck: UpdateCheckResult;
  status: VersionStatus;
  progress: number;
  error: string | null;
}

const initialDbMeta = typeof window !== 'undefined' ? getLocalDbMeta() : null;

class VersionService {
  state: VersionState = $state({
    appVersion: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : APP_VERSION,
    buildTime: typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : APP_BUILD_TIME,
    isAppInstalled: true,
    isDbInstalled: Boolean(initialDbMeta),
    dbMeta: initialDbMeta,
    remoteVersion: null,
    appUpdateAvailable: false,
    dbUpdateAvailable: false,
    updateAvailable: false,
    lastCheck: 'none',
    status: 'idle',
    progress: 0,
    error: null
  });

  constructor() {
    this.refreshLocalStatus();
  }

  /**
   * Refreshes local installation state from CacheStorage and localStorage.
   * Returns whether database status transitioned from uninstalled to installed.
   */
  async refreshLocalStatus(): Promise<{ dbJustInstalled: boolean }> {
    const wasInstalled = this.state.isDbInstalled;
    try {
      this.state.isAppInstalled = await isAppInstalled();
      this.state.isDbInstalled = await isDbInstalled();
      this.state.dbMeta = getLocalDbMeta();
    } catch {
      // Offline fallback
    }

    const dbJustInstalled = !wasInstalled && this.state.isDbInstalled;
    if (dbJustInstalled && navigation.activeModuleId !== 'settings') {
      navigation.reloadActiveModule();
    }

    return { dbJustInstalled };
  }

  /**
   * Authoritative version check:
   * 1. Purges legacy IndexedDB (dead ~102MB data from older versions)
   * 2. Checks local cache status
   * 3. Fetches lightweight remote /version.json via ?sw-strategy=network
   * 4. Updates reactive updateAvailable flags
   */
  async checkUpdates(): Promise<{ updateAvailable: boolean }> {
    // 1. Clean up legacy IndexedDB only during version checks
    cleanupLegacyIndexedDb();

    // 2. Refresh local state
    await this.refreshLocalStatus();

    this.state.status = 'checking';
    this.state.error = null;

    try {
      const remote = await fetchRemoteVersion();
      if (!remote) {
        this.state.lastCheck = 'failed';
        this.state.status = 'idle';
        return { updateAvailable: false };
      }

      this.state.remoteVersion = remote;

      const isDev = import.meta.env.DEV;
      const appNeedsUpdate =
        !isDev &&
        Boolean(
          (this.state.buildTime > 0 && remote.buildTime > this.state.buildTime) ||
            (remote.appVersion && remote.appVersion !== this.state.appVersion)
        );

      const dbNeedsUpdate = Boolean(
        this.state.isDbInstalled &&
          this.state.dbMeta &&
          remote.dbHash &&
          remote.dbHash !== this.state.dbMeta.dbHash
      );

      this.state.appUpdateAvailable = appNeedsUpdate;
      this.state.dbUpdateAvailable = dbNeedsUpdate;
      this.state.updateAvailable = appNeedsUpdate || dbNeedsUpdate;
      this.state.lastCheck = 'ok';
      this.state.status = 'idle';

      return { updateAvailable: this.state.updateAvailable };
    } catch (err: any) {
      console.log('VersionService: offline or unreachable network');
      this.state.lastCheck = 'failed';
      this.state.status = 'idle';
      return { updateAvailable: false };
    }
  }

  /**
   * Updates application assets to the remote version with progress tracking.
   */
  async updateApp(onProgress?: (percent: number) => void): Promise<void> {
    const remote = this.state.remoteVersion;
    if (!remote?.appAssets || remote.appAssets.length === 0) {
      throw new Error('Chybí seznam aplikačních souborů k aktualizaci.');
    }

    this.state.status = 'downloading_app';
    this.state.progress = 0;

    try {
      // Atomic install: downloads into a fresh versioned cache, verifies it,
      // then switches the active pointer. A network drop mid-update leaves
      // the currently running (old) version fully intact and bootable.
      await installAppVersion(remote, (percent) => {
        this.state.progress = percent;
        if (onProgress) onProgress(percent);
      });

      this.state.appUpdateAvailable = false;
      this.state.updateAvailable = this.state.dbUpdateAvailable;
      this.state.status = 'idle';

      // Reload into new version
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 300);
    } catch (err: any) {
      this.state.status = 'error';
      this.state.error = err?.message || 'Chyba při stahování aplikace';
      throw err;
    }
  }

  /**
   * Returns true when an asynchronous network operation is actively in flight.
   */
  get isBusy(): boolean {
    return (
      this.state.status === 'checking' ||
      this.state.status === 'downloading_app' ||
      this.state.status === 'downloading_db'
    );
  }

  /**
   * Cancels an active database download; the pending `downloadDb()` resolves
   * `false` and the state returns to idle.
   */
  cancelDownload(): void {
    dbClient.cancelDownload();
  }

  /**
   * Downloads or updates SQLite dictionary database (words.db).
   * Resolves `true` once installed, `false` if cancelled via `cancelDownload()`.
   */
  async downloadDb(onProgress?: (percent: number) => void): Promise<boolean> {
    this.state.status = 'downloading_db';
    this.state.progress = 0;
    this.state.error = null;

    try {
      await downloadDbCore(this.state.remoteVersion, (percent) => {
        this.state.progress = percent;
        if (onProgress) onProgress(percent);
      });

      await this.refreshLocalStatus();
      this.state.dbUpdateAvailable = false;
      this.state.updateAvailable = this.state.appUpdateAvailable;
      this.state.status = 'idle';
      return true;
    } catch (err: any) {
      if (err instanceof DownloadCancelledError) {
        this.state.status = 'idle';
        this.state.progress = 0;
        return false;
      }
      this.state.status = 'error';
      this.state.error = err?.message || 'Chyba při stahování slovníku';
      throw err;
    }
  }

  /**
   * Deletes SQLite dictionary database from cache to reclaim storage space.
   */
  async deleteDb(): Promise<void> {
    try {
      await clearDatabaseCache();
      await this.refreshLocalStatus();
      this.state.dbUpdateAvailable = false;
      this.state.updateAvailable = this.state.appUpdateAvailable;
    } catch (err: any) {
      this.state.error = err?.message || 'Chyba při mazání slovníku';
      throw err;
    }
  }

  /**
   * Database size in bytes from local installed metadata or remote version info,
   * with fallback to a sensible default.
   */
  get dbSizeBytes(): number {
    return this.state.dbMeta?.dbSizeBytes || this.state.remoteVersion?.dbSizeBytes || 101728256;
  }

  /**
   * Human-readable formatted database size (e.g. "97 MB").
   */
  get formattedDbSize(): string {
    const bytes = this.dbSizeBytes;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  }

  /**
   * Resets all offline caches, registrations, and metadata,
   * then reloads to root which triggers the first-run splash screen.
   * Always navigates away, even if individual wipe steps fail or stall.
   */
  resetAllData(): void {
    resetAllOfflineData();
  }
}

export const versionService = new VersionService();
