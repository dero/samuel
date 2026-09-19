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
  downloadAppAssets,
  downloadDatabase as downloadDbCore,
  clearDatabaseCache,
  resetAllOfflineData,
  cleanupLegacyIndexedDb,
  getLocalDbMeta,
  type AppVersionInfo,
  type LocalDbMeta
} from './offlineCacheService';
import { APP_BUILD_TIME, APP_VERSION } from '../constants';

export type VersionStatus =
  | 'idle'
  | 'checking'
  | 'downloading_app'
  | 'downloading_db'
  | 'error';

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
  status: VersionStatus;
  progress: number;
  error: string | null;
}

class VersionService {
  state: VersionState = $state({
    appVersion: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : APP_VERSION,
    buildTime: typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : APP_BUILD_TIME,
    isAppInstalled: true,
    isDbInstalled: false,
    dbMeta: null,
    remoteVersion: null,
    appUpdateAvailable: false,
    dbUpdateAvailable: false,
    updateAvailable: false,
    status: 'idle',
    progress: 0,
    error: null
  });

  constructor() {
    this.refreshLocalStatus();
  }

  /**
   * Refreshes local installation state from CacheStorage and localStorage.
   */
  async refreshLocalStatus(): Promise<void> {
    try {
      this.state.isAppInstalled = await isAppInstalled();
      this.state.isDbInstalled = await isDbInstalled();
      this.state.dbMeta = getLocalDbMeta();
    } catch {
      // Offline fallback
    }
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
      this.state.status = 'idle';

      return { updateAvailable: this.state.updateAvailable };
    } catch (err: any) {
      console.log('VersionService: offline or unreachable network');
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
      await downloadAppAssets(remote.appAssets, (percent) => {
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
   * Downloads or updates SQLite dictionary database (words.db).
   */
  async downloadDb(onProgress?: (percent: number) => void): Promise<void> {
    this.state.status = 'downloading_db';
    this.state.progress = 0;

    try {
      await downloadDbCore(this.state.remoteVersion, (percent) => {
        this.state.progress = percent;
        if (onProgress) onProgress(percent);
      });

      await this.refreshLocalStatus();
      this.state.dbUpdateAvailable = false;
      this.state.updateAvailable = this.state.appUpdateAvailable;
      this.state.status = 'idle';
    } catch (err: any) {
      this.state.status = 'error';
      this.state.error = err?.message || 'Chyba při stahování slovníku';
      throw err;
    }
  }

  /**
   * Deletes SQLite dictionary database from cache to reclaim ~102MB.
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
   * Resets all offline caches, registrations, and metadata,
   * then reloads to root which triggers the first-run splash screen.
   */
  async resetAllData(): Promise<void> {
    await resetAllOfflineData();
    window.location.href = '/?sw-strategy=network';
  }
}

export const versionService = new VersionService();
