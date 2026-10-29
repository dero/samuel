import { localSettingsService } from '../services/localSettingsService';

export const FONT_SCALES = [
  { id: '0.8', label: 'Malý' },
  { id: '0.9', label: 'Menší' },
  { id: '1', label: 'Normální' },
  { id: '1.12', label: 'Větší' },
  { id: '1.25', label: 'Velký' }
] as const;

export type FontScale = (typeof FONT_SCALES)[number]['id'];

function isFontScale(value: string): value is FontScale {
  return FONT_SCALES.some((s) => s.id === value);
}

class SettingsState {
  hapticsEnabled = $state<boolean>(true);
  wakeLockEnabled = $state<boolean>(true);
  fontScale = $state<FontScale>('1');

  private wakeLockSentinel: WakeLockSentinel | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const appScope = localSettingsService.forSection('app');
      this.hapticsEnabled = appScope.getBoolean('hapticsEnabled', true);
      this.wakeLockEnabled = appScope.getBoolean('wakeLockEnabled', true);
      const storedScale = appScope.getString('fontScale', '1');
      this.fontScale = isFontScale(storedScale) ? storedScale : '1';
      // Applied right away so the first paint already uses the chosen size.
      this.applyFontScale();

      $effect.root(() => {
        $effect(() => {
          appScope.setBoolean('hapticsEnabled', this.hapticsEnabled);
          appScope.setBoolean('wakeLockEnabled', this.wakeLockEnabled);
          appScope.setString('fontScale', this.fontScale);
        });

        $effect(() => {
          this.applyFontScale();
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

  vibrate(pattern: number | number[] = 35) {
    if (!this.hapticsEnabled || typeof navigator === 'undefined' || !navigator.vibrate) {
      return;
    }
    try {
      if (typeof pattern === 'number') {
        navigator.vibrate(Math.max(pattern, 30));
      } else if (Array.isArray(pattern)) {
        navigator.vibrate(pattern.map((p, idx) => (idx % 2 === 0 ? Math.max(p, 30) : p)));
      }
    } catch {
      // ignore
    }
  }

  private applyFontScale() {
    document.documentElement.style.setProperty('--font-scale-user', this.fontScale);
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
