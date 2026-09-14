<script lang="ts">
  import { navigation } from '../../state/navigation.svelte';
  import { settings } from '../../state/settings.svelte';
  import { APP_NAME, APP_VERSION } from '../../constants';
  import { dbState } from '../../db/database.svelte';

  function handleOpenModule(id: 'settings' | 'help') {
    settings.vibrate(25);
    navigation.openModule(id);
  }
</script>

{#if navigation.subView === 'menu' && !navigation.activeModuleId}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="menu-backdrop" onclick={() => navigation.closeSubView()}>
    <div class="menu-panel" onclick={(e) => e.stopPropagation()}>
      <div class="menu-header">
        <span class="menu-title">Menu</span>
        <button
          class="close-btn"
          aria-label="Zavřít menu"
          onclick={() => navigation.closeSubView()}
        >✕</button>
      </div>

      <div class="menu-body">
        <div class="nav-cards">
          <button
            class="nav-card"
            onclick={() => handleOpenModule('settings')}
          >
            <div class="card-icon">⚙️</div>
            <div class="card-content">
              <div class="card-title-row">
                <span class="card-title">Nastavení</span>
                {#if dbState.updateAvailable}
                  <span class="update-badge">Aktualizace</span>
                {/if}
              </div>
              <span class="card-desc">Vibrace, zhasínání displeje, správa abeced</span>
            </div>
            <div class="card-arrow">›</div>
          </button>

          <button
            class="nav-card"
            onclick={() => handleOpenModule('help')}
          >
            <div class="card-icon">❓</div>
            <div class="card-content">
              <span class="card-title">Nápověda</span>
              <span class="card-desc">Popis modulů, tipy a ovládání aplikace</span>
            </div>
            <div class="card-arrow">›</div>
          </button>
        </div>

        <div class="menu-footer">
          <div class="footer-brand">{APP_NAME} <span class="version">v{APP_VERSION}</span></div>
          <div class="footer-note">Offline nástroj pro terénní šifrovací hry</div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .menu-backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 210;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  @media (min-width: 600px) {
    .menu-backdrop {
      align-items: center;
    }
  }

  .menu-panel {
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    width: 100%;
    max-width: 480px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.85);
    overflow: hidden;
  }

  @media (min-width: 600px) {
    .menu-panel {
      border-radius: var(--radius-lg);
    }
  }

  .menu-header {
    height: var(--header-height);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    border-bottom: 1px solid var(--color-border-subtle);
    background-color: var(--color-surface-2);
  }

  .menu-title {
    font-family: var(--font-condensed);
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.3px;
    color: var(--color-text-primary);
  }

  .close-btn {
    width: var(--tap-min-size);
    height: var(--tap-min-size);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: var(--color-text-secondary);
  }

  .close-btn:active {
    color: var(--color-text-primary);
  }

  .menu-body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .nav-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .nav-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    text-align: left;
    transition: background-color 0.12s, border-color 0.12s, transform 0.08s;
  }

  .nav-card:active {
    background-color: var(--color-surface-active);
    border-color: var(--color-border-focus);
    transform: scale(0.99);
  }

  .card-icon {
    font-size: 26px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
  }

  .card-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .card-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .card-title {
    font-family: var(--font-condensed);
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.3px;
    color: var(--color-text-primary);
  }

  .update-badge {
    padding: 2px 6px;
    background-color: var(--color-accent-primary);
    color: #000;
    font-size: 11px;
    font-weight: 700;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .card-desc {
    font-size: 12px;
    color: var(--color-text-secondary);
    line-height: 1.3;
  }

  .card-arrow {
    font-size: 22px;
    color: var(--color-text-muted);
    line-height: 1;
    flex-shrink: 0;
  }

  .menu-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding-top: 8px;
    border-top: 1px solid var(--color-border-subtle);
  }

  .footer-brand {
    font-family: var(--font-condensed);
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .version {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .footer-note {
    font-size: 11px;
    color: var(--color-text-muted);
    text-align: center;
  }
</style>
