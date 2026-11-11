import { localSettingsService } from '../services/localSettingsService';

/** Global zoom steps. Applied by the inline script in index.html (meta viewport). */
export const ZOOM_LEVELS = [0.9, 1, 1.15, 1.3] as const;

/** DS minimum viewport width; a zoom step that would narrow the layout below it is not offered. */
const MIN_LAYOUT_WIDTH = 320;

declare global {
  interface Window {
    __samuelApplyZoom?: (zoom: number) => void;
  }
}

function portraitScreenWidth(): number {
  return Math.min(screen.width, screen.height);
}

/** Zoom steps this screen can afford, always including the default and the current one. */
export function availableZoomLevels(current: number): number[] {
  if (typeof window === 'undefined') return [...ZOOM_LEVELS];
  const width = portraitScreenWidth();
  return ZOOM_LEVELS.filter((z) => z === 1 || z === current || width / z >= MIN_LAYOUT_WIDTH);
}

function isZoomLevel(value: unknown): value is number {
  return typeof value === 'number' && (ZOOM_LEVELS as readonly number[]).includes(value);
}

class SettingsState {
  hapticsEnabled = $state<boolean>(true);
  wakeLockEnabled = $state<boolean>(true);
  zoom = $state<number>(1);

  private wakeLockSentinel: WakeLockSentinel | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const appScope = localSettingsService.forSection('app');
      this.hapticsEnabled = appScope.getBoolean('hapticsEnabled', true);
      this.wakeLockEnabled = appScope.getBoolean('wakeLockEnabled', true);
      const storedZoom = appScope.get<unknown>('zoom', 1);
      this.zoom = isZoomLevel(storedZoom) ? storedZoom : 1;
      // index.html already applied the stored zoom before first paint.
      appScope.removeItem('fontScale');

      $effect.root(() => {
        $effect(() => {
          appScope.setBoolean('hapticsEnabled', this.hapticsEnabled);
          appScope.setBoolean('wakeLockEnabled', this.wakeLockEnabled);
          appScope.set('zoom', this.zoom);
        });

        $effect(() => {
          window.__samuelApplyZoom?.(this.zoom);
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
