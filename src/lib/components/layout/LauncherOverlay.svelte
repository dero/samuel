<script lang="ts">
  import { MODULES } from '../../types';
  import { navigation } from '../../state/navigation.svelte';
  import { settings } from '../../state/settings.svelte';
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
  maxWidth="640px"
>
  <div class="modules-grid">
    {#each MODULES as mod}
      <button
        type="button"
        class="module-btn"
        class:is-active={navigation.activeModuleId === mod.id}
        class:is-system={mod.isSystem}
        onclick={() => handleSelect(mod.id)}
      >
        <span class="icon">
          <ModuleIcon id={mod.id} weight="duotone" />
        </span>
        <span class="name">{mod.name}</span>
      </button>
    {/each}
  </div>
</BottomSheet>

<style>
  .modules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: var(--space-sm);
    width: 100%;
  }

  .module-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-md) var(--space-xs);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    gap: var(--space-sm);
    min-height: 76px;
    transition: background-color 0.12s ease, border-color 0.12s ease, transform 0.06s ease;
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

  .icon {
    font-size: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-accent-primary);
  }

  .name {
    font-family: var(--font-condensed);
    font-size: var(--text-sm);
    font-weight: 600;
    letter-spacing: 0.2px;
    text-align: center;
    line-height: 1.2;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 95%;
  }
</style>
