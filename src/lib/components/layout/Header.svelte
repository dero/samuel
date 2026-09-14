<script lang="ts">
  import { navigation } from '../../state/navigation.svelte';
  import { settings } from '../../state/settings.svelte';
  import { APP_NAME } from '../../constants';
  import { dbState } from '../../db/database.svelte';
  import ModuleIcon from '../ui/ModuleIcon.svelte';
  import { List, BookOpen, CaretDown, FlagBanner } from 'phosphor-svelte';

  let active = $derived(navigation.activeModule);
  let isDashboard = $derived(!navigation.activeModuleId);
</script>

<header class="header" class:is-dashboard={isDashboard}>
  {#if isDashboard}
    <div class="dash-title-zone">
      <span class="app-icon">▲</span>
      <span class="app-title">{APP_NAME}</span>
    </div>

    <div class="header-actions">
      <button
        class="header-btn menu-btn"
        aria-label="Hlavní menu"
        title={dbState.updateAvailable ? "Menu (K dispozici je aktualizace)" : "Menu"}
        onclick={() => {
          settings.vibrate(25);
          navigation.openMenu();
        }}
      >
        <span class="icon"><List size={22} weight="bold" /></span>
        {#if dbState.updateAvailable}
          <span class="update-dot"></span>
        {/if}
      </button>
    </div>
  {:else}
    <button
      class="module-icon-btn"
      aria-label="Rychlý rozcestník pomůcek"
      onclick={() => {
        settings.vibrate(25);
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
    </button>

    <div class="title-zone">
      <button
        class="title-btn"
        onclick={() => {
          settings.vibrate(25);
          navigation.toggleLauncher();
        }}
      >
        <span class="title-text">{active?.name ?? ''}</span>
        <span class="chevron"><CaretDown size={14} weight="bold" /></span>
      </button>
    </div>

    <div class="header-actions">
      {#if !active?.isSystem}
        <button
          class="header-btn"
          aria-label="Reference a tahák"
          title="Reference"
          onclick={() => {
            settings.vibrate(25);
            navigation.openRef();
          }}
        >
          <span class="icon"><BookOpen size={20} weight="duotone" /></span>
        </button>
      {/if}

      <button
        class="header-btn menu-btn"
        aria-label="Menu modulu"
        title={dbState.updateAvailable ? "Menu (K dispozici je aktualizace)" : "Menu"}
        onclick={() => {
          settings.vibrate(25);
          navigation.openMenu();
        }}
      >
        <span class="icon"><List size={22} weight="bold" /></span>
        {#if dbState.updateAvailable}
          <span class="update-dot"></span>
        {/if}
      </button>
    </div>
  {/if}

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
    padding: 0 8px;
    z-index: 100;
    position: relative;
    user-select: none;
  }

  .dash-title-zone {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 6px;
  }

  .app-icon {
    font-size: 16px;
    color: var(--color-accent-primary);
  }

  .app-title {
    font-family: var(--font-condensed);
    font-size: 21px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: var(--color-text-primary);
  }

  .module-icon-btn {
    width: var(--tap-min-size);
    height: var(--tap-min-size);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    transition: background-color 0.15s;
  }
  .module-icon-btn:active {
    background-color: var(--color-surface-active);
  }

  .module-icon {
    font-size: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-accent-primary);
  }

  .title-zone {
    flex: 1;
    display: flex;
    justify-content: flex-start;
    padding: 0 4px;
    overflow: hidden;
  }

  .title-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border-radius: var(--radius-sm);
    max-width: 100%;
  }
  .title-btn:active {
    background-color: var(--color-surface-active);
  }

  .title-text {
    font-family: var(--font-condensed);
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chevron {
    font-size: 14px;
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
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
    transition: background-color 0.15s;
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
    top: 6px;
    right: 6px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--color-accent-primary);
    box-shadow: 0 0 6px var(--color-accent-primary);
  }
</style>
