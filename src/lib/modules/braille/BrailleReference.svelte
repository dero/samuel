<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import RefSection from '../../components/reference/RefSection.svelte';
  import type { RefHelpData } from '../../components/reference/refTypes';
  import {
    BRAILLE_LETTERS,
    BRAILLE_CZECH_DIACRITICS,
    BRAILLE_DIGITS,
    BRAILLE_PREFIXES,
    BRAILLE_PUNCTUATION
  } from './brailleData';

  const sections = [
    { title: 'Abeceda', note: 'Body: levý sloupec `1` `2` `3`, pravý `4` `5` `6`.', items: BRAILLE_LETTERS },
    { title: 'Diakritika', note: undefined, items: BRAILLE_CZECH_DIACRITICS },
    { title: 'Číslice', note: 'Prefix `⠼` + tvar A–J.', items: BRAILLE_DIGITS },
    { title: 'Prefixy a znaky', note: undefined, items: [...BRAILLE_PREFIXES, ...BRAILLE_PUNCTUATION] }
  ];

  const help: RefHelpData = {
    controls: [
      ['Klepnutí nebo tah', 'zapne body, další klepnutí bod vypne'],
      ['Prostřední tlačítko', 'potvrdí znak, bez bodů vloží mezeru'],
      ['Backspace', 'nejdřív zruší vybrané body, pak maže text'],
      ['Okamžité vkládání', 'v menu: znak se vloží hned po tahu']
    ],
    pitfalls: [
      ['Číslice', 'tvar A–J za prefixem `⠼` (3456), platí do mezery'],
      ['Číslice bez prefixu', 'v zadání chybí `⠼` → menu Čísla bez prefixu'],
      ['W a Ř', 'české W = 12356, mezinárodní W (2456) je česky Ř → menu Česká diakritika'],
      ['Ražba ze zadní strany', 'sloupce jsou zrcadlově: `1`↔`4`, `2`↔`5`, `3`↔`6`']
    ]
  };
</script>

<RefLayout tabs={[{ id: 'chars', label: 'Znaky' }]} {help}>
  {#snippet content()}
    {#each sections as sec (sec.title)}
      <RefSection title={sec.title} note={sec.note}>
        <div class="entries-grid">
          {#each sec.items as entry (entry.char)}
            <div class="symbol-card" title="{entry.char} – body: {entry.dots.join(', ')}">
              <span class="symbol-char">{entry.char}</span>
              <div class="dot-matrix" aria-hidden="true">
                <div class="dot" class:is-on={entry.dots.includes(1)}></div>
                <div class="dot" class:is-on={entry.dots.includes(4)}></div>
                <div class="dot" class:is-on={entry.dots.includes(2)}></div>
                <div class="dot" class:is-on={entry.dots.includes(5)}></div>
                <div class="dot" class:is-on={entry.dots.includes(3)}></div>
                <div class="dot" class:is-on={entry.dots.includes(6)}></div>
              </div>
            </div>
          {/each}
        </div>
      </RefSection>
    {/each}
  {/snippet}
</RefLayout>

<style>


  /* 3 to 4 items on width */
  .entries-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
    gap: 6px;
  }

  .symbol-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 8px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    gap: 8px;
    user-select: none;
  }

  .symbol-char {
    font-family: var(--font-condensed);
    font-size: calc(20px * var(--font-scale));
    font-weight: 800;
    color: #ffffff;
    line-height: 1;
    flex: 1;
    text-align: center;
  }

  .dot-matrix {
    display: grid;
    grid-template-columns: repeat(2, 7px);
    grid-template-rows: repeat(3, 7px);
    gap: 3px;
    padding: 3px;
    background-color: var(--color-surface-2);
    border-radius: 3px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    flex-shrink: 0;
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.12);
  }

  .dot.is-on {
    background-color: var(--color-accent-primary);
    box-shadow: 0 0 4px var(--color-accent-primary);
  }

</style>
