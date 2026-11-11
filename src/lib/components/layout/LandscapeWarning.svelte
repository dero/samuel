<script lang="ts">
  import { DeviceMobileSpeaker } from 'phosphor-svelte';

  const MIN_HEIGHT = 540;

  /**
   * Decided by the screen, not the window: the OS keyboard shrinks the window
   * (interactive-widget=resizes-content), and a CSS orientation query would then read
   * a phone held upright as landscape.
   */
  function isScreenLandscape(): boolean {
    const type = screen.orientation?.type;
    if (type) return type.startsWith('landscape');
    // Older iOS Safari: no screen.orientation, and screen.width never swaps on rotation
    const legacy = (window as { orientation?: number }).orientation;
    if (typeof legacy === 'number') return Math.abs(legacy) === 90;
    return screen.width > screen.height;
  }

  let show = $state(false);

  $effect(() => {
    const update = () => {
      show = isScreenLandscape() && window.innerHeight < MIN_HEIGHT;
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    screen.orientation?.addEventListener('change', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      screen.orientation?.removeEventListener('change', update);
    };
  });
</script>

<div class="landscape-warning-overlay" class:is-visible={show} role="alert" aria-live="assertive">
  <div class="warning-box">
    <div class="phone-icon-anim">
      <DeviceMobileSpeaker size={48} weight="duotone" />
    </div>
    <span class="warning-text">Otočte na výšku</span>
  </div>
</div>

<style>
  .landscape-warning-overlay {
    display: none;
  }

  .landscape-warning-overlay.is-visible {
      display: flex;
      position: fixed;
      inset: 0;
      z-index: 10000;
      background-color: #000000;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
    }

    .warning-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-md);
      color: var(--color-text-primary);
    }

    .phone-icon-anim {
      color: var(--color-accent-primary);
      animation: rotatePhone 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }

    .warning-text {
      font-family: var(--font-condensed);
      font-size: var(--text-lg);
      font-weight: 700;
      letter-spacing: 0.5px;
      color: var(--color-text-secondary);
      text-transform: uppercase;
    }

  @keyframes rotatePhone {
    0%, 15% {
      transform: rotate(90deg);
    }
    50%, 80% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(90deg);
    }
  }
</style>
