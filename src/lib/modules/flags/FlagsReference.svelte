<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import type { RefHelpData, RefTab } from '../../components/reference/refTypes';
  import { LETTER_FLAGS, NUMBER_FLAGS, FLAG_COLORS, type FlagItem } from './flagsData';
  import FlagSvg from './FlagSvg.svelte';

  type FlagsRefTab = 'letters' | 'numbers';

  const tabs: RefTab<FlagsRefTab>[] = [
    { id: 'letters', label: 'Písmena', badge: LETTER_FLAGS.length },
    { id: 'numbers', label: 'Číslice', badge: NUMBER_FLAGS.length }
  ];

  const help: RefHelpData = {
    purpose: [
      'Námořní signální vlajky mají pro každé písmeno abecedy vlastní vlajku. Nástroj z klepnutých vlajek skládá text a pod každé písmeno napíše jméno vlajky (Alfa, Bravo…).'
    ],
    howTo: [
      'Podívejte se, jaké barvy vlajka má, a zapněte je v řádku nad vlajkami. Plné zůstanou jen vlajky, které mají všechny zvolené barvy, ostatní ztmavnou. Ze zbylých klepněte na tu se stejným vzorem.'
    ],
    example: {
      title: 'Příklad: OK',
      steps: [
        { action: 'Klepněte na Žlutá a Červená v řádku nad vlajkami.', result: 'Plné zůstanou jen O, R, Y a Z, lišta hlásí „Filtr: 4 vlajky“.' },
        { action: 'Klepněte na vlajku O (červený a žlutý trojúhelník).', result: 'Ve výstupu je O a pod ním Oscar. Filtr zůstává zapnutý.' },
        { action: 'Klepněte na Zpět (vpravo dole).', result: 'Filtr se zruší, O ve výstupu zůstane.' },
        { action: 'Zapněte Žlutá a Modrá a klepněte na vlajku K (žlutá a modrá půlka).', result: 'Výstup ukazuje OK. Na záložce Podklad je totéž jako `OK`.' }
      ]
    },
    controls: [
      ['Řádek barev: Bílá | Černá | Červená | Modrá | Žlutá', 'Zapíná a vypíná barvy filtru. Lišta ukazuje, kolik vlajek zbývá.'],
      ['Vlajky', 'Klepnutím přidáte písmeno. Ztmavlé vlajky jdou vložit také.'],
      ['Mezera (uprostřed dole)', 'Vloží mezeru.'],
      ['Zpět (vpravo dole)', 'Se zapnutým filtrem ho zruší (ukazuje ✕), jinak smaže poslední písmeno.'],
      ['Koš (vlevo dole)', 'Podržením smaže text i filtr.'],
      ['Záložka Podklad', 'Text přímo písmeny, mezera je mezera. Znak bez vlajky (číslice, diakritika) zůstane v textu a označí se.'],
      ['Menu → Rušit filtr po zadání', 'Po každé vložené vlajce filtr vypne. Výchozí je vypnuto.'],
      ['Menu → Lodička', 'Ukáže nebo skryje dekoraci v rohu vlajek.']
    ],
    pitfalls: [
      ['Filtr nechal vlajky s jiným vzorem?', 'Filtr porovnává jen barvy, ne tvar ani rozmístění. Mezi zbylými vlajkami vyberte podle obrázku.'],
      ['Lišta hlásí „Filtr: 0 vlajek“?', 'Žádná písmenná vlajka nemá všechny zvolené barvy. Ubírejte barvy, nebo jde o číselný praporec.'],
      ['V šifře jsou číselné praporce?', 'Klávesnice má jen písmena. Praporec najděte v taháku v záložce Číslice; na záložce Podklad číslici dopsat můžete, zůstane ale označená.']
    ]
  };

  function getColorHex(colorId: string): string {
    return FLAG_COLORS.find((c) => c.id === colorId)?.hex ?? '#888';
  }

  function getColorName(colorId: string): string {
    return FLAG_COLORS.find((c) => c.id === colorId)?.name ?? colorId;
  }
</script>

{#snippet flagCard(flag: FlagItem, pennant: boolean)}
  <div class="flag-card">
    <div class="flag-preview-box" class:pennant>
      <FlagSvg {flag} />
    </div>

    <div class="flag-info">
      <div class="flag-title-row">
        <span class="flag-code">{flag.code}</span>
        <span class="flag-nato">{flag.name}</span>
      </div>

      {#if !pennant}
        <div class="flag-meaning">{flag.meaning}</div>
      {/if}

      <div class="flag-colors-row">
        {#each flag.colors as c (c)}
          <span class="color-dot" style:background-color={getColorHex(c)} title={getColorName(c)}></span>
        {/each}
      </div>
    </div>
  </div>
{/snippet}

<RefLayout {tabs} {help}>
  {#snippet content(tab)}
    <div class="flags-list">
      {#each tab === 'letters' ? LETTER_FLAGS : NUMBER_FLAGS as flag (flag.code)}
        {@render flagCard(flag, tab === 'numbers')}
      {/each}
    </div>
  {/snippet}
</RefLayout>

<style>
  .flags-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .flag-card {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: var(--space-xs) var(--space-sm);
  }

  .flag-preview-box {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .flag-preview-box.pennant {
    width: 56px;
    height: 32px;
  }

  .flag-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .flag-title-row {
    display: flex;
    align-items: baseline;
    gap: var(--space-sm);
  }

  .flag-code {
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-accent-primary);
    font-family: var(--font-condensed);
    min-width: 18px;
  }

  .flag-nato {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .flag-meaning {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    line-height: 1.35;
  }

  .flag-colors-row {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 2px;
  }

  .color-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

</style>
