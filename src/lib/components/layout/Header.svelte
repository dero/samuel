<script lang="ts">
  import { navigation } from '../../state/navigation.svelte';
  import { settings } from '../../state/settings.svelte';
  import { dbState } from '../../db/database.svelte';
  import ModuleIcon from '../ui/ModuleIcon.svelte';
  import { List, BookOpen, CaretDown, FlagBanner } from 'phosphor-svelte';

  let active = $derived(navigation.activeModule);
</script>
<header class="header">
  <div class="title-zone">
    <button
      type="button"
      class="launcher-btn"
      aria-label="Výběr pomůcky"
      title="Kliknutím otevřete výběr pomůcek"
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

  <div class="header-actions">
    {#if !active?.isSystem}
      <button
        type="button"
        class="header-btn"
        aria-label="Reference a tahák"
        title="Reference a tahák"
        onclick={() => {
          settings.vibrate(20);
          navigation.openRef();
        }}
      >
        <span class="icon"><BookOpen size={20} weight="duotone" /></span>
      </button>
    {/if}

    <button
      type="button"
      class="header-btn menu-btn"
      aria-label="Menu modulu"
      title={dbState.updateAvailable ? "Menu (K dispozici je aktualizace)" : "Menu modulu"}
      onclick={() => {
        settings.vibrate(20);
        navigation.openMenu();
      }}
    >
      <span class="icon"><List size={22} weight="bold" /></span>
      {#if dbState.updateAvailable}
        <span class="update-dot"></span>
      {/if}
    </button>
  </div>

  {#if dbState.status === 'loading'}
    <div class="db-sync-bar" title="Stahování slovníkové databáze ({dbState.progress}%)">
      <div class="db-sync-progress" style="width: {dbState.progress}%"></div>
    </div>
  {/if}
</header>

<style>
  .header {
    height: var(--header-height);
    min-height: var(--header-height);
    background-color: var(--color-surface-1);
    border-bottom: 1px solid var(--color-border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
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
    gap: var(--space-sm);
    height: var(--tap-min-size);
    padding: 0 var(--space-sm);
    border-radius: var(--radius-sm);
    max-width: 100%;
    transition: background-color 0.12s ease;
  }
  .launcher-btn:active {
    background-color: var(--color-surface-active);
  }

  .module-icon {
    font-size: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-accent-primary);
    flex-shrink: 0;
  }

  .title-text {
    font-family: var(--font-condensed);
    font-size: var(--text-xl);
    font-weight: 700;
    letter-spacing: 0.3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--color-text-primary);
  }

  .chevron {
    font-size: 14px;
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .header-btn {
    width: var(--tap-min-size);
    height: var(--tap-min-size);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    transition: background-color 0.12s ease;
    color: var(--color-text-primary);
  }
  .header-btn:active {
    background-color: var(--color-surface-active);
  }

  .icon {
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
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

  .menu-btn {
    position: relative;
  }

  .update-dot {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--color-accent-primary);
    box-shadow: 0 0 6px var(--color-accent-primary);
  }
</style>
