<script lang="ts">
  import { CIPHER_MODULES } from '../../types';
  import { navigation } from '../../state/navigation.svelte';
  import { settings } from '../../state/settings.svelte';

  function handleCardClick(id: string) {
    settings.vibrate(25);
    navigation.openModule(id as any);
  }
</script>

<div class="dashboard-viewport">
  <div class="cipher-grid">
    {#each CIPHER_MODULES as mod}
      <button
        class="module-tile"
        onclick={() => handleCardClick(mod.id)}
      >
        <span class="tile-icon">{mod.icon}</span>
        <span class="tile-name">{mod.name}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .dashboard-viewport {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: var(--color-bg-canvas);
    display: flex;
    flex-direction: column;
    padding: max(8px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) max(8px, env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left));
    box-sizing: border-box;
    justify-content: center;
  }

  .cipher-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(5, 1fr);
    gap: 8px;
    width: 100%;
    height: 100%;
    max-width: 560px;
    margin: 0 auto;
  }

  .module-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: clamp(10px, 1.8vh, 14px);
    padding: 6px 4px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    text-align: center;
    min-height: 0;
    transition: background-color 0.12s, border-color 0.12s, transform 0.08s;
  }

  .module-tile:active {
    background-color: var(--color-surface-active);
    border-color: var(--color-border-focus);
    transform: scale(0.97);
  }

  .tile-icon {
    font-size: clamp(24px, 4vh, 34px);
    line-height: 1;
  }

  .tile-name {
    font-family: var(--font-condensed);
    font-size: clamp(14px, 2.3vh, 17px);
    font-weight: 600;
    letter-spacing: 0.2px;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 95%;
  }
</style>
