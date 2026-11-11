<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import RefList from '../../components/reference/RefList.svelte';
  import RefSection from '../../components/reference/RefSection.svelte';
  import type { RefHelpData, RefTab, RefTool } from '../../components/reference/refTypes';

  type ColorsRefTab = 'mixing' | 'filters';

  const tabs: RefTab<ColorsRefTab>[] = [
    { id: 'mixing', label: 'Míchání' },
    { id: 'filters', label: 'Filtry' }
  ];

  type ColorModel = 'rgb' | 'cmy';

  interface Props {
    /** Colour model currently active in the module (opens its help). */
    activeTool: ColorModel;
  }

  let { activeTool }: Props = $props();

  const tools: RefTool<ColorModel>[] = [
    {
      id: 'rgb',
      label: 'RGB',
      help: {
        example: {
          title: 'Příklad: červené brýle',
          steps: [
            {
              action: 'Na záložce Podklad klepněte na Vyfotit a vyfoťte šifru: modrý text přeškrtaný červenými čarami.',
              result: 'Fotka je ve výstupu, nástroj se vrátí na Interakci a lišta hlásí Původní barvy.'
            },
            {
              action: 'Klepněte na `G` a na `B`.',
              result:
                'Svítí jen `R` a lišta hlásí Jen kanál R. Papír i červené čáry jsou teď stejně červené a modrý text zčerná, takže jde přečíst.'
            },
            {
              action: 'Roztáhněte fotku dvěma prsty.',
              result: 'V liště přibude zvětšení, třeba `200 %`. Klepnutím na něj se fotka vrátí na 100 %.'
            }
          ]
        },
        controls: [
          ['`R` `G` `B`', 'Klepnutím kanál zapnete nebo vypnete, zapnutý je zvýrazněný. Vypnutý kanál zčerná.']
        ],
        pitfalls: [
          [
            'Zadání mluví o červených brýlích?',
            'Nechte zapnuté jen `R`: červená splyne s papírem, modrá, zelená a azurová zčernají.'
          ],
          ['Text se neukazuje?', 'Zkuste postupně jen `R`, jen `G` a jen `B`. Pak zkuste CMY.']
        ]
      }
    },
    {
      id: 'cmy',
      label: 'CMY',
      help: {
        example: {
          title: 'Příklad: azurový text pod čmáranicemi',
          steps: [
            {
              action:
                'Na záložce Podklad klepněte na Z galerie a zvolte fotku šifry: azurový text pod červenými a žlutými čmáranicemi.',
              result: 'Fotka je ve výstupu a nástroj se vrátí na Interakci.'
            },
            {
              action: 'V řádku variant zvolte CMY.',
              result: 'Klávesy se změní na `C` `M` `Y` a lišta hlásí Původní barvy.'
            },
            {
              action: 'Klepněte na `M` a na `Y`.',
              result:
                'Zůstane jen azurová vrstva a lišta hlásí Jen vrstva C. Červené i žluté čmáranice zbělají a azurový text zůstane na bílém papíře.'
            }
          ]
        },
        controls: [
          [
            '`C` `M` `Y`',
            'Klepnutím vrstvu zapnete nebo vypnete, zapnutá je zvýrazněná. Vypnutá vrstva se neotiskne a papír na jejím místě zbělá.'
          ]
        ],
        pitfalls: [
          [
            'Chcete se zbavit rušivé barvy?',
            'Vypněte vrstvy, ze kterých je: žlutá zmizí bez `Y`, azurová bez `C`, purpurová bez `M`, červená bez `M` i `Y`.'
          ]
        ]
      }
    }
  ];

  const help: RefHelpData = {
    purpose: [
      'Některé šifry schovávají text do barev: splývá s pozadím a objeví se až přes barevný filtr, třeba červené brýle. Nástroj vyfocenou šifru rozloží na barevné kanály, které zapínáte a vypínáte.'
    ],
    howTo: [
      'RGB pracuje se světlem jako displej: vypnutý kanál zčerná. CMY pracuje s inkousty jako tiskárna: vypnutá vrstva se neotiskne a na jejím místě zbělá papír. Zkoušejte kanály po jednom, dokud se text neoddělí od pozadí.'
    ],
    controls: [
      [
        'Záložka Podklad',
        'Fotka šifry: Vyfotit, Z galerie, nebo Smazat podržením. Po výběru fotky se nástroj vrátí na Interakci.'
      ],
      ['Řádek variant: RGB | CMY', 'Přepne mezi kanály světla a vrstvami inkoustu.'],
      ['Fotka (ve výstupu)', 'Jeden prst ji posouvá, dva prsty přibližují.'],
      ['Zvětšení v % (v liště)', 'Objeví se po posunu nebo přiblížení. Klepnutím vrátíte fotku na 100 % a na střed.']
    ],
    pitfalls: [
      ['Fotka zmizela?', 'Fotka se neukládá: vydrží přepnutí nástroje, ale ne zavření aplikace. Vyfoťte ji znovu.'],
      [
        'Čekáte, že žlutá a modrá dají zelenou?',
        'To platí jen pro malířské barvy. Světlo a tisk se míchají jinak, viz záložka Míchání.'
      ]
    ]
  };
</script>

<RefLayout {tabs} {help} {tools} {activeTool}>
  {#snippet content(tab)}
    {#if tab === 'mixing'}
      <RefSection title="RGB – světlo" note="Aditivní: displeje, projektory. Všechny složky dají bílou.">
      <div class="ref-table-wrap">
        <table class="ref-table">
          <thead>
            <tr>
              <th class="col-name">Složky</th>
              <th class="col-result">Výsledek</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="col-name"><span class="color-dot" style="background:#ef4444;"></span>Červená + <span class="color-dot" style="background:#22c55e;"></span>Zelená</td>
              <td class="col-result"><span class="color-dot" style="background:#eab308;"></span><strong>Žlutá</strong></td>
            </tr>
            <tr>
              <td class="col-name"><span class="color-dot" style="background:#ef4444;"></span>Červená + <span class="color-dot" style="background:#3b82f6;"></span>Modrá</td>
              <td class="col-result"><span class="color-dot" style="background:#d946ef;"></span><strong>Purpurová</strong></td>
            </tr>
            <tr>
              <td class="col-name"><span class="color-dot" style="background:#22c55e;"></span>Zelená + <span class="color-dot" style="background:#3b82f6;"></span>Modrá</td>
              <td class="col-result"><span class="color-dot" style="background:#06b6d4;"></span><strong>Azurová</strong></td>
            </tr>
            <tr>
              <td class="col-name"><span class="color-dot" style="background:#ef4444;"></span>Červená + <span class="color-dot" style="background:#22c55e;"></span>Zelená + <span class="color-dot" style="background:#3b82f6;"></span>Modrá</td>
              <td class="col-result"><span class="color-dot" style="background:#ffffff; border-color:#999;"></span><strong>Bílá</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
      </RefSection>

      <RefSection title="CMYK – tisk" note="Subtraktivní: inkoust pohlcuje světlo. K = černá.">
      <div class="ref-table-wrap">
        <table class="ref-table">
          <thead>
            <tr>
              <th class="col-name">Inkousty</th>
              <th class="col-result">Výsledek</th>
              <th class="col-val">Pohlcuje</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="col-name"><span class="color-dot" style="background:#06b6d4;"></span>Azurová + <span class="color-dot" style="background:#d946ef;"></span>Purpurová</td>
              <td class="col-result"><span class="color-dot" style="background:#3b82f6;"></span><strong>Modrá</strong></td>
              <td class="col-val">R, G</td>
            </tr>
            <tr>
              <td class="col-name"><span class="color-dot" style="background:#06b6d4;"></span>Azurová + <span class="color-dot" style="background:#eab308;"></span>Žlutá</td>
              <td class="col-result"><span class="color-dot" style="background:#22c55e;"></span><strong>Zelená</strong></td>
              <td class="col-val">R, B</td>
            </tr>
            <tr>
              <td class="col-name"><span class="color-dot" style="background:#d946ef;"></span>Purpurová + <span class="color-dot" style="background:#eab308;"></span>Žlutá</td>
              <td class="col-result"><span class="color-dot" style="background:#ef4444;"></span><strong>Červená</strong></td>
              <td class="col-val">G, B</td>
            </tr>
            <tr>
              <td class="col-name"><span class="color-dot" style="background:#06b6d4;"></span>Azurová + <span class="color-dot" style="background:#d946ef;"></span>Purpurová + <span class="color-dot" style="background:#eab308;"></span>Žlutá</td>
              <td class="col-result"><span class="color-dot" style="background:#111111; border-color:#555;"></span><strong>Černá</strong></td>
              <td class="col-val">vše</td>
            </tr>
          </tbody>
        </table>
      </div>
      </RefSection>

      <RefSection title="RYB – malířské" note="Vodovky, tempery, dětské šifry.">
      <div class="ref-table-wrap">
        <table class="ref-table">
          <thead>
            <tr>
              <th class="col-name">Barvy</th>
              <th class="col-result">Výsledek</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="col-name"><span class="color-dot" style="background:#ef4444;"></span>Červená + <span class="color-dot" style="background:#eab308;"></span>Žlutá</td>
              <td class="col-result"><span class="color-dot" style="background:#f97316;"></span><strong>Oranžová</strong></td>
            </tr>
            <tr>
              <td class="col-name"><span class="color-dot" style="background:#eab308;"></span>Žlutá + <span class="color-dot" style="background:#3b82f6;"></span>Modrá</td>
              <td class="col-result"><span class="color-dot" style="background:#22c55e;"></span><strong>Zelená</strong></td>
            </tr>
            <tr>
              <td class="col-name"><span class="color-dot" style="background:#ef4444;"></span>Červená + <span class="color-dot" style="background:#3b82f6;"></span>Modrá</td>
              <td class="col-result"><span class="color-dot" style="background:#a855f7;"></span><strong>Fialová</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
      </RefSection>
    {:else}
      <RefSection title="Barevné filtry" note="Filtr propustí svou barvu, ta splyne s bílým papírem. Doplňkové barvy zčernají.">
        <RefList
          items={[
            ['Červený', 'červená zmizí, modrá a azurová zčernají'],
            ['Zelený', 'zelená a žlutá zmizí, červená a purpurová zčernají'],
            ['Modrý', 'modrá a azurová zmizí, žlutá a červená zčernají']
          ]}
        />
      </RefSection>
    {/if}
  {/snippet}
</RefLayout>

<style>
  .col-result {
    width: 1%;
    white-space: nowrap;
  }

  .color-dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.2);
    margin-right: 5px;
    vertical-align: middle;
  }
</style>
