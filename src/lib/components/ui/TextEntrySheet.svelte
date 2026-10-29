<script lang="ts">
  import BottomSheet from './BottomSheet.svelte';
  import { settings } from '../../state/settings.svelte';
  import { TextT, Check } from 'phosphor-svelte';

  interface Props {
    open: boolean;
    title: string;
    value: string;
    placeholder?: string;
    options?: import('svelte').Snippet;
    quickInsertChars?: string[];
    discardSpaces?: boolean;
    autocapitalize?: 'none' | 'characters' | 'words' | 'sentences' | 'off' | 'on';
    inputmode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
    onSave: (val: string) => void;
    onClose: () => void;
  }

  let {
    open = false,
    title = 'Zadání textu',
    value = '',
    placeholder = 'Zadejte nebo vložte text...',
    options,
    quickInsertChars = [],
    discardSpaces = false,
    autocapitalize,
    inputmode,
    onSave,
    onClose
  }: Props = $props();

  let draftText = $state('');
  let textareaEl = $state<HTMLTextAreaElement | null>(null);

  $effect(() => {
    if (open) {
      draftText = discardSpaces ? value.replace(/\s+/g, '') : value;
      // Focus textarea on open
      setTimeout(() => {
        if (textareaEl) {
          textareaEl.focus();
          textareaEl.setSelectionRange(draftText.length, draftText.length);
        }
      }, 120);
    }
  });

  function handleInput(e: Event) {
    if (!discardSpaces) return;
    const target = e.target as HTMLTextAreaElement;
    const raw = target.value;
    const clean = raw.replace(/\s+/g, '');
    if (clean !== raw) {
      const pos = target.selectionStart
        ? Math.max(0, target.selectionStart - (raw.length - clean.length))
        : clean.length;
      draftText = clean;
      target.value = clean;
      target.setSelectionRange(pos, pos);
    }
  }

  function handleBeforeInput(e: InputEvent) {
    if (!discardSpaces) return;
    // Intercept mobile OS auto-spacing after dot or user space key
    if (e.data === ' ') {
      e.preventDefault();
      return;
    }
    if (e.data && e.data.includes(' ')) {
      e.preventDefault();
      const cleanData = e.data.replace(/\s+/g, '');
      if (cleanData && typeof document !== 'undefined') {
        document.execCommand('insertText', false, cleanData);
      }
    }
  }

  function handleQuickInsert(char: string) {
    settings.vibrate(20);
    if (!textareaEl) {
      draftText += char;
      return;
    }
    const start = textareaEl.selectionStart ?? draftText.length;
    const end = textareaEl.selectionEnd ?? draftText.length;
    draftText = draftText.slice(0, start) + char + draftText.slice(end);
    if (discardSpaces) {
      draftText = draftText.replace(/\s+/g, '');
    }
    const nextPos = start + char.length;
    setTimeout(() => {
      if (textareaEl) {
        textareaEl.focus();
        textareaEl.setSelectionRange(nextPos, nextPos);
      }
    }, 0);
  }

  function handleConfirm() {
    settings.vibrate(25);
    const finalVal = discardSpaces ? draftText.replace(/\s+/g, '') : draftText;
    onSave(finalVal);
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
        autocapitalize={autocapitalize ?? (discardSpaces ? 'none' : 'characters')}
        spellcheck="false"
        inputmode={inputmode ?? (discardSpaces ? 'search' : 'text')}
        oninput={handleInput}
        onbeforeinput={handleBeforeInput}
        rows={3}
      ></textarea>

      {#if draftText.length > 0}
        <div class="char-counter">
          {draftText.length} znaků
        </div>
      {/if}
    </div>

    {#if quickInsertChars && quickInsertChars.length > 0}
      <div class="quick-chars-bar">
        {#each quickInsertChars as char}
          <button
            type="button"
            class="quick-char-btn"
            onclick={() => handleQuickInsert(char)}
          >
            <span class="char-symbol font-mono">{char}</span>
            <span class="char-desc">{char === '.' ? '1 znak' : char === '*' ? 'libovolně' : ''}</span>
          </button>
        {/each}
      </div>
    {/if}

    {#if options}
      <div class="sheet-options-container">
        {@render options()}
      </div>
    {/if}

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

  .sheet-options-container {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 2px 0;
  }

  .textarea-wrapper {
    position: relative;
    width: 100%;
  }

  .quick-chars-bar {
    display: flex;
    gap: var(--space-xs);
    width: 100%;
  }

  .quick-char-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 36px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs);
    cursor: pointer;
    padding: 0 8px;
    transition: background-color 0.12s ease, border-color 0.12s ease, transform 0.08s ease;
  }

  .quick-char-btn:active {
    background-color: var(--color-surface-active);
    transform: scale(0.97);
  }

  .char-symbol {
    color: var(--color-accent-primary);
    font-size: calc(16px * var(--font-scale));
    font-weight: 800;
    line-height: 1;
  }

  .char-desc {
    color: var(--color-text-secondary);
    font-size: calc(11px * var(--font-scale));
    font-weight: 500;
  }

  .entry-textarea {
    width: 100%;
    min-height: 64px;
    height: clamp(64px, 20dvh, 120px);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: calc(14px * var(--font-scale));
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
    font-size: calc(11px * var(--font-scale));
    font-family: var(--font-mono);
    color: var(--color-text-muted);
    pointer-events: none;
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
