/**
 * Samuel - Bootstrap Entry Script
 * Minimal, lightweight entry point that handles offline cache verification,
 * first-run package downloading (App ~1.5MB, DB ~102MB), and service worker registration.
 * Dynamically imports ./main once offline cache is ready.
 */

import {
  isAppInstalled,
  fetchRemoteVersion,
  downloadAppAssets,
  downloadDatabase
} from './lib/services/offlineCacheService';

async function registerServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (e) {
      console.warn('ServiceWorker registration error:', e);
    }
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
}

async function initBootstrap(): Promise<void> {
  // In development mode, bypass the bootstrap shell entirely and run with HMR
  if (import.meta.env.DEV) {
    await startApp();
    return;
  }

  // 1. Register set-and-forget Cache-Only Service Worker
  await registerServiceWorker();

  // 2. Check if the app is already installed in CacheStorage
  const appCached = await isAppInstalled();

  if (appCached) {
    // Already installed! Boot directly into Svelte app (Cache-Only)
    await startApp();
    return;
  }

  // 3. First run! Display the First Run screen
  const checkingEl = document.getElementById('shell-checking');
  const firstRunEl = document.getElementById('shell-first-run');
  const downloadBtn = document.getElementById('shell-download-btn') as HTMLButtonElement | null;
  const progressWrap = document.getElementById('shell-progress-wrap');
  const progressFill = document.getElementById('shell-progress-fill');
  const progressText = document.getElementById('shell-progress-text');
  const dbCheck = document.getElementById('pkg-db') as HTMLInputElement | null;

  if (checkingEl) checkingEl.style.display = 'none';
  if (firstRunEl) firstRunEl.style.display = 'flex';

  if (!downloadBtn) return;

  downloadBtn.addEventListener('click', async () => {
    downloadBtn.disabled = true;
    if (progressWrap) progressWrap.style.display = 'block';

    const wantDb = Boolean(dbCheck?.checked);

    try {
      if (progressText) progressText.textContent = 'Načítám informace o balíčcích…';
      const remoteVersion = await fetchRemoteVersion();
      const assets = remoteVersion?.appAssets || [];

      // Download Application assets
      if (progressText) progressText.textContent = 'Stahuji aplikaci (0 %)…';
      await downloadAppAssets(assets, (percent, current, total) => {
        if (progressFill) {
          const fillWidth = wantDb ? Math.round(percent * 0.4) : percent;
          progressFill.style.width = `${fillWidth}%`;
        }
        if (progressText) {
          progressText.textContent = `Stahuji aplikaci (${current}/${total} souborů, ${percent} %)…`;
        }
      });

      // Download Database if checked
      if (wantDb) {
        if (progressText) progressText.textContent = 'Stahuji slovník (0 %)…';
        await downloadDatabase(remoteVersion, (percent, loaded, total) => {
          if (progressFill) {
            const fillWidth = Math.round(40 + percent * 0.6);
            progressFill.style.width = `${fillWidth}%`;
          }
          if (progressText) {
            const mbLoaded = (loaded / (1024 * 1024)).toFixed(1);
            const mbTotal = (total / (1024 * 1024)).toFixed(1);
            progressText.textContent = `Stahuji slovník (${mbLoaded} / ${mbTotal} MB, ${percent} %)…`;
          }
        });
      }

      if (progressFill) progressFill.style.width = '100%';
      if (progressText) progressText.textContent = 'Hotovo! Spouštím Samuel…';

      setTimeout(async () => {
        await startApp();
      }, 300);
    } catch (err: any) {
      console.error('Download error:', err);
      downloadBtn.disabled = false;
      if (progressText) {
        progressText.textContent = `Chyba při stahování: ${err?.message || 'Zkontrolujte připojení k internetu'}`;
        progressText.style.color = '#ef4444';
      }
    }
  });
}

initBootstrap();
