<script lang="ts">
  import { untrack } from 'svelte';
  import { TextAa, Check } from 'phosphor-svelte';
  import BottomSheet from './BottomSheet.svelte';
  import { settings } from '../../state/settings.svelte';
  import { parseAlphabetInput, formatAlphabetInput } from '../../utils/alphabetInput';

  const NAME_MAX_LENGTH = 40;

  interface Props {
    open: boolean;
    mode: 'create' | 'edit';
    initialName: string;
    initialLetters: string[];
    /** Name of the alphabet the letters were copied from (create mode). */
    sourceLabel?: string;
    onSave: (name: string, letters: string[]) => void;
    onClose: () => void;
  }

  let { open, mode, initialName, initialLetters, sourceLabel, onSave, onClose }: Props = $props();

  let name = $state('');
  let lettersText = $state('');
  let nameEl = $state<HTMLInputElement | null>(null);
  let lettersEl = $state<HTMLTextAreaElement | null>(null);

  $effect(() => {
    if (!open) return;
    untrack(() => {
      name = initialName;
      lettersText = formatAlphabetInput(initialLetters);
    });
    if (mode === 'create') {
      setTimeout(() => nameEl?.focus(), 120);
    }
  });

  const parsed = $derived(parseAlphabetInput(lettersText));
  const showLettersError = $derived(lettersText.trim().length > 0 && parsed.error !== null);
  const canSave = $derived(name.trim().length > 0 && parsed.error === null);

  function pluralLetters(n: number): string {
    if (n === 1) return 'znak';
    if (n >= 2 && n <= 4) return 'znaky';
    return 'znaků';
  }

  function handleClear() {
    settings.vibrate(20);
    lettersText = '';
    lettersEl?.focus();
  }

  function handleNameKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      lettersEl?.focus();
    }
  }

  function handleSave() {
    if (!canSave) return;
    settings.vibrate(25);
    onSave(name.trim(), parsed.letters);
    onClose();
  }
</script>

<BottomSheet
  {open}
  title={mode === 'create' ? 'Nová abeceda' : 'Upravit abecedu'}
  icon={TextAa}
  maxHeight="92dvh"
  {onClose}
>
  <div class="edit-form">
    <label class="field">
      <span class="field-label">Název</span>
      <input
        bind:this={nameEl}
        bind:value={name}
        class="field-input"
        type="text"
        maxlength={NAME_MAX_LENGTH}
        placeholder="Např. S heslem KOS"
        autocomplete="off"
        autocapitalize="sentences"
        spellcheck="false"
        enterkeyhint="next"
        onkeydown={handleNameKeydown}
      />
    </label>

    <div class="field">
      <div class="field-label-row">
        <label class="field-label" for="alphabet-letters">Znaky</label>
        {#if mode === 'create' && sourceLabel}
          <span class="source-label">Vychází z: {sourceLabel}</span>
        {/if}
      </div>
      <textarea
        id="alphabet-letters"
        bind:this={lettersEl}
        bind:value={lettersText}
        class="field-input letters-input font-mono"
        placeholder="A, B, C, CH, D, ..."
        autocomplete="off"
        autocapitalize="characters"
        spellcheck="false"
        rows={4}
      ></textarea>

      <div class="field-footer">
        <span class="letters-count">
          {parsed.letters.length} {pluralLetters(parsed.letters.length)}
        </span>
        {#if lettersText.length > 0}
          <button type="button" class="clear-btn" onclick={handleClear}>Vymazat</button>
        {/if}
      </div>

      {#if showLettersError}
        <div class="field-error" role="alert">{parsed.error}</div>
      {:else}
        <p class="field-hint">
          Znaky oddělte čárkou, pořadí určuje číslování. Víceznakové položky (např. CH) jsou
          povolené, duplicity ne.
        </p>
      {/if}
    </div>

    <button type="button" class="save-btn" disabled={!canSave} onclick={handleSave}>
      <span class="save-inner">
        <Check size={18} weight="bold" />
        <span>Uložit</span>
      </span>
    </button>
  </div>
</BottomSheet>

<style>
  .edit-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    width: 100%;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field-label-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-sm);
  }

  .field-label {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .source-label {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .field-input {
    width: 100%;
    box-sizing: border-box;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font: inherit;
    font-size: calc(14px * var(--font-scale));
    font-weight: 600;
    line-height: 1.35;
    padding: 10px 12px;
    outline: none;
    transition: border-color 0.12s ease;
  }

  .field-input:focus {
    border-color: var(--color-border-focus);
    box-shadow: 0 0 10px rgba(0, 210, 255, 0.2);
  }

  .field-input::placeholder {
    color: var(--color-text-muted);
    font-weight: 400;
  }

  .letters-input {
    min-height: 96px;
    resize: none;
  }

  .field-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 24px;
  }

  .letters-count {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  .clear-btn {
    padding: 2px 8px;
    background: none;
    border: none;
    font: inherit;
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-accent-primary);
    cursor: pointer;
  }

  .field-hint {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    line-height: 1.4;
  }

  .field-error {
    font-size: var(--text-xs);
    line-height: 1.4;
    color: var(--color-accent-danger);
    background-color: var(--color-accent-danger-subtle);
    border-radius: var(--radius-xs);
    padding: 6px 10px;
  }

  .save-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: var(--tap-min-size);
    background-color: var(--color-accent-primary);
    color: #000000;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    font: inherit;
    font-size: var(--text-sm);
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0, 210, 255, 0.3);
    transition: transform 0.08s ease;
  }

  .save-btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  /* Disabled: the surface keeps full colour, only the inner content is dimmed. */
  .save-btn:disabled {
    background-color: var(--color-surface-2);
    border-color: var(--color-border-subtle);
    color: var(--color-text-primary);
    box-shadow: none;
    cursor: not-allowed;
  }

  .save-inner {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .save-btn:disabled .save-inner {
    opacity: 0.48;
  }
</style>
