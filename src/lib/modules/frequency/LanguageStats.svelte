<script lang="ts">
  import RefSection from '../../components/reference/RefSection.svelte';
  import LetterFrequencyTable from './LetterFrequencyTable.svelte';
  import {
    CZECH_27_UNACCENTED_FREQUENCIES,
    ENGLISH_26_FREQUENCIES,
    CZECH_ONE_LETTER_WORDS,
    CZECH_TWO_LETTER_WORDS,
    CZECH_DOUBLE_LETTERS,
    CZECH_VOWELS
  } from './frequencyData';

  /** Shared language statistics for the Frekvence and Substituce references. */
  interface Props {
    view: 'freq' | 'words';
  }

  let { view }: Props = $props();

  const vowels = CZECH_VOWELS.map((v) => [v, CZECH_27_UNACCENTED_FREQUENCIES[v]] as const).sort(
    (a, b) => b[1] - a[1]
  );
  const vowelShare = Math.round(vowels.reduce((sum, [, pct]) => sum + pct, 0));
</script>

{#snippet pills(items: readonly string[])}
  <div class="pill-list">
    {#each items as item (item)}
      <span class="pill">{item}</span>
    {/each}
  </div>
{/snippet}

{#if view === 'freq'}
  <RefSection title="Čeština" note="Bez diakritiky, CH jako samostatný znak.">
    <LetterFrequencyTable frequencies={CZECH_27_UNACCENTED_FREQUENCIES} />
  </RefSection>

  <RefSection title="Samohlásky" note="Cca {vowelShare} % textu, střídají se se souhláskami.">
    <div class="pill-list">
      {#each vowels as [v, pct] (v)}
        <span class="pill">{v} <span class="pill-sub">{pct.toFixed(1)} %</span></span>
      {/each}
    </div>
  </RefSection>

  <RefSection title="Angličtina">
    <LetterFrequencyTable frequencies={ENGLISH_26_FREQUENCIES} />
  </RefSection>
{:else}
  <RefSection title="Jednopísmenná slova" note="Seřazeno podle četnosti.">
    {@render pills(CZECH_ONE_LETTER_WORDS)}
  </RefSection>

  <RefSection title="Dvoupísmenná slova">
    {@render pills(CZECH_TWO_LETTER_WORDS)}
  </RefSection>

  <RefSection title="Zdvojená písmena" note="Vzácná. `NN` nejčastěji, `II` z koncovky -ií.">
    {@render pills(CZECH_DOUBLE_LETTERS)}
  </RefSection>
{/if}

<style>
  .pill-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .pill {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    min-width: 32px;
    justify-content: center;
    padding: 5px 8px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .pill-sub {
    font-size: var(--text-xs);
    font-weight: 400;
    color: var(--color-text-muted);
  }
</style>
