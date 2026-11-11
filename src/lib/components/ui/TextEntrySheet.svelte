<script lang="ts">
  import BottomSheet from './BottomSheet.svelte';
  import HoldToAction from './HoldToAction.svelte';
  import { settings } from '../../state/settings.svelte';
  import { pasteFromClipboard, copyToClipboard } from '../../utils/clipboard';
  import { TextT, Check, ClipboardText, Copy } from 'phosphor-svelte';

  interface Props {
    open: boolean;
    title: string;
    value: string;
    placeholder?: string;
    icon?: any;
    quickInsertChars?: string[];
    discardSpaces?: boolean;
    autocapitalize?: 'none' | 'characters' | 'words' | 'sentences' | 'off' | 'on';
    inputmode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
    /** Podklad tools under the textarea (DESIGN_SYSTEM §3 Podklad). */
    paste?: boolean;
    clearable?: boolean;
    copyable?: boolean;
    onSave: (val: string) => void;
    onClose: () => void;
  }

  let {
    open = false,
    title = 'Zadání textu',
    value = '',
    placeholder = 'Zadejte nebo vložte text…',
    icon = TextT,
    quickInsertChars = [],
    discardSpaces = false,
    autocapitalize,
    inputmode,
    paste = false,
    clearable = false,
    copyable = false,
    onSave,
    onClose
  }: Props = $props();

  let draftText = $state('');
  let openedValue = '';
  let textareaEl = $state<HTMLTextAreaElement | null>(null);

  const hasTools = $derived(paste || clearable || copyable);

  $effect(() => {
    if (open) {
      // Read only props here: tracking draftText would reset the draft on every keystroke
      const initial = discardSpaces ? value.replace(/\s+/g, '') : value;
      draftText = initial;
      openedValue = initial;
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

  function insertAtCursor(text: string) {
    if (!textareaEl) {
      draftText += text;
      return;
    }
    const start = textareaEl.selectionStart ?? draftText.length;
    const end = textareaEl.selectionEnd ?? draftText.length;
    draftText = draftText.slice(0, start) + text + draftText.slice(end);
    if (discardSpaces) {
      draftText = draftText.replace(/\s+/g, '');
    }
    const nextPos = Math.min(start + text.length, draftText.length);
    setTimeout(() => {
      if (textareaEl) {
        textareaEl.focus();
        textareaEl.setSelectionRange(nextPos, nextPos);
      }
    }, 0);
  }

  function handleQuickInsert(char: string) {
    settings.vibrate(20);
    insertAtCursor(char);
  }

  async function handlePaste() {
    settings.vibrate(20);
    const text = await pasteFromClipboard();
    if (text) insertAtCursor(text);
  }

  function handleCopy() {
    settings.vibrate(20);
    copyToClipboard(draftText);
  }

  function handleClear() {
    draftText = '';
    textareaEl?.focus();
  }

  // Every way out keeps the text: Hotovo, swipe down, backdrop, ✕, Esc.
  function commitAndClose() {
    const finalVal = discardSpaces ? draftText.replace(/\s+/g, '') : draftText;
    if (finalVal !== openedValue) onSave(finalVal);
    onClose();
  }

  function handleConfirm() {
    settings.vibrate(25);
    commitAndClose();
  }
</script>

<BottomSheet
  {open}
  {title}
  {icon}
  maxHeight="92dvh"
  onClose={commitAndClose}
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

    {#if hasTools}
      <div class="tools-bar">
        {#if paste}
          <button type="button" class="tool-btn" onclick={handlePaste}>
            <ClipboardText size={18} weight="bold" />
            <span>Vložit</span>
          </button>
        {/if}
        {#if copyable}
          <button type="button" class="tool-btn" onclick={handleCopy} disabled={!draftText}>
            <span class="tool-btn-inner">
              <Copy size={18} weight="bold" />
              <span>Kopírovat</span>
            </span>
          </button>
        {/if}
        {#if clearable}
          <div class="tool-clear">
            <HoldToAction
              variant="icon-only"
              disabled={!draftText}
              onAction={handleClear}
              ariaLabel="Podržte pro smazání textu"
              tapWarning="Podržte pro smazání"
            />
          </div>
        {/if}
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

  .textarea-wrapper {
    position: relative;
    width: 100%;
  }

  .quick-chars-bar,
  .tools-bar {
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
    font-size: 19px;
    font-weight: 800;
    line-height: 1;
  }

  .char-desc {
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 500;
  }

  .tool-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    height: 36px;
    padding: 0 var(--space-sm);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: var(--text-sm);
    font-weight: 700;
    transition: background-color 0.12s ease;
  }

  .tool-btn:active:not(:disabled) {
    background-color: var(--color-surface-active);
  }

  /* Disabled keeps the surface, only the content dims */
  .tool-btn-inner {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .tool-btn:disabled .tool-btn-inner {
    opacity: 0.48;
  }

  .tool-clear {
    flex: 0 0 36px;
    display: flex;
  }

  .entry-textarea {
    width: 100%;
    min-height: 64px;
    height: clamp(64px, 20dvh, 120px);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: 17px;
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
    font-size: 13px;
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
