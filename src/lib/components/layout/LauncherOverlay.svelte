<script lang="ts">
  import { MODULES, MODULE_GROUPS } from '../../types';
  import { navigation } from '../../state/navigation.svelte';
  import { settings } from '../../state/settings.svelte';
  import { versionService } from '../../services/versionService.svelte';
  import BottomSheet from '../ui/BottomSheet.svelte';
  import ModuleIcon from '../ui/ModuleIcon.svelte';
  import { SquaresFour } from 'phosphor-svelte';

  const COLUMNS = 4;

  // One block per group (in group order), modules sorted alphabetically (Czech) inside
  const groupBlocks = MODULE_GROUPS.map((group) => {
    const modules = MODULES.filter((m) => m.group === group.id).sort((a, b) =>
      a.name.localeCompare(b.name, 'cs')
    );
    const fillers = (COLUMNS - (modules.length % COLUMNS)) % COLUMNS;
    return { group, modules, fillers };
  }).filter((block) => block.modules.length > 0);

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
  maxHeight="80dvh"
  padding={false}
>
  <div class="launcher">
    {#each groupBlocks as { group, modules, fillers } (group.id)}
      <section class="group-block" style:--group-color={group.color} aria-label={group.name}>
        <div class="group-label" aria-hidden="true">
          <span class="group-label-text">{group.name}</span>
        </div>
        <div class="modules-grid">
          {#each modules as mod (mod.id)}
            <button
              type="button"
              class="module-btn"
              class:is-active={navigation.activeModuleId === mod.id}
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
          {#each Array(fillers) as _}
            <div class="grid-filler" aria-hidden="true"></div>
          {/each}
        </div>
      </section>
    {/each}
  </div>
</BottomSheet>

<style>
  .launcher {
    display: flex;
    flex-direction: column;
    gap: 1px;
    background-color: var(--color-border-subtle);
    padding-bottom: max(var(--space-md), env(safe-area-inset-bottom, 0px));
  }

  .group-block {
    display: flex;
    gap: 1px;
  }

  /* Vertical group name, read bottom-to-top like a book spine */
  .group-label {
    flex: none;
    width: calc(20px * var(--font-scale));
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background-color: var(--group-color);
  }

  .group-label-text {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    max-height: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--font-condensed);
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.3px;
    color: var(--color-text-inverse);
  }

  .modules-grid {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1px;
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

  .grid-filler {
    background-color: var(--color-surface-sunken);
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
    font-size: calc(24px * var(--font-scale));
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--group-color);
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
