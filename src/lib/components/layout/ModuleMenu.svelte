<script lang="ts">
  import { navigation } from '../../state/navigation.svelte';
  import { alphabet } from '../../state/alphabet.svelte';
  import { settings } from '../../state/settings.svelte';
  import { pasteFromClipboard } from '../../utils/clipboard';
  import BottomSheet from '../ui/BottomSheet.svelte';
  import { ClipboardText, Trash, CaretDown, CaretUp, List } from 'phosphor-svelte';

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

<BottomSheet
  open={navigation.subView === 'menu' && !!navigation.activeModuleId}
  title="Menu modulu"
  icon={List}
  maxWidth="480px"
  onClose={() => navigation.closeSubView()}
>
  {#if hasAlphabet}
    <div class="menu-section">
      <div class="section-label">Aktivní abeceda</div>
      <button
        type="button"
        class="alphabet-btn"
        onclick={() => {
          settings.vibrate(20);
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
              type="button"
              class="alphabet-item"
              class:selected={layout.id === alphabet.activeId}
              onclick={() => {
                settings.vibrate(20);
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
    <div class="menu-section custom-options">
      <div class="section-label">Lokální nastavení</div>
      {@render children()}
    </div>
  {/if}

  <div class="menu-section actions">
    <div class="section-label">Rychlé akce</div>
    <button type="button" class="action-btn" onclick={handlePasteClick}>
      <span class="btn-icon"><ClipboardText size={20} weight="duotone" /></span>
      <span>Vložit ze schránky</span>
    </button>

    <button
      type="button"
      class="action-btn reset-btn"
      class:confirming={isConfirmingReset}
      onclick={handleResetClick}
    >
      <span class="btn-icon"><Trash size={20} weight="duotone" /></span>
      <span>{isConfirmingReset ? 'Opravdu vymazat modul?' : 'Vyčistit modul'}</span>
    </button>
  </div>
</BottomSheet>

<style>
  .menu-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .section-label {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--color-text-secondary);
  }

  .alphabet-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md) var(--space-md);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    font-size: var(--text-base);
    font-weight: 600;
    width: 100%;
    color: var(--color-text-primary);
  }

  .alphabet-list {
    display: flex;
    flex-direction: column;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    overflow: hidden;
    margin-top: var(--space-xs);
  }

  .alphabet-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md) var(--space-md);
    font-size: var(--text-sm);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    text-align: left;
    color: var(--color-text-primary);
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
    color: var(--color-accent-primary);
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    font-size: var(--text-base);
    font-weight: 600;
    min-height: var(--tap-min-size);
    color: var(--color-text-primary);
    transition: background-color 0.12s ease, border-color 0.12s ease;
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
    color: #ffffff;
    border-color: var(--color-accent-danger);
    animation: pulse 0.5s infinite alternate;
  }

  @keyframes pulse {
    from { opacity: 0.85; }
    to { opacity: 1; }
  }

  .chevron {
    display: flex;
    align-items: center;
    color: var(--color-text-secondary);
  }

  .btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
</style>
