/**
 * Samuel - Bootstrap Entry Script
 * Minimal, lightweight entry point that handles offline cache verification,
 * first-run package downloading (App ~1.5MB, DB ~102MB), and service worker registration.
 * Dynamically imports ./main once offline cache is ready.
 */

import {
  isAppInstalled,
  fetchRemoteVersion,
  installAppVersion,
  downloadDatabase
} from './lib/services/offlineCacheService';
import { requestStoragePersistence, isStoragePersisted } from './lib/services/storageService';

declare global {
  interface Window {
    /** Called by bootstrap once the app has actually booted; disarms the recovery safety net in index.html. */
    __samuelBootSuccess?: () => void;
    /** Called by bootstrap when it legitimately shows the first-run download screen; disarms the passive safety net (that screen has its own error handling). */
    __samuelBootFirstRun?: () => void;
    /** Called by bootstrap to force-show the recovery overlay immediately on a caught boot error. */
    __samuelShowRecovery?: (reason?: string) => void;
  }
}

async function registerServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (e) {
      console.warn('ServiceWorker registration error:', e);
    }
  }
}

/**
 * Best-effort, silent persistent storage request. Never blocks or throws.
 * Safe to call on every boot - the browser no-ops if already persisted.
 */
async function maybeRequestPersistentStorage(): Promise<void> {
  try {
    const persisted = await isStoragePersisted();
    if (!persisted) {
      await requestStoragePersistence();
    }
  } catch {
    // ignore - persistence is a best-effort enhancement
  }
}

async function startApp(): Promise<void> {
  const shell = document.getElementById('bootstrap-shell');
  if (shell) {
    shell.style.transition = 'opacity 0.2s ease';
    shell.style.opacity = '0';
    shell.style.pointerEvents = 'none';
    setTimeout(() => {
      shell.remove();
    }, 250);
  }
  // Dynamically import the main Svelte app bundle
  await import('./main');
  // Boot succeeded - disarm the index.html recovery safety net
  window.__samuelBootSuccess?.();
}

async function initBootstrap(): Promise<void> {
  // Clean up ?sw-strategy query parameter from address bar if present
  if (typeof window !== 'undefined' && window.location.search.includes('sw-strategy')) {
    window.history.replaceState(null, '', window.location.pathname);
  }

  // In development mode, bypass the bootstrap shell entirely and run with HMR
  if (import.meta.env.DEV) {
    window.__samuelBootSuccess?.();
    await startApp();
    return;
  }

  // 1. Register set-and-forget Cache-Only Service Worker
  await registerServiceWorker();

  // 2. Check if the app is already installed in CacheStorage
  const appCached = await isAppInstalled();

  if (appCached) {
    // Silently (re)request persistent storage on every boot until granted.
    // Never blocks or delays startup.
    void maybeRequestPersistentStorage();

    // Already installed! Boot directly into Svelte app (Cache-Only)
    try {
      await startApp();
    } catch (err) {
      // Cache is present but corrupted/incomplete (e.g. interrupted update
      // in an older version of this mechanism) - offer in-app recovery
      // instead of leaving a permanent white screen.
      console.error('Failed to start installed app:', err);
      window.__samuelShowRecovery?.('boot-failed');
    }
    return;
  }

  // 3. First run! Display the First Run screen
  const checkingEl = document.getElementById('shell-checking');
  const firstRunEl = document.getElementById('shell-first-run');
  const downloadBtn = document.getElementById('shell-download-btn') as HTMLButtonElement | null;
  const progressBox = document.getElementById('shell-progress-box');
  const progressFill = document.getElementById('shell-progress-fill');
  const progressText = document.getElementById('shell-progress-text');
  const dbCheck = document.getElementById('pkg-db') as HTMLInputElement | null;

  if (checkingEl) checkingEl.style.display = 'none';
  if (firstRunEl) firstRunEl.style.display = 'flex';

  // This screen legitimately owns error handling from here on (it has its
  // own inline retry UI below) - disarm the generic timeout/script-error
  // safety net so it can't show a redundant overlay on top of it.
  window.__samuelBootFirstRun?.();

  if (!downloadBtn || !progressBox) return;

  downloadBtn.addEventListener('click', async () => {
    // Replace download button with exact-sized progress bar in-place (no layout jump)
    downloadBtn.style.display = 'none';
    progressBox.style.display = 'flex';
    if (dbCheck) dbCheck.disabled = true;

    const wantDb = Boolean(dbCheck?.checked);

    try {
      if (progressText) progressText.textContent = 'Načítám informace…';
      if (progressFill) progressFill.style.width = '5%';

      const remoteVersion = await fetchRemoteVersion();
      if (!remoteVersion) {
        throw new Error('Nepodařilo se načíst informace o verzi. Zkontrolujte připojení k internetu.');
      }

      // Download Application assets atomically (fresh versioned cache, verified, then switched)
      if (progressText) progressText.textContent = 'Stahuji aplikaci (0 %)…';
      await installAppVersion(remoteVersion, (percent) => {
        if (progressFill) {
          const fillWidth = wantDb ? Math.round(percent * 0.35) : percent;
          progressFill.style.width = `${Math.max(5, fillWidth)}%`;
        }
        if (progressText) {
          progressText.textContent = `Stahuji aplikaci (${percent} %)…`;
        }
      });

      // Download Database if checked
      if (wantDb) {
        if (progressText) progressText.textContent = 'Stahuji slovník (0 %)…';
        await downloadDatabase(remoteVersion, (percent, loaded, total) => {
          if (progressFill) {
            const fillWidth = Math.round(35 + percent * 0.65);
            progressFill.style.width = `${fillWidth}%`;
          }
          if (progressText) {
            const mbLoaded = Math.round(loaded / (1024 * 1024));
            const mbTotal = Math.round(total / (1024 * 1024));
            progressText.textContent = `Stahuji slovník (${mbLoaded} / ${mbTotal} MB)…`;
          }
        });
      }

      if (progressFill) progressFill.style.width = '100%';
      if (progressText) progressText.textContent = 'Hotovo! Spouštím…';

      // Best-effort, inside the user gesture flow of this click handler.
      await maybeRequestPersistentStorage();

      setTimeout(async () => {
        try {
          await startApp();
        } catch (err) {
          console.error('Failed to start app after fresh install:', err);
          window.__samuelShowRecovery?.('post-install-start-failed');
        }
      }, 300);
    } catch (err: any) {
      console.error('Download error:', err);
      if (progressBox) {
        progressBox.style.borderColor = '#ef4444';
      }
      if (progressFill) {
        progressFill.style.backgroundColor = '#ef4444';
        progressFill.style.opacity = '0.2';
      }
      if (progressText) {
        progressText.style.color = '#ef4444';
        progressText.textContent = 'Chyba při stahování (klepnutím zkusit znovu)';
      }
      // Tap on error box to restore the download button and retry
      progressBox.style.cursor = 'pointer';
      progressBox.onclick = () => {
        progressBox.onclick = null;
        progressBox.style.cursor = '';
        progressBox.style.display = 'none';
        progressBox.style.borderColor = '';
        if (progressFill) {
          progressFill.style.backgroundColor = '';
          progressFill.style.opacity = '';
          progressFill.style.width = '0%';
        }
        if (progressText) {
          progressText.style.color = '';
          progressText.textContent = 'Připravuji stahování…';
        }
        downloadBtn.style.display = 'flex';
        if (dbCheck) dbCheck.disabled = false;
      };
    }
  });
}

initBootstrap();
