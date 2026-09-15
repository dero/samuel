import { localSettingsService } from '../services/localSettingsService';

class SettingsState {
  hapticsEnabled = $state<boolean>(true);
  wakeLockEnabled = $state<boolean>(true);
  devToolsEnabled = $state<boolean>(false);

  private wakeLockSentinel: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const appScope = localSettingsService.forSection('app');
      this.hapticsEnabled = appScope.getBoolean('hapticsEnabled', true);
      this.wakeLockEnabled = appScope.getBoolean('wakeLockEnabled', true);
      this.devToolsEnabled = appScope.getBoolean('devToolsEnabled', false);

      $effect.root(() => {
        $effect(() => {
          appScope.setBoolean('hapticsEnabled', this.hapticsEnabled);
          appScope.setBoolean('wakeLockEnabled', this.wakeLockEnabled);
          appScope.setBoolean('devToolsEnabled', this.devToolsEnabled);
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
