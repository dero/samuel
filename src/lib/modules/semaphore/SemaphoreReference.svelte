<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import RefSection from '../../components/reference/RefSection.svelte';
  import type { RefHelpData } from '../../components/reference/refTypes';
  import { SEMAPHORE_ENTRIES, SEMAPHORE_DIRECTIONS, type SemaphoreEntry } from './semaphoreData';

  // 8 positions on 48x48 SVG
  // center = (24, 24), radius = 17
  const SVG_POINTS = SEMAPHORE_DIRECTIONS.map((dir) => ({
    index: dir.index,
    x: +(24 + 17 * dir.dx).toFixed(2),
    y: +(24 + 17 * dir.dy).toFixed(2)
  }));

  const lettersList = SEMAPHORE_ENTRIES
    .filter((e) => e.char.length === 1 && e.char >= 'A' && e.char <= 'Z')
    .sort((a, b) => a.char.localeCompare(b.char));

  // Mode switches side by side: `#` to numerals, `J` back to letters (J doubles as the letter), then Omyl.
  const SPECIALS: { char: string; label: string; name: string }[] = [
    { char: '#', label: '#', name: 'Přepnutí na číslice' },
    { char: 'J', label: 'J', name: 'Zpět na písmena' },
    { char: 'CANCEL', label: '✕', name: 'Omyl' }
  ];
  const specialList = SPECIALS.map((s) => ({
    ...s,
    entry: SEMAPHORE_ENTRIES.find((e) => e.char === s.char)!
  }));

  const help: RefHelpData = {
    controls: [
      ['Volič', '2 pozice klepnutím, nebo jedním tahem'],
      ['Prostřední tlačítko', 'mezera'],
      ['Backspace', 'nejdřív zruší vybraná ramena, pak maže text'],
      ['Okamžité vkládání', 'v menu: vypnuté = znak potvrdit tlačítkem'],
      ['`#`', 'další písmena A–I, K se čtou jako číslice. Ve výstupu svítí `#`.'],
      ['`J` po číslicích', 'zpět na písmena'],
      ['Omyl', 'smaže předchozí znak']
    ],
    pitfalls: [
      ['Zrcadlově', 'reference je z pohledu příjemce. Zadání ze zad signalisty → menu Pohled vysílajícího.'],
      ['Číslice bez `#`', 'zadat nejdřív signál `#`']
    ]
  };
</script>

{#snippet diagram(entry: SemaphoreEntry, special: boolean)}
  <svg class="mini-diagram" viewBox="0 0 48 48" aria-hidden="true">
    {#each SVG_POINTS as pt (pt.index)}
      {#if !entry.pair.includes(pt.index)}
        <circle cx={pt.x} cy={pt.y} r="2" class="dot-inactive" />
      {/if}
    {/each}
    <circle cx="24" cy="24" r="3" class="dot-center" />
    {#each entry.pair as armIdx (armIdx)}
      {@const pt = SVG_POINTS[armIdx]}
      <line x1="24" y1="24" x2={pt.x} y2={pt.y} class="arm-active" class:special-arm={special} />
      <circle cx={pt.x} cy={pt.y} r="4" class="dot-active" class:special-dot={special} />
    {/each}
  </svg>
{/snippet}

<RefLayout tabs={[{ id: 'chars', label: 'Znaky' }]} {help}>
  {#snippet content()}
    <RefSection title="Písmena a číslice" note="Číslo za lomítkem platí po signálu `#`, až do `J`.">
      <div class="ref-grid">
        {#each lettersList as entry (entry.key)}
          <div class="ref-card">
            <div class="card-text">
              <span class="card-char">{entry.char}</span>
              {#if entry.digit}
                <span class="card-digit">/{entry.digit}</span>
              {/if}
            </div>
            {@render diagram(entry, false)}
          </div>
        {/each}
      </div>
    </RefSection>

    <RefSection title="Speciální">
      <div class="ref-grid">
        {#each specialList as { entry, label, name } (entry.key)}
          <div class="ref-card ref-card-special">
            <div class="card-text">
              <span class="card-char special-char">{label}</span>
              <span class="special-name">{name}</span>
            </div>
            {@render diagram(entry, true)}
          </div>
        {/each}
      </div>
    </RefSection>
  {/snippet}
</RefLayout>

<style>
  .ref-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
    gap: var(--space-sm);
  }

  @media (min-width: 480px) {
    .ref-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .ref-card {
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    padding: 8px 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    box-sizing: border-box;
  }

  .ref-card-special {
    grid-column: span 2;
  }

  .card-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .card-char {
    font-family: var(--font-condensed);
    font-size: var(--text-xl);
    font-weight: 900;
    color: #ffffff;
    line-height: 1.1;
  }

  .card-digit {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-text-secondary);
  }

  .special-char {
    font-size: 16px;
    color: var(--color-accent-warning);
  }

  .special-name {
    font-size: var(--text-2xs);
    color: var(--color-text-muted);
    line-height: 1.2;
    margin-top: 2px;
  }

  .mini-diagram {
    width: 38px;
    height: 38px;
    flex-shrink: 0;
  }

  .dot-inactive {
    fill: rgba(255, 255, 255, 0.15);
  }

  .dot-center {
    fill: #ffffff;
  }

  .arm-active {
    stroke: var(--color-accent-primary);
    stroke-width: 3;
    stroke-linecap: round;
  }

  .dot-active {
    fill: var(--color-accent-primary);
  }

  .special-arm {
    stroke: var(--color-accent-warning);
  }

  .special-dot {
    fill: var(--color-accent-warning);
  }

</style>
