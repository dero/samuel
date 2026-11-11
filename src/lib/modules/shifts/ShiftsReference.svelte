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
        example: {
          title: 'Příklad: SRNODG MH SRG PRVWHP',
          steps: [
            {
              action: 'Na záložce Podklad napište `SRNODG MH SRG PRVWHP`.',
              result: 'Po zavření klávesnice ukáže výstup všech 25 posunů pod sebou, od `+1` po `+25`.'
            },
            {
              action: 'Podívejte se na kartu Nejlepší shoda nahoře ve výstupu.',
              result:
                'Ukazuje `+23` `-3` a text POKLAD JE POD MOSTEM. Šifra tedy vznikla posunem o 3 dopředu. Lišta hlásí Nejlepší posun +23 a jeho shodu s češtinou.'
            },
            {
              action: 'Klepněte na kartu.',
              result: 'Rozluštěný text je ve schránce a toast potvrdí Posun +23 zkopírován.'
            }
          ]
        },
        controls: [
          ['Karta Nejlepší shoda (nahoře ve výstupu)', 'Posun, který se nejvíc podobá češtině. Klepnutím ho zkopírujete.'],
          [
            'Seznam posunů (ve výstupu)',
            'Všechny posuny, každý v obou směrech: `+23` je totéž co `-3`. Čtvereček vpravo ukazuje shodu s češtinou od červené po zelenou. Klepnutím řádek zkopírujete.'
          ],
          ['Menu → Zvýraznit nejlepší posun', 'Vypnuté skryje kartu i zvýraznění, zbude jen seznam.']
        ],
        pitfalls: [
          [
            'Nejlepší shoda nedává smysl?',
            'U krátkého textu se odhad plete. Projděte seznam očima; se staženým slovníkem (Nastavení → Stáhnout slovník) je odhad přesnější.'
          ]
        ]
      }
    },
    {
      id: 'vigenere',
      label: 'Vigenère',
      help: {
        example: {
          title: 'Příklad: klíč LES',
          steps: [
            {
              action: 'Na záložce Podklad napište `DVSK Y KEEJPLG OYTF`.',
              result: 'Výstup zatím ukazuje šifru beze změny a lišta žádá klíč.'
            },
            {
              action: 'Na záložce Interakce klepněte na řádek Heslo nebo čísla…, napište `LES` a klepněte na Hotovo.',
              result:
                'Výstup ukazuje SRAZ U STAREHO DUBU. Pruh Klíč pod ním ukazuje, které písmeno klíče patří ke kterému písmenu textu, a lišta hlásí Posuny klíče: 11, 4, 18.'
            },
            {
              action: 'Přepište klíč na čísla `11 4 18`.',
              result: 'Výsledek se nezmění: písmeno klíče je jen jiný zápis posunu.'
            }
          ]
        },
        controls: [
          [
            'Klíč (řádek pod variantami)',
            'Klepnutím nebo tužkou vpravo otevřete editor. Klíč je heslo (`LES`), nebo čísla (`314` jsou posuny 3, 1 a 4).'
          ],
          ['Koš (v řádku klíče)', 'Podržením klíč smaže.']
        ],
        pitfalls: [
          [
            'Každé písmeno výsledku je o jedno dál v abecedě?',
            'Zadání počítá `A` = 1, nástroj `A` = 0. Posuňte každé písmeno klíče o jedno dál (`LES` → `MFT`), nebo zadejte čísla `12 5 19`.'
          ],
          ['Posun je větší než 9?', 'Čísla oddělte mezerou nebo čárkou: `12 5`. Bez oddělovače je `125` posun 1, 2 a 5.'],
          [
            'Výsledek je čitelný jen místy a chyba se pravidelně opakuje?',
            'Jedno písmeno klíče je špatně. Chyba se vrací po délce klíče, takže podle její polohy poznáte, které.'
          ]
        ]
      }
    },
    {
      id: 'autokey',
      label: 'Autokey',
      help: {
        example: {
          title: 'Příklad: heslo KOD',
          steps: [
            {
              action: 'Na záložce Podklad napište `TRHCH RT VBZTSRVM`.',
              result: 'Výstup zatím ukazuje šifru beze změny a lišta žádá počáteční heslo.'
            },
            {
              action: 'Na záložce Interakce klepněte na řádek Heslo…, napište `KOD` a klepněte na Hotovo.',
              result: 'Výstup ukazuje JDETE NA ROZCESTI a lišta hlásí Posuny hesla: 10, 14, 3.'
            },
            {
              action: 'Podívejte se na pruh Klíč pod výstupem.',
              result: '`KODJD ET ENAROZCE`: po hesle pokračuje klíč rozluštěnou zprávou.'
            }
          ]
        },
        controls: [
          [
            'Heslo (řádek pod variantami)',
            'Klepnutím nebo tužkou vpravo otevřete editor. Heslo je začátek klíče, dál ho tvoří zpráva sama. Čísla fungují jako u Vigenèra.'
          ],
          ['Koš (v řádku hesla)', 'Podržením heslo smaže.'],
          ['Pruh Klíč (pod výstupem)', 'Celý průběh klíče, písmeno pod písmenem.']
        ],
        pitfalls: [
          [
            'Prvních pár písmen sedí, dál je jen nesmysl?',
            'Šifra nejspíš bere do klíče šifrový text místo zprávy. Tuto variantu Autokey nástroj neumí.'
          ],
          [
            'Výsledek je čitelný jen místy a chyba se pravidelně opakuje?',
            'Jedno písmeno hesla je špatně. Chyba se vrací po délce hesla, takže podle její polohy poznáte, které.'
          ]
        ]
      }
    }
  ];

  const help: RefHelpData = {
    purpose: [
      'Posunové šifry nahrazují každé písmeno písmenem o několik míst dál v abecedě. Nástroj je luští: Cézar vyzkouší všechny posuny naráz, Vigenère a Autokey rozšifrují text podle klíče, který zadáte.'
    ],
    howTo: [
      'Písmena se posouvají v kruhu: `A` = 0, `B` = 1 … a za `Z` se pokračuje od `A`. Cézar posune všechna písmena o stejné číslo, Vigenère střídá posuny podle opakovaného klíče a Autokey po hesle pokračuje samotnou zprávou.'
    ],
    controls: [
      [
        'Řádek variant: Cézar | Vigenère | Autokey',
        'Přepne nástroj. Šifrový text zůstane, klíč a heslo si každý nástroj pamatuje zvlášť.'
      ],
      ['Záložka Podklad', 'Šifrový text. Ze schránky ho vloží do prázdného editoru, Smazat ho podržením vymaže.'],
      ['Menu → Abeceda', 'V jaké abecedě se posouvá. Obvykle anglická (26), nebo s CH jako samostatným písmenem (27).'],
      ['Menu → Zachovat mezery a interpunkci', 'Vypnuté: výsledek je jen z písmen, bez mezer.'],
      ['Menu → Reset nástroje', 'Podržením smaže šifru, klíč i heslo a vrátí volby v Menu. Zvolený nástroj zůstane.']
    ],
    pitfalls: [
      [
        'Šifra počítá CH jako jedno písmeno?',
        'Zvolte Menu → Abeceda → Anglická + CH (27). V 27 znacích vycházejí posuny jinak než v 26.'
      ]
    ]
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
