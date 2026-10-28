<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import RefList from '../../components/reference/RefList.svelte';
  import RefSection from '../../components/reference/RefSection.svelte';
  import type { RefHelpData, RefTab, RefTool } from '../../components/reference/refTypes';
  import type { ShiftType } from './shiftsData';

  interface Props {
    letters: string[];
    /** Cipher currently active in the module (opens its help). */
    activeTool: ShiftType;
  }

  let { letters, activeTool }: Props = $props();

  type ShiftsRefTab = 'table' | 'rules';

  const tabs: RefTab<ShiftsRefTab>[] = [
    { id: 'table', label: 'Tabula recta' },
    { id: 'rules', label: 'Vzorce' }
  ];

  const tools: RefTool<ShiftType>[] = [
    {
      id: 'caesar',
      label: 'Cézar',
      help: {
        controls: [
          ['Výsledek', 'všechny posuny, nejpravděpodobnější zvýrazněný. Klepnutí zkopíruje.'],
          ['Zvýraznit nejlepší posun', 'v menu']
        ],
        pitfalls: [['Nejlepší posun', 'odhad podle češtiny, u krátkého textu nespolehlivý']]
      }
    },
    {
      id: 'vigenere',
      label: 'Vigenère',
      help: {
        controls: [['Klíč', 'řádek klíče: heslo nebo čísla']],
        pitfalls: [
          ['Klíč `A` = posun 0', 'počítá-li zadání A = 1, posunout klíč o jedno písmeno'],
          ['Posun nad 9', 'čísla oddělit mezerou: `12 5`. Bez mezer `314` = 3, 1, 4.']
        ]
      }
    },
    {
      id: 'autokey',
      label: 'Autokey',
      help: {
        controls: [
          ['Heslo', 'počáteční klíč, dál pokračuje textem zprávy'],
          ['Pruh Klíč', 'ukáže průběh klíče']
        ],
        pitfalls: [
          ['Varianta', 'jen otevřený text jako klíč, ne šifrový'],
          ['Heslo `A` = posun 0', 'počítá-li zadání A = 1, posunout heslo o jedno písmeno']
        ]
      }
    }
  ];

  const help: RefHelpData = {
    controls: [
      ['Cézar / Vigenère / Autokey', 'lišta nad zadáním'],
      ['Text', 'řádek dole otevře editor'],
      ['Zachovat mezery a interpunkci', 'v menu']
    ],
    pitfalls: [['Abeceda s CH', 'posuny v 27 znacích dávají jiný výsledek → menu Abeceda']]
  };
</script>

<RefLayout {tabs} {help} {tools} {activeTool}>
  {#snippet content(tab)}
    {#if tab === 'table'}
      <RefSection
        title="Tabula recta"
        note="Řádek = písmeno klíče, sloupec = písmeno textu, průsečík = šifra."
      >
        <div class="ref-table-wrap">
          <table class="tabula-recta">
            <thead>
              <tr>
                <th class="corner-th"></th>
                {#each letters as l, i (i)}
                  <th>{l}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each letters as rowL, rowIdx (rowIdx)}
                <tr>
                  <th class="row-th">{rowL}</th>
                  {#each letters as _, colIdx (colIdx)}
                    <td>{letters[(rowIdx + colIdx) % letters.length]}</td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </RefSection>
    {:else}
      <RefSection title="Cézar" note="Stejný posun `k` pro všechna písmena, `N` = délka abecedy.">
        <RefList
          items={[
            ['Šifrování', '`C = (P + k) mod N`'],
            ['Dešifrování', '`P = (C − k) mod N`'],
            ['Posun zpět', '`−k` = `+(N − k)`'],
            ['ROT13', 'posun 13 v 26 písmenech, tam i zpět stejně']
          ]}
        />
      </RefSection>

      <RefSection title="Vigenère" note="Posun se mění podle písmen opakovaného hesla.">
        <RefList
          items={[
            ['Šifrování', '`Cᵢ = (Pᵢ + Kᵢ) mod N`'],
            ['Dešifrování', '`Pᵢ = (Cᵢ − Kᵢ) mod N`'],
            ['Gronsfeld', 'klíč z číslic, každá číslice = posun: `314159`']
          ]}
        />
      </RefSection>

      <RefSection title="Autokey" note="Heslo se neopakuje, pokračuje otevřeným textem.">
        <RefList
          items={[
            ['Zpráva', '`JDETENAROZCESTI`'],
            ['Heslo', '`KOD`'],
            ['Klíč', '`KODJDETENAROZCE`']
          ]}
        />
      </RefSection>
    {/if}
  {/snippet}
</RefLayout>

<style>
  .tabula-recta {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-mono);
    font-size: 10px;
    text-align: center;
    background-color: var(--color-surface-2);
  }

  .tabula-recta th,
  .tabula-recta td {
    min-width: 16px;
    padding: 3px 5px;
    border: 1px solid var(--color-border-subtle);
  }

  .tabula-recta th {
    background-color: var(--color-surface-3);
    color: var(--color-accent-primary);
    font-weight: 700;
  }

  .corner-th {
    background-color: var(--color-surface-1) !important;
  }

  .row-th {
    position: sticky;
    left: 0;
    z-index: 1;
  }
</style>
