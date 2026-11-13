<script lang="ts">
  import { untrack } from 'svelte';
  import { Check, Cube, Trash } from 'phosphor-svelte';
  import BottomSheet from '../../components/ui/BottomSheet.svelte';
  import type { CubeCellValue } from './cubeData';
  import { settings } from '../../state/settings.svelte';

  interface Props {
    open: boolean;
    coordLabel: string;
    initialValue: CubeCellValue;
    knownTags: string[];
    onSave: (value: CubeCellValue) => void;
    onClose: () => void;
  }

  let { open, coordLabel, initialValue, knownTags, onSave, onClose }: Props = $props();

  let charInput = $state('');
  let tagInput = $state('');

  $effect(() => {
    if (!open) return;
    untrack(() => {
      charInput = initialValue.char;
      tagInput = initialValue.tag ?? '';
    });
  });

  function submit() {
    settings.vibrate(25);
    const char = charInput.trim();
    const tag = tagInput.trim();
    onSave(tag ? { char, tag } : { char });
    onClose();
  }

  function clearCell() {
    settings.vibrate(20);
    onSave({ char: '' });
    onClose();
  }
</script>

<BottomSheet {open} title={coordLabel || 'Upravit uzel'} icon={Cube} {onClose}>
  <div class="cell-form">
    <label class="field">
      <span class="field-label">Znak</span>
      <input
        bind:value={charInput}
        class="field-input font-mono"
        type="text"
        maxlength={4}
        placeholder="Písmeno (prázdné = volný uzel)"
        autocomplete="off"
        autocapitalize="characters"
        spellcheck="false"
      />
    </label>

    <label class="field">
      <span class="field-label">2. příznak (volitelný)</span>
      <input
        bind:value={tagInput}
        class="field-input font-mono"
        type="text"
        maxlength={4}
        placeholder="Např. K, N, P nebo číslo"
        autocomplete="off"
        autocapitalize="characters"
        spellcheck="false"
      />
    </label>

    {#if knownTags.length > 0}
      <div class="tag-chips" role="group" aria-label="Použité příznaky">
        {#each knownTags as tag (tag)}
          <button
            type="button"
            class="tag-chip"
            class:is-active={tagInput.trim() === tag}
            onclick={() => {
              settings.vibrate(15);
              tagInput = tagInput.trim() === tag ? '' : tag;
            }}
          >
            {tag}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  {#snippet footer()}
    <div class="sheet-actions">
      <button type="button" class="action-btn is-clear" onclick={clearCell}>
        <Trash size={16} weight="bold" />
        <span>Vyprázdnit</span>
      </button>
      <button type="button" class="action-btn is-save" onclick={submit}>
        <Check size={16} weight="bold" />
        <span>Potvrdit</span>
      </button>
    </div>
  {/snippet}
</BottomSheet>

<style>
  .cell-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .field-label {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .field-input {
    width: 100%;
    padding: var(--space-sm) var(--space-md);
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: var(--text-base);
    box-sizing: border-box;
  }

  .field-input:focus {
    outline: none;
    border-color: var(--color-accent-primary);
  }

  .tag-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .tag-chip {
    min-height: var(--control-min-height);
    padding: 0 var(--space-md);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    font-weight: 700;
    cursor: pointer;
  }

  .tag-chip.is-active {
    border-color: var(--color-accent-warning);
    background-color: var(--color-accent-warning-subtle);
    color: var(--color-accent-warning);
  }

  .sheet-actions {
    display: flex;
    gap: var(--space-sm);
  }

  .action-btn {
    flex: 1;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    font-weight: 700;
    cursor: pointer;
  }

  .action-btn.is-clear {
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    color: var(--color-text-secondary);
  }

  .action-btn.is-save {
    background-color: var(--color-accent-primary);
    border: 1px solid var(--color-accent-primary);
    color: var(--color-text-inverse);
  }
</style>
