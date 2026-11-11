<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import RefList from '../../components/reference/RefList.svelte';
  import RefSection from '../../components/reference/RefSection.svelte';
  import type { RefHelpData, RefTool } from '../../components/reference/refTypes';
  import { PHONE_GRID, getPhoneKeyLetters } from './mobileData';

  const keys = PHONE_GRID.map(({ digit, keyId }) => ({
    digit,
    chars: getPhoneKeyLetters(keyId)
      .map((c) => (c === ' ' ? '␣' : c))
      .join(' ')
  }));

  type PhoneMode = 'multitap' | 't9';

  interface Props {
    /** Input mode currently active in the module (opens its help). */
    activeTool: PhoneMode;
  }

  let { activeTool }: Props = $props();

  const tools: RefTool<PhoneMode>[] = [
    {
      id: 'multitap',
      label: 'SMS',
      help: {
        howTo: [
          'Písmeno je počet stisků jedné klávesy: `2` je A, `22` B, `222` C. Rozepsané písmeno se zapíše asi po sekundě, nebo hned, když klepnete na jinou klávesu.'
        ],
        example: {
          title: 'Příklad: AHOJ',
          steps: [
            {
              action: 'Klepněte jednou na `2`.',
              result: 'Ve výstupu svítí rozepsané A, na klávese je zvýrazněné.'
            },
            { action: 'Klepněte dvakrát na `4`.', result: 'A se zapíše a rozepsané je H.' },
            {
              action: 'Klepněte třikrát na `6` a jednou na `5`.',
              result: 'Přibude O, rozepsané je J.'
            },
            {
              action: 'Počkejte asi sekundu.',
              result: 'J se zapíše a výstup ukazuje AHOJ. Na záložce Podklad je totéž jako `2,44,666,5`.'
            }
          ]
        },
        controls: [
          ['Klávesy `2`–`9`', 'Opakované klepnutí přepíná písmena na klávese, aktuální je zvýrazněné.'],
          ['`0`', 'Jednou mezera, dvakrát číslice `0`.'],
          ['`1`', 'Tečka, čárka, otazník a vykřičník.'],
          [
            'Mezera (dole uprostřed)',
            'Vloží mezeru. Když je písmeno rozepsané, ukazuje ho a klepnutím ho hned zapíšete.'
          ],
          ['Zpět (vpravo dole)', 'Zruší rozepsané písmeno, jinak smaže poslední znak.']
        ],
        pitfalls: [
          [
            'Potřebujete dvě písmena z jedné klávesy, třeba AB?',
            'Po A počkejte asi sekundu, nebo ho zapište tlačítkem dole uprostřed. Jinak se klepnutí sečtou a vznikne C.'
          ],
          [
            'Šifra uvádí klávesu a pořadí písmene, třeba `7/4`?',
            'Klepněte na klávesu tolikrát, kolikáté je písmeno: `7/4` je `7777`, tedy S.'
          ]
        ]
      }
    },
    {
      id: 't9',
      label: 'T9 Predikce',
      help: {
        howTo: [
          'Každé písmeno je jeden stisk klávesy, na které leží: DOMA je `3662`. Stejné číslice dávají víc slov, proto nástroj nabídne slova ze slovníku, nejčastější první.'
        ],
        example: {
          title: 'Příklad: DOMA',
          steps: [
            {
              action: 'Klepněte na `3`, `6`, `6` a `2`.',
              result: 'Ve výstupu svítí rozepsané DOMA a pod ním `3662`. Řádek variant nahradí návrhy: DOMA, EMMA, DONA…'
            },
            { action: 'Klepněte na `*`.', result: 'Zvýrazní se další návrh, EMMA.' },
            {
              action: 'Klepněte na DOMA v řádku návrhů.',
              result: 'Slovo se zapíše i s mezerou a vrátí se přepínač SMS | T9 Predikce. Na záložce Podklad je jako `3,666,6,2,,`.'
            }
          ]
        },
        controls: [
          ['Klávesy `2`–`9`', 'Jedno klepnutí na písmeno.'],
          ['Návrhy (místo řádku variant)', 'Klepnutí zapíše slovo s mezerou.'],
          ['`*`', 'Zvýrazní další návrh.'],
          ['`0`', 'Zapíše zvýrazněné slovo a mezeru. Bez rozepsaného slova vloží mezeru.'],
          ['`1`', 'Zapíše slovo a za něj tečku.'],
          ['`#`', 'Zapíše slovo bez mezery za ním.'],
          [
            'Mezera (dole uprostřed)',
            'Během psaní ukazuje zvýrazněné slovo a klepnutím ho zapíšete s mezerou.'
          ],
          ['Zpět (vpravo dole)', 'Ubere poslední číslici rozepsaného slova, jinak smaže poslední písmeno.'],
          ['Menu → Stáhnout slovník pro T9', 'Je tu, jen když slovník chybí, a otevře Nastavení, kde se stahuje.']
        ],
        pitfalls: [
          [
            'Lišta hlásí, že slovník pro T9 není stažen?',
            'Bez slovníku T9 ukáže jen první písmeno každé klávesy, `3662` jako DMMA. Stáhněte ho přes Menu → Stáhnout slovník pro T9.'
          ],
          [
            'Hledané slovo mezi návrhy není?',
            'Návrhů je nejvýš šest. Smažte číslice tlačítkem Zpět, přepněte na SMS a napište slovo po písmenech.'
          ]
        ]
      }
    }
  ];

  const help: RefHelpData = {
    purpose: [
      'Starý mobil psal písmena na číselné klávesy, šifra je proto řada číslic. Nástroj ji převede na text a pod každým písmenem ukáže jeho stisky.'
    ],
    howTo: [
      'Na každé klávese `2`–`9` leží tři nebo čtyři písmena (`2` = A B C). V SMS vybírá písmeno počet stisků, v T9 stačí jeden stisk a slovo dohledá slovník.'
    ],
    controls: [
      ['Řádek variant: SMS | T9 Predikce', 'Přepne způsob psaní. Zapsaný text zůstane.'],
      [
        'Podržení klávesy',
        'Vloží samotnou číslici. V zápisu je to o stisk víc, než má klávesa písmen (`2222` = 2).'
      ],
      ['Koš (vlevo dole)', 'Podržením smaže celý text.'],
      [
        'Záložka Podklad',
        'Celý zápis jako text: klávesa opakovaná podle písmene, čárka dělí znaky, prázdné pole je mezera (`2,44,666,5`). Slovo z T9 se uloží stejně, bez diakritiky.'
      ]
    ],
    pitfalls: [
      [
        'Šifra pochází z jiného telefonu?',
        'Písmena na `2`–`9` jsou všude stejná. `1`, `0`, `*` a `#` se liší podle výrobce, porovnejte je se záložkou Klávesy.'
      ],
      [
        'Telefon měl na klávesách i česká písmena (Á, Č…)?',
        'Pak vychází víc stisků na klávesu. Nástroj zná jen písmena bez diakritiky a delší řadu ukáže jako číslici nebo neplatnou; takové písmeno dopočítejte podle klávesnice toho telefonu.'
      ]
    ]
  };
</script>

<RefLayout tabs={[{ id: 'keys', label: 'Klávesy' }]} {help} {tools} {activeTool}>
  {#snippet content()}
    <RefSection title="Klávesnice">
      <div class="phone-grid">
        {#each keys as key (key.digit)}
          <div class="phone-key">
            <span class="key-num">{key.digit}</span>
            <span class="key-chars">{key.chars}</span>
          </div>
        {/each}
      </div>
    </RefSection>

    <RefSection title="Zápisy v šifrách">
      <RefList
        items={[
          ['Počet stisků', '`22` = B, `7777` = S, `0` = ␣'],
          ['Klávesa a pořadí', '`7/4` nebo `(7, 4)` = S'],
          ['T9', 'jedna číslice na písmeno: `3662` = DOMA']
        ]}
      />
    </RefSection>
  {/snippet}
</RefLayout>

<style>
  .phone-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    padding: var(--space-sm);
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
  }

  .phone-key {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--space-xs);
    background-color: var(--color-surface-2);
    border-radius: var(--radius-xs);
  }

  .key-num {
    font-family: var(--font-mono);
    font-size: var(--text-base);
    font-weight: 800;
    color: var(--color-text-primary);
  }

  .key-chars {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }
</style>
