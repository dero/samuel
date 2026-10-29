<script lang="ts">
  import { navigation } from '../../state/navigation.svelte';
  import { settings } from '../../state/settings.svelte';
  import { versionService } from '../../services/versionService.svelte';
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

  <div class="header-actions">
    {#if !active?.isSystem}
      {#if active?.hasReference !== false}
        <button
          type="button"
          class="header-btn"
          aria-label="Reference"
          title="Reference"
          onclick={() => {
            settings.vibrate(20);
            navigation.toggleRef();
          }}
        >
          <span class="icon"><BookOpen size={20} weight="duotone" /></span>
        </button>
      {/if}

      {#if active?.hasMenu !== false}
        <button
          type="button"
          class="header-btn"
          class:has-warning={navigation.hasMenuWarning}
          aria-label={navigation.hasMenuWarning ? `Nastavení modulu (${active?.name ?? ''} - upozornění)` : `Nastavení modulu (${active?.name ?? ''})`}
          title={navigation.hasMenuWarning ? `Nastavení: ${active?.name ?? ''} (upozornění: nestandardní nastavení)` : `Nastavení: ${active?.name ?? ''}`}
          onclick={() => {
            settings.vibrate(20);
            navigation.toggleMenu();
          }}
        >
          <span class="icon-wrapper">
            <span class="icon"><List size={22} weight="bold" /></span>
            {#if navigation.hasMenuWarning}
              <span class="warning-dot" aria-hidden="true"></span>
            {/if}
          </span>
        </button>
      {/if}
    {/if}
  </div>

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
    font-size: calc(22px * var(--font-scale));
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
    font-size: calc(14px * var(--font-scale));
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

  .icon-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .warning-dot {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--color-accent-warning);
    box-shadow: 0 0 6px rgba(245, 158, 11, 0.8);
    border: 1.5px solid var(--color-surface-1);
    pointer-events: none;
  }

  .icon {
    font-size: calc(20px * var(--font-scale));
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
</style>
