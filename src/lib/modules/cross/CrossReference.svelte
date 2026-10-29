<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import RefList from '../../components/reference/RefList.svelte';
  import RefSection from '../../components/reference/RefSection.svelte';
  import type { RefHelpData, RefTool } from '../../components/reference/refTypes';
  import type { CrossType } from './crossData';

  interface Props {
    /** Letters of the alphabet selected for the large cross. */
    largeLetters: string[];
    /** Letters of the alphabet selected for Pigpen. */
    pigpenLetters: string[];
    /** Cross currently active in the module (opens its help). */
    activeTool: CrossType;
  }

  let { largeLetters, pigpenLetters, activeTool }: Props = $props();

  // Cell outline as seen in the cipher, row by row (top-left cell is closed right and bottom).
  const SHAPES = ['┘', '┴', '└', '┤', '┼', '├', '┐', '┬', '┌'];

  const largeCells = $derived(
    SHAPES.map((shape, cell) => ({
      shape,
      letters: [0, 1, 2].map((dot) => {
        const idx = cell * 3 + dot;
        // 26-letter alphabet: the 27th slot is a space (see crossSolver)
        if (largeLetters.length === 26 && idx === 26) return '␣';
        return largeLetters[idx] ?? '–';
      })
    }))
  );

  const pig = (from: number, to: number) => pigpenLetters.slice(from, to);

  const tools: RefTool<CrossType>[] = [
    {
      id: 'large-polish',
      label: 'Velký',
      help: {
        controls: [
          ['Kříž', 'klepnutí na písmeno ho vloží'],
          ['Souřadnice', 'řádek, sloupec, počet teček, pak potvrdit']
        ],
        pitfalls: [
          ['26 písmen', 'poslední pole (`┌` •••) je mezera'],
          ['Abeceda s CH', 'výchozí (27 znaků), všechna písmena za H se posunou']
        ]
      }
    },
    {
      id: 'small-polish',
      label: 'Pigpen',
      help: {
        controls: [['Kříž', 'klepnutí na písmeno ho vloží, i s tečkou']],
        pitfalls: [['CH', 'jen 26 znaků, CH se píše jako C + H']]
      }
    }
  ];

  const help: RefHelpData = {
    controls: [
      ['Velký / Pigpen', 'lišta nad klávesnicí'],
      ['Abeceda', 'v menu, pro každý kříž zvlášť']
    ],
    pitfalls: [['Jiné rozložení', 'existují varianty s jiným pořadím písmen → vlastní abeceda v menu']]
  };
</script>

<RefLayout tabs={[{ id: 'shapes', label: 'Tvary' }]} {help} {tools} {activeTool}>
  {#snippet content()}
    <RefSection title="Velký polský kříž" note="Tvar = chlívek, počet teček = pořadí písmene v něm.">
      <div class="shape-grid">
        {#each largeCells as cell (cell.shape)}
          <div class="shape-cell">
            <span class="shape-icon">{cell.shape}</span>
            <span class="shape-letters">
              {#each cell.letters as letter, i (i)}
                <span class="shape-letter"><span class="dots">{'•'.repeat(i + 1)}</span>{letter}</span>
              {/each}
            </span>
          </div>
        {/each}
      </div>
    </RefSection>

    <RefSection title="Pigpen (malý kříž)">
      <RefList
        items={[
          ['Mřížka #', pig(0, 9).join(' ')],
          ['Mřížka # s tečkou', pig(9, 18).join(' ')],
          ['Kříž X', `${pig(18, 19)} nahoře, ${pig(19, 20)} vlevo, ${pig(20, 21)} vpravo, ${pig(21, 22)} dole`],
          ['Kříž X s tečkou', `${pig(22, 23)} nahoře, ${pig(23, 24)} vlevo, ${pig(24, 25)} vpravo, ${pig(25, 26)} dole`]
        ]}
      />
    </RefSection>
  {/snippet}
</RefLayout>

<style>
  .shape-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }

  .shape-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: var(--space-xs);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs);
  }

  .shape-icon {
    font-family: var(--font-mono);
    font-size: calc(22px * var(--font-scale));
    line-height: 1.1;
    color: var(--color-accent-primary);
  }

  .shape-letters {
    display: flex;
    gap: 8px;
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .shape-letter {
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1.1;
  }

  .dots {
    font-size: calc(8px * var(--font-scale));
    letter-spacing: -1px;
    color: var(--color-text-muted);
  }
</style>
