<script lang="ts">
  import { MODULES } from '../../types';
  import { navigation } from '../../state/navigation.svelte';
  import { settings } from '../../state/settings.svelte';

  function handleSelect(id: string) {
    settings.vibrate(25);
    navigation.openModule(id as any);
  }

  function handleBackToDashboard() {
    settings.vibrate(25);
    navigation.openDashboard();
  }
</script>

{#if navigation.isLauncherOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={() => navigation.closeLauncher()}>
    <div class="sheet" onclick={(e) => e.stopPropagation()}>
      <div class="sheet-header">
        <button class="sheet-back-btn" onclick={handleBackToDashboard}>
          ← Všechny pomůcky
        </button>
        <button class="sheet-close-btn" onclick={() => navigation.closeLauncher()}>
          ✕
        </button>
      </div>

      <div class="grid-scroll">
        <div class="modules-grid">
          {#each MODULES as mod}
            <button
              class="module-btn"
              class:is-active={navigation.activeModuleId === mod.id}
              class:is-system={mod.isSystem}
              onclick={() => handleSelect(mod.id)}
            >
              <span class="icon">{mod.icon}</span>
              <span class="name">{mod.name}</span>
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 200;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  .sheet {
    background-color: var(--color-surface-1);
    border-bottom: 1px solid var(--color-border-subtle);
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
  }

  .sheet-header {
    height: var(--header-height);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .sheet-back-btn {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-accent-primary);
    padding: 8px;
  }

  .sheet-close-btn {
    width: var(--tap-min-size);
    height: var(--tap-min-size);
    font-size: 20px;
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .grid-scroll {
    overflow-y: auto;
    padding: 12px;
  }

  .modules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
  }

  .module-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px 6px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    gap: 8px;
    min-height: 72px;
    transition: background-color 0.15s, border-color 0.15s;
  }

  .module-btn:active {
    background-color: var(--color-surface-active);
  }

  .module-btn.is-active {
    border-color: var(--color-accent-primary);
    background-color: rgba(0, 210, 255, 0.1);
  }

  .module-btn.is-system {
    background-color: var(--color-surface-system);
    border-color: var(--color-border-system);
  }

  .icon {
    font-size: 24px;
  }

  .name {
    font-family: var(--font-condensed);
    font-size: 13.5px;
    font-weight: 600;
    letter-spacing: 0.2px;
    text-align: center;
    line-height: 1.2;
    color: var(--color-text-primary);
  }
</style>
