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
    purpose: [
      'Semafor je praporková abeceda: znak tvoří dvě ramena s praporky v osmi možných polohách. Nástroj převede polohy ramen na text a pod každým znakem ukáže čísla obou ramen.'
    ],
    howTo: [
      'Na kruhu zvolte polohy obou ramen tak, jak signalistu vidíte. Po prvním rameni ukážou ostatní polohy, jaký znak by s ním vznikl. Signál `#` přepne na číslice (A–I a K jsou `1`–`9` a `0`), signál J vrátí písmena; mezitím lišta ukazuje „Číslice, zpět signálem J“.'
    ],
    example: {
      title: 'Příklad: AHOJ',
      steps: [
        { action: 'Klepněte na spodní polohu kruhu.', result: 'Rameno svítí a ostatní polohy ukazují, co by s ním vzniklo: vlevo dole je A.' },
        { action: 'Klepněte na polohu vlevo dole.', result: 'A se hned vloží, ve výstupu je A a pod ním `12`.' },
        { action: 'Táhněte prstem z polohy vlevo dole na polohu vlevo.', result: 'Přibude H s čísly `23`.' },
        { action: 'Klepněte na polohy vlevo a vlevo nahoře, pak nahoře a vpravo.', result: 'Výstup ukazuje AHOJ. Na záložce Podklad je totéž jako `12,23,34,57`.' }
      ]
    },
    controls: [
      ['Kruh poloh', 'Klepněte na polohy obou ramen, nebo je spojte jedním tahem přes střed. Klepnutí na zvolenou polohu ji zruší.'],
      ['Mezera (uprostřed dole)', 'Vloží mezeru. Při vypnutém Okamžitém vkládání ukazuje zvolený znak a klepnutím ho vloží.'],
      ['Zpět (vpravo dole)', 'Zruší zvolená ramena (ukazuje ✕), jinak smaže poslední signál.'],
      ['Koš (vlevo dole)', 'Podržením smaže celý zápis.'],
      ['Záložka Podklad', 'Celý zápis jako dvojice čísel ramen: `1` je dole, dál po směru hodinových ručiček až `8` vpravo dole. Čárka dělí znaky, prázdné pole je mezera, pořadí ve dvojici nerozhoduje.'],
      ['Menu → Okamžité vkládání', 'Zapnuté (výchozí) vloží znak hned po druhém rameni. Vypnuté čeká na prostřední klávesu.'],
      ['Menu → Pohled vysílajícího', 'Prohodí levou a pravou stranu. Zapnutou volbu připomíná tečka na záložce Menu.']
    ],
    pitfalls: [
      ['Vidíte signalistu zezadu, nebo zadání popisuje jeho pravou a levou ruku?', 'Zapněte Menu → Pohled vysílajícího. Kruh i tahák ukazují signalistu tak, jak ho vidí příjemce.'],
      ['Místo číslic vychází písmena?', 'V šifře chybí signál `#` (nahoře a vpravo nahoře). Doplňte ho na záložce Podklad před číslice, ve výchozím pohledu je to `56`.'],
      ['Písmena za číslem vycházejí jako číslice?', 'Chybí signál J (nahoře a vpravo), který číslice ukončí; mezera je neukončí. Doplňte ho na záložce Podklad za poslední číslici, ve výchozím pohledu je to `57`.'],
      ['Ve výstupu je přeškrtnutý znak?', 'Šifra obsahuje signál Omyl (vpravo dole a vlevo nahoře), který ruší předchozí znak. Přeškrtnutý znak do textu nepatří.']
    ]
  };
</script>

{#snippet diagram(entry: SemaphoreEntry)}
  <svg class="mini-diagram" viewBox="0 0 48 48" aria-hidden="true">
    {#each SVG_POINTS as pt (pt.index)}
      {#if !entry.pair.includes(pt.index)}
        <circle cx={pt.x} cy={pt.y} r="2" class="dot-inactive" />
      {/if}
    {/each}
    <circle cx="24" cy="24" r="3" class="dot-center" />
    {#each entry.pair as armIdx (armIdx)}
      {@const pt = SVG_POINTS[armIdx]}
      <line x1="24" y1="24" x2={pt.x} y2={pt.y} class="arm-active" />
      <circle cx={pt.x} cy={pt.y} r="4" class="dot-active" />
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
            {@render diagram(entry)}
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
            {@render diagram(entry)}
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
    color: var(--color-text-primary);
    line-height: 1.1;
  }

  .card-digit {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text-secondary);
  }

  .special-char {
    font-size: var(--text-base);
  }

  .special-name {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: 1.2;
    margin-top: 2px;
  }

  .mini-diagram {
    width: 38px;
    height: 38px;
    flex-shrink: 0;
  }

  .dot-inactive {
    fill: var(--color-border-subtle);
  }

  .dot-center {
    fill: var(--color-text-primary);
  }

  .arm-active {
    stroke: var(--color-accent-primary);
    stroke-width: 3;
    stroke-linecap: round;
  }

  .dot-active {
    fill: var(--color-accent-primary);
  }
</style>
