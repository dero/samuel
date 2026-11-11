<script lang="ts">
  import { navigation } from '../../state/navigation.svelte';
  import { settings } from '../../state/settings.svelte';
  import { versionService } from '../../services/versionService.svelte';
  import { podklad } from '../../state/podklad.svelte';
  import ModuleIcon from '../ui/ModuleIcon.svelte';
  import type { SubView } from '../../types';
  import { HandTap, FileText, SlidersHorizontal, CaretDown, FlagBanner } from 'phosphor-svelte';

  let active = $derived(navigation.activeModule);
  // Icon carries the launcher group color, so the module is recognizable across both

  interface Tab {
    view: SubView;
    label: string;
    icon: any;
    disabled?: boolean;
    attention?: boolean;
  }

  const tabs = $derived.by<Tab[]>(() => {
    if (active?.isSystem) return [];
    const list: Tab[] = [
      { view: 'none', label: 'Interakce', icon: HandTap, disabled: podklad.phaseActive }
    ];
    if (podklad.config) {
      list.push({
        view: 'podklad',
        label: `Podklad: ${podklad.config.title}`,
        icon: FileText,
        attention: !!podklad.config.attention
      });
    }
    if (navigation.hasMenu) {
      list.push({
        view: 'menu',
        label: 'Menu',
        icon: SlidersHorizontal,
        attention: navigation.hasMenuWarning
      });
    }
    return list.length > 1 ? list : [];
  });

  function selectTab(tab: Tab) {
    settings.vibrate(20);
    if (navigation.subView !== tab.view) navigation.openView(tab.view);
  }
</script>

<header class="header">
  <div class="title-zone">
    <button
      type="button"
      class="launcher-btn"
      aria-label="Výběr pomůcky"
      title="Výběr pomůcky"
      onclick={() => {
        settings.vibrate(20);
        navigation.toggleLauncher();
      }}
    >
      <span class="module-icon">
        {#if active}
          <ModuleIcon id={active.id} weight="duotone" />
        {:else}
          <FlagBanner size="1em" weight="duotone" />
        {/if}
      </span>
      <span class="title-text">{active?.name ?? ''}</span>
      <span class="chevron"><CaretDown size={14} weight="bold" /></span>
    </button>
  </div>

  {#if tabs.length > 0}
    <div class="tabs" role="tablist" aria-label="Pohled nástroje">
      {#each tabs as tab (tab.view)}
        {@const Icon = tab.icon}
        {@const isActive = navigation.subView === tab.view}
        <button
          type="button"
          class="tab"
          class:is-active={isActive}
          role="tab"
          aria-selected={isActive}
          aria-label={tab.label}
          title={tab.label}
          disabled={tab.disabled}
          onclick={() => selectTab(tab)}
        >
          <span class="tab-icon">
            <Icon size={21} weight={isActive ? 'fill' : 'regular'} />
            {#if tab.attention}
              <span class="warning-dot" aria-hidden="true"></span>
            {/if}
          </span>
        </button>
      {/each}
    </div>
  {/if}

  {#if versionService.state.status === 'downloading_db'}
    <div class="db-sync-bar" title="Stahování slovníkové databáze ({versionService.state.progress}%)">
      <div class="db-sync-progress" style="width: {versionService.state.progress}%"></div>
    </div>
  {/if}
</header>

<style>
  .header {
    height: var(--header-height);
    min-height: var(--header-height);
    background-color: var(--color-surface-1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-xs);
    padding: 0 var(--space-sm);
    z-index: 100;
    position: relative;
    user-select: none;
    box-sizing: border-box;
  }

  .title-zone {
    flex: 1;
    display: flex;
    align-items: center;
    min-width: 0;
    overflow: hidden;
  }

  .launcher-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: var(--tap-min-size);
    padding: 0 var(--space-xs);
    border-radius: var(--radius-sm);
    max-width: 100%;
    transition: background-color 0.12s ease;
  }

  .launcher-btn:active {
    background-color: var(--color-surface-active);
  }

  .module-icon {
    font-size: calc(20px * var(--font-scale));
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }

  .title-text {
    font-family: var(--font-condensed);
    /* Capped by width: "Substituce" must fit beside three tabs on 320 px */
    font-size: min(var(--text-xl), 5.6vw);
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--color-text-primary);
  }

  .chevron {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--color-text-secondary);
  }

  .tabs {
    flex: none;
    display: flex;
    gap: 2px;
    padding: 2px;
    background-color: var(--color-bg-canvas);
    border: 1px solid var(--color-border-medium);
    border-radius: var(--radius-sm);
  }

  .tab {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 38px;
    border-radius: 3px;
    background-color: var(--color-surface-3);
    color: var(--color-text-primary);
    transition: background-color 0.12s ease;
  }

  .tab:active:not(:disabled) {
    background-color: var(--color-surface-active);
  }

  /* Accent plus an underline and a filled icon: never color alone */
  .tab.is-active {
    background-color: var(--color-accent-primary-subtle);
    box-shadow: inset 0 -2px 0 var(--color-accent-primary);
    color: var(--color-accent-primary);
  }

  .tab:disabled {
    cursor: default;
  }

  .tab:disabled .tab-icon {
    opacity: 0.48;
  }

  .tab-icon {
    position: relative;
    display: inline-flex;
  }

  .warning-dot {
    position: absolute;
    top: -2px;
    right: -3px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--color-accent-warning);
    border: 1.5px solid var(--color-surface-3);
    pointer-events: none;
  }

  .db-sync-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background-color: rgba(255, 255, 255, 0.1);
    overflow: hidden;
    z-index: 101;
  }

  .db-sync-progress {
    height: 100%;
    background-color: var(--color-accent-primary);
    transition: width 0.2s ease-out;
  }
</style>
