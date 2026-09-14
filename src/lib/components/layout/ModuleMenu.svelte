<script lang="ts">
  import { navigation } from '../../state/navigation.svelte';
  import { alphabet } from '../../state/alphabet.svelte';
  import { settings } from '../../state/settings.svelte';
  import { pasteFromClipboard } from '../../utils/clipboard';
  import { ClipboardText, Trash, X, CaretDown, CaretUp } from 'phosphor-svelte';

  interface Props {
    hasAlphabet?: boolean;
    onReset?: () => void;
    onPaste?: (text: string) => void;
    children?: import('svelte').Snippet;
  }

  let { hasAlphabet = false, onReset, onPaste, children }: Props = $props();

  let isConfirmingReset = $state(false);
  let resetTimeout: ReturnType<typeof setTimeout> | null = null;
  let isAlphabetPickerOpen = $state(false);

  function handleResetClick() {
    settings.vibrate(25);
    if (!isConfirmingReset) {
      isConfirmingReset = true;
      resetTimeout = setTimeout(() => {
        isConfirmingReset = false;
      }, 3000);
    } else {
      if (resetTimeout) clearTimeout(resetTimeout);
      isConfirmingReset = false;
      if (onReset) onReset();
      navigation.closeSubView();
    }
  }

  async function handlePasteClick() {
    settings.vibrate(25);
    const text = await pasteFromClipboard();
    if (text && onPaste) {
      onPaste(text);
      navigation.closeSubView();
    }
  }
</script>

{#if navigation.subView === 'menu'}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="menu-backdrop" onclick={() => navigation.closeSubView()}>
    <div class="menu-panel" onclick={(e) => e.stopPropagation()}>
      <div class="menu-header">
        <span class="menu-title">Menu modulu</span>
        <button class="close-btn" aria-label="Zavřít menu" onclick={() => navigation.closeSubView()}>
          <X size={20} weight="bold" />
        </button>
      </div>

      <div class="menu-body">
        {#if hasAlphabet}
          <div class="section">
            <div class="section-label">Aktivní abeceda</div>
            <button
              class="alphabet-btn"
              onclick={() => {
                settings.vibrate(25);
                isAlphabetPickerOpen = !isAlphabetPickerOpen;
              }}
            >
              <span class="btn-text">{alphabet.currentLayout.name}</span>
              <span class="chevron">
                {#if isAlphabetPickerOpen}
                  <CaretUp size={14} weight="bold" />
                {:else}
                  <CaretDown size={14} weight="bold" />
                {/if}
              </span>
            </button>

            {#if isAlphabetPickerOpen}
              <div class="alphabet-list">
                {#each alphabet.layouts as layout}
                  <button
                    class="alphabet-item"
                    class:selected={layout.id === alphabet.activeId}
                    onclick={() => {
                      settings.vibrate(25);
                      alphabet.setActiveLayout(layout.id);
                      isAlphabetPickerOpen = false;
                    }}
                  >
                    <span>{layout.name}</span>
                    {#if layout.id === alphabet.activeId}
                      <span class="check">✓</span>
                    {/if}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        {#if children}
          <div class="section custom-options">
            <div class="section-label">Lokální nastavení</div>
            {@render children()}
          </div>
        {/if}

        <div class="section actions">
          <div class="section-label">Rychlé akce</div>
          <button class="action-btn" onclick={handlePasteClick}>
            <span class="btn-icon"><ClipboardText size={20} weight="duotone" /></span>
            <span>Vložit ze schránky</span>
          </button>

          <button
            class="action-btn reset-btn"
            class:confirming={isConfirmingReset}
            onclick={handleResetClick}
          >
            <span class="btn-icon"><Trash size={20} weight="duotone" /></span>
            <span>{isConfirmingReset ? 'Opravdu vymazat modul?' : 'Vyčistit modul'}</span>
          </button>
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
    -webkit-backdrop-filter: blur(4px);
    z-index: 210;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  @media (min-width: 600px) {
    .menu-backdrop {
      align-items: center;
      padding: 20px;
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
    overflow: hidden;
    animation: sheetSlideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.6);
  }

  @media (min-width: 600px) {
    .menu-panel {
      border-radius: var(--radius-lg);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8);
    }
  }

  @keyframes sheetSlideUp {
    from {
      transform: translateY(100%);
      opacity: 0.8;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .menu-header {
    height: 52px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--color-border-subtle);
    flex-shrink: 0;
  }

  .menu-title {
    font-size: 17px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .close-btn {
    width: var(--tap-min-size);
    height: var(--tap-min-size);
    font-size: 18px;
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    transition: color 0.12s, background-color 0.12s;
  }

  .close-btn:active {
    color: #ffffff;
    background-color: var(--color-surface-active);
  }

  .menu-body {
    padding: 16px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .section-label {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--color-text-secondary);
  }

  .alphabet-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    font-size: 15px;
    font-weight: 600;
  }

  .alphabet-list {
    display: flex;
    flex-direction: column;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    overflow: hidden;
    margin-top: 4px;
  }

  .alphabet-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    font-size: 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    text-align: left;
  }
  .alphabet-item:last-child {
    border-bottom: none;
  }
  .alphabet-item.selected {
    color: var(--color-accent-primary);
    font-weight: 600;
  }

  .check {
    font-weight: bold;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    font-size: 15px;
    font-weight: 600;
    min-height: 48px;
    transition: background-color 0.15s, border-color 0.15s;
  }
  .action-btn:active {
    background-color: var(--color-surface-active);
  }

  .reset-btn {
    color: var(--color-accent-danger);
    border-color: rgba(239, 68, 68, 0.3);
  }

  .reset-btn.confirming {
    background-color: var(--color-accent-danger);
    color: #FFFFFF;
    border-color: var(--color-accent-danger);
    animation: pulse 0.5s infinite alternate;
  }

  @keyframes pulse {
    from { opacity: 0.9; }
    to { opacity: 1; }
  }

  .chevron {
    display: flex;
    align-items: center;
    color: var(--color-text-secondary);
  }

  .btn-icon {
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
