<script lang="ts">
  import BottomSheet from './BottomSheet.svelte';
  import SlideToAction from './SlideToAction.svelte';
  import { settings } from '../../state/settings.svelte';
  import { pasteFromClipboard } from '../../utils/clipboard';
  import { TextT, ClipboardText, Check } from 'phosphor-svelte';

  interface Props {
    open: boolean;
    title: string;
    value: string;
    placeholder?: string;
    onSave: (val: string) => void;
    onClose: () => void;
  }

  let {
    open = false,
    title = 'Zadání textu',
    value = '',
    placeholder = 'Zadejte nebo vložte text...',
    onSave,
    onClose
  }: Props = $props();

  let draftText = $state('');
  let textareaEl = $state<HTMLTextAreaElement | null>(null);

  $effect(() => {
    if (open) {
      draftText = value;
      // Focus textarea on open
      setTimeout(() => {
        if (textareaEl) {
          textareaEl.focus();
          textareaEl.setSelectionRange(draftText.length, draftText.length);
        }
      }, 120);
    }
  });

  async function handlePaste() {
    settings.vibrate(20);
    const clip = await pasteFromClipboard();
    if (clip) {
      draftText = (draftText ? draftText + ' ' : '') + clip;
    }
  }

  function handleClear() {
    draftText = '';
  }

  function handleConfirm() {
    settings.vibrate(25);
    onSave(draftText);
    onClose();
  }
</script>

<BottomSheet
  {open}
  {title}
  icon={TextT}
  maxHeight="92dvh"
  {onClose}
>
  <div class="text-entry-container">
    <div class="textarea-wrapper">
      <textarea
        bind:this={textareaEl}
        bind:value={draftText}
        class="entry-textarea font-mono"
        {placeholder}
        autocomplete="off"
        autocapitalize="characters"
        spellcheck="false"
        rows={3}
      ></textarea>

      {#if draftText.length > 0}
        <div class="char-counter">
          {draftText.length} znaků
        </div>
      {/if}
    </div>

    <!-- Quick Actions in Sheet -->
    <div class="sheet-actions-row">
      <button
        type="button"
        class="paste-btn"
        onclick={handlePaste}
        title="Vložit text ze schránky"
      >
        <ClipboardText size={18} weight="duotone" />
        <span>Vložit</span>
      </button>

      <SlideToAction
        disabled={!draftText}
        onAction={handleClear}
        showLabel={true}
        label="Vymazat"
        ariaLabel="Vymazat text podržením"
        holdDuration={400}
      />
    </div>

    <!-- Primary Confirm Button -->
    <button
      type="button"
      class="confirm-btn"
      onclick={handleConfirm}
    >
      <Check size={18} weight="bold" />
      <span>Hotovo</span>
    </button>
  </div>
</BottomSheet>

<style>
  .text-entry-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    width: 100%;
  }

  .textarea-wrapper {
    position: relative;
    width: 100%;
  }

  .entry-textarea {
    width: 100%;
    min-height: 64px;
    height: clamp(64px, 20dvh, 120px);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: 600;
    line-height: 1.35;
    padding: 8px 12px 20px 12px;
    box-sizing: border-box;
    resize: none;
    outline: none;
    transition: border-color 0.12s ease;
  }

  .entry-textarea:focus {
    border-color: var(--color-border-focus);
    box-shadow: 0 0 10px rgba(0, 210, 255, 0.2);
  }

  .entry-textarea::placeholder {
    color: var(--color-text-muted);
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: 400;
  }

  .char-counter {
    position: absolute;
    bottom: 5px;
    right: 8px;
    font-size: 11px;
    font-family: var(--font-mono);
    color: var(--color-text-muted);
    pointer-events: none;
  }

  .sheet-actions-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-sm);
    align-items: center;
  }

  .paste-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    height: 38px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-accent-primary);
    font-size: var(--text-sm);
    font-weight: 700;
    cursor: pointer;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      inset 0 -1px 0 rgba(0, 0, 0, 0.4);
    transition: background-color 0.12s ease;
  }

  .paste-btn:active {
    background-color: var(--color-surface-active);
  }

  .confirm-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    height: 40px;
    width: 100%;
    background-color: var(--color-accent-primary);
    color: #000000;
    border: none;
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0, 210, 255, 0.3);
    transition: opacity 0.12s ease, transform 0.08s ease;
  }

  .confirm-btn:active {
    opacity: 0.85;
    transform: scale(0.98);
  }
</style>
