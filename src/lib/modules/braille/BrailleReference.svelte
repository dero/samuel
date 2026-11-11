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
    purpose: [
      'Braillovo písmo zapisuje znaky vystouplými body v mřížce o dvou sloupcích a třech řádcích. Nástroj převede body na text a pod každým znakem ukáže čísla jeho bodů.'
    ],
    howTo: [
      'Body jsou číslované vlevo shora `1`, `2`, `3` a vpravo `4`, `5`, `6`. Zapněte body znaku a potvrďte ho prostřední klávesou dole. Číslice se píšou jako A–J za znakem `⠼` (body `3456`), který platí až do mezery nebo jiného znaku než A–J.'
    ],
    example: {
      title: 'Příklad: AHOJ',
      steps: [
        { action: 'Klepněte na bod `1`.', result: 'Bod svítí, ve výstupu je rozepsané A a prostřední klávesa dole ukazuje A.' },
        { action: 'Klepněte na prostřední klávesu.', result: 'A je vložené, pod ním je `1` a body zhasnou.' },
        { action: 'Táhněte prstem přes body `1`, `2` a `5`, pak klepněte na prostřední klávesu.', result: 'Přibude H s čísly `125`.' },
        { action: 'Klepnutím na body zadejte O (`1`, `3`, `5`) a J (`2`, `4`, `5`), každé potvrďte.', result: 'Výstup ukazuje AHOJ. Na záložce Podklad je totéž jako `1,125,135,245`.' }
      ]
    },
    controls: [
      ['Body `1`–`6`', 'Klepnutím bod zapnete, dalším klepnutím vypnete. Tahem prstu zapnete několik bodů najednou.'],
      ['Mezera (uprostřed dole)', 'Bez vybraných bodů vloží mezeru. S vybranými body ukazuje rozepsaný znak a klepnutím ho vloží.'],
      ['Zpět (vpravo dole)', 'Zruší vybrané body (ukazuje ✕), jinak smaže poslední znak.'],
      ['Koš (vlevo dole)', 'Podržením smaže celý zápis.'],
      ['Záložka Podklad', 'Celý zápis jako čísla bodů: `1,125,,12`. Čárka dělí znaky, prázdné pole je mezera. Neznámá kombinace bodů zůstane v textu a označí se.'],
      ['Menu → Okamžité vkládání', 'Znak se vloží hned po zvednutí prstu, bez potvrzení. Celý znak pak zadejte jedním tahem.'],
      ['Menu → Česká diakritika', 'Zapnutá (výchozí) čte česká písmena s diakritikou a body `2456` jako Ř. Vypnutá čte mezinárodně, `2456` je W.'],
      ['Menu → Čísla bez prefixu', 'Čte A–J jako číslice `1`–`0` i bez znaku `⠼`.']
    ],
    pitfalls: [
      ['Šifra má číslice bez znaku `⠼`?', 'Zapněte Menu → Čísla bez prefixu. Body A–J se pak čtou jen jako číslice.'],
      ['V textu je Ř tam, kde čekáte W?', 'Mezinárodní Braille píše W body `2456`, česky je to Ř. Vypněte Menu → Česká diakritika.'],
      ['Šifra má před písmeny body `6` nebo `56`?', 'To jsou prefixy velkých písmen. Nástroj velká písmena nerozlišuje, proto je nezadávejte, jinak se ukážou jako `?`.'],
      ['Čtete ražbu ze zadní strany papíru?', 'Body jsou zrcadlově: zadávejte `4` místo `1`, `5` místo `2`, `6` místo `3` a naopak.']
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
    font-size: var(--text-xl);
    font-weight: 800;
    color: var(--color-text-primary);
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
    border: 1px solid var(--color-border-subtle);
    flex-shrink: 0;
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background-color: var(--color-border-subtle);
  }

  .dot.is-on {
    background-color: var(--color-accent-primary);
    box-shadow: 0 0 4px var(--color-accent-primary);
  }

</style>
