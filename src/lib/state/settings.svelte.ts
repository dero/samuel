import { STORAGE_KEYS } from '../constants';

class SettingsState {
  hapticsEnabled = $state<boolean>(true);
  wakeLockEnabled = $state<boolean>(true);
  devToolsEnabled = $state<boolean>(false);

  private wakeLockSentinel: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (typeof parsed.hapticsEnabled === 'boolean') this.hapticsEnabled = parsed.hapticsEnabled;
          if (typeof parsed.wakeLockEnabled === 'boolean') this.wakeLockEnabled = parsed.wakeLockEnabled;
          if (typeof parsed.devToolsEnabled === 'boolean') this.devToolsEnabled = parsed.devToolsEnabled;
        } catch {
          // ignore
        }
      }

      $effect.root(() => {
        $effect(() => {
          localStorage.setItem(
            STORAGE_KEYS.SETTINGS,
            JSON.stringify({
              hapticsEnabled: this.hapticsEnabled,
              wakeLockEnabled: this.wakeLockEnabled,
              devToolsEnabled: this.devToolsEnabled
            })
          );
        });

        $effect(() => {
          if (this.wakeLockEnabled) {
            this.requestWakeLock();
          } else {
            this.releaseWakeLock();
          }
        });
      });
    }
  }

  vibrate(pattern: number | number[] = 25) {
    if (!this.hapticsEnabled || typeof navigator === 'undefined' || !navigator.vibrate) {
      return;
    }
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore
    }
  }

  private async requestWakeLock() {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        // @ts-ignore
        this.wakeLockSentinel = await navigator.wakeLock.request('screen');
      } catch {
        // WakeLock can be refused if battery is low or not active
      }
    }
  }

  private releaseWakeLock() {
    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release();
      } catch {
        // ignore
      }
      this.wakeLockSentinel = null;
    }
  }
}

export const settings = new SettingsState();
