<script lang="ts">
  import { Backspace, MagnifyingGlass } from 'phosphor-svelte';
  import Chassis from './Chassis.svelte';
  import Keycap from './Keycap.svelte';
  import HoldToAction from './HoldToAction.svelte';

  /**
   * In-app QWERTY for search fields of Přehled modules (Fakta, Chemie), so the OS keyboard
   * never covers the results. Clearing the whole query is a hold, deleting a character a tap.
   * 20-column grid: a letter spans 2, the half-key offsets of row 2 span 1, clear and backspace 3.
   */
  interface Props {
    hasInput?: boolean;
    includeNumbers?: boolean;
    onChar: (char: string) => void;
    onBackspace: () => void;
    onClear: () => void;
    /** The typed query, shown in a flat read-only line above the keys (the keys type it, not the OS). */
    query?: string;
    placeholder?: string;
    class?: string;
  }

  let {
    hasInput = false,
    includeNumbers = false,
    onChar,
    onBackspace,
    onClear,
    query,
    placeholder = 'Hledat…',
    class: customClass = ''
  }: Props = $props();

  const ROW_NUM = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const ROW_1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
  const ROW_2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
  const ROW_3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];
</script>

{#if query !== undefined}
  <div class="kb-query" aria-live="polite">
    <MagnifyingGlass size={16} weight="bold" />
    {#if query}
      <span class="kb-query-text">{query}</span><span class="kb-caret" aria-hidden="true"></span>
    {:else}
      <span class="kb-query-placeholder">{placeholder}</span>
    {/if}
  </div>
{/if}

<Chassis columns={20} keyHeight="42px" class="simple-keyboard {customClass}">
  {#if includeNumbers}
    {#each ROW_NUM as num (num)}
      <Keycap class="kb-key" label={num} ariaLabel="Klávesa {num}" onPress={() => onChar(num)} />
    {/each}
  {/if}

  {#each ROW_1 as char (char)}
    <Keycap class="kb-key" label={char} ariaLabel="Klávesa {char}" onPress={() => onChar(char)} />
  {/each}

  <div class="kb-offset" aria-hidden="true"></div>
  {#each ROW_2 as char (char)}
    <Keycap class="kb-key" label={char} ariaLabel="Klávesa {char}" onPress={() => onChar(char)} />
  {/each}
  <div class="kb-offset" aria-hidden="true"></div>

  <div class="kb-clear">
    <HoldToAction disabled={!hasInput} onAction={onClear} ariaLabel="Vymazat hledání podržením" />
  </div>
  {#each ROW_3 as char (char)}
    <Keycap class="kb-key" label={char} ariaLabel="Klávesa {char}" onPress={() => onChar(char)} />
  {/each}
  <Keycap
    class="kb-wide"
    ariaLabel="Smazat poslední znak"
    title="Smazat poslední znak"
    disabled={!hasInput}
    onPress={onBackspace}
  >
    <Backspace size={18} weight="bold" />
  </Keycap>
</Chassis>

<style>
  .kb-query {
    flex: none;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    height: var(--subtoolbar-height);
    padding: 0 var(--space-sm);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    box-sizing: border-box;
    overflow: hidden;
  }

  .kb-query-text {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    direction: rtl;
    font-family: var(--font-mono);
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text-primary);
  }

  /* Marks where the next key goes */
  .kb-caret {
    flex: none;
    width: 2px;
    height: 1.1em;
    margin-left: -6px;
    background-color: var(--color-accent-primary);
  }

  .kb-query-placeholder {
    font-size: var(--text-sm);
  }

  /* Keycap and Chassis render the elements, so the placement has to reach into them */
  :global(.chassis.simple-keyboard .kb-key) {
    grid-column: span 2;
  }

  :global(.chassis.simple-keyboard .kb-wide) {
    grid-column: span 3;
  }

  .kb-offset {
    grid-column: span 1;
  }

  .kb-clear {
    grid-column: span 3;
    display: flex;
    min-width: 0;
    height: 42px;
  }

  /* The hold button takes the key's place and shape */
  .kb-clear > :global(*) {
    flex: 1;
    width: 100%;
    height: 100% !important;
    min-height: 0 !important;
    border: none !important;
    border-radius: 2px !important;
  }
</style>
