<script lang="ts">
  import { DeviceMobileSpeaker } from 'phosphor-svelte';
</script>

<div class="landscape-warning-overlay" role="alert" aria-live="assertive">
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

  @media (orientation: landscape) and (max-height: 539px) {
    .landscape-warning-overlay {
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
