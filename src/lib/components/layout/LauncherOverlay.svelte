<script lang="ts">
  import { MODULES } from '../../types';
  import { navigation } from '../../state/navigation.svelte';
  import { settings } from '../../state/settings.svelte';
  import { versionService } from '../../services/versionService.svelte';
  import BottomSheet from '../ui/BottomSheet.svelte';
  import ModuleIcon from '../ui/ModuleIcon.svelte';
  import { SquaresFour } from 'phosphor-svelte';

  function handleSelect(id: string) {
    settings.vibrate(20);
    navigation.openModule(id as any);
  }

  const fillersCount = MODULES.length % 4 === 0 ? 0 : 4 - (MODULES.length % 4);
</script>

<BottomSheet
  open={navigation.isLauncherOpen}
  title="Výběr pomůcky"
  icon={SquaresFour}
  onClose={() => navigation.closeLauncher()}
  maxWidth="540px"
  maxHeight="80dvh"
  padding={false}
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
        {#if mod.id === 'settings' && versionService.state.updateAvailable}
          <span class="update-dot" title="K dispozici je aktualizace"></span>
        {/if}
      </button>
    {/each}
    {#each Array(fillersCount) as _}
      <div class="grid-filler" aria-hidden="true"></div>
    {/each}
  </div>
</BottomSheet>

<style>
  .modules-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    background-color: var(--color-border-subtle);
    width: 100%;
    margin: 0;
    padding: 0 0 max(var(--space-md), env(safe-area-inset-bottom, 0px)) 0;
  }

  .module-btn,
  .grid-filler {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-sm) 2px;
    background-color: var(--color-surface-1);
    border: none;
    border-radius: 0;
    gap: 5px;
    min-height: 68px;
    box-sizing: border-box;
  }

  .module-btn {
    transition: background-color 0.12s ease;
    touch-action: manipulation;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  @media (hover: hover) {
    .module-btn:hover {
      background-color: var(--color-surface-2);
    }
  }

  .module-btn:active {
    background-color: var(--color-surface-active);
  }

  .module-btn.is-active {
    background-color: var(--color-accent-primary-subtle);
  }

  .module-btn.is-active .icon {
    filter: drop-shadow(0 0 6px var(--color-accent-primary-glow));
  }

  .module-btn.is-active .name {
    color: var(--color-accent-primary);
    font-weight: 700;
  }

  .module-btn.is-system .icon {
    color: var(--color-text-secondary);
  }

  .update-dot {
    position: absolute;
    top: 6px;
    right: 8px;
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
    font-weight: 500;
    letter-spacing: 0.05px;
    text-align: center;
    line-height: 1.15;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 98%;
  }
</style>
