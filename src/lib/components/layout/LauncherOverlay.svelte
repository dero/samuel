<script lang="ts">
  import { MODULES } from '../../types';
  import { navigation } from '../../state/navigation.svelte';
  import { settings } from '../../state/settings.svelte';
  import { dbState } from '../../db/database.svelte';
  import BottomSheet from '../ui/BottomSheet.svelte';
  import ModuleIcon from '../ui/ModuleIcon.svelte';
  import { SquaresFour } from 'phosphor-svelte';

  function handleSelect(id: string) {
    settings.vibrate(20);
    navigation.openModule(id as any);
  }
</script>

<BottomSheet
  open={navigation.isLauncherOpen}
  title="Výběr pomůcky"
  icon={SquaresFour}
  onClose={() => navigation.closeLauncher()}
  maxWidth="540px"
  padding={false}
>
  <div class="modules-container">
    <div class="modules-grid">
      {#each MODULES as mod, i}
        <button
          type="button"
          class="module-btn"
          class:is-active={navigation.activeModuleId === mod.id}
          class:is-system={mod.isSystem}
          class:is-center-single={i === MODULES.length - 1 && MODULES.length % 3 === 1}
          onclick={() => handleSelect(mod.id)}
        >
          <span class="icon">
            <ModuleIcon id={mod.id} weight="duotone" />
          </span>
          <span class="name">{mod.name}</span>
          {#if mod.id === 'settings' && dbState.updateAvailable}
            <span class="update-dot" title="K dispozici je aktualizace"></span>
          {/if}
        </button>
      {/each}
    </div>
  </div>
</BottomSheet>

<style>
  .modules-container {
    padding: var(--space-xs) var(--space-md) var(--space-md) var(--space-md);
    width: 100%;
    box-sizing: border-box;
  }

  .modules-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-xs);
    width: 100%;
  }

  .module-btn {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-sm) var(--space-xs);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    gap: 4px;
    min-height: 62px;
    transition: background-color 0.12s ease, border-color 0.12s ease, transform 0.06s ease;
    touch-action: manipulation;
  }

  .module-btn:active {
    background-color: var(--color-surface-active);
    transform: scale(0.96);
  }

  .module-btn.is-active {
    border-color: var(--color-accent-primary);
    background-color: var(--color-accent-primary-subtle);
    box-shadow: inset 0 0 0 1px var(--color-accent-primary);
  }

  .module-btn.is-system {
    background-color: var(--color-surface-system);
    border-color: var(--color-border-system);
  }

  .module-btn.is-center-single {
    grid-column: 2;
  }

  .update-dot {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--color-accent-primary);
    box-shadow: 0 0 6px var(--color-accent-primary);
  }

  .icon {
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-accent-primary);
  }

  .name {
    font-family: var(--font-condensed);
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: 0.15px;
    text-align: center;
    line-height: 1.15;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 96%;
  }
</style>
