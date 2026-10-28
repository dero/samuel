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
        controls: [['`R` `G` `B`', 'vypnutý kanál zčerná, zbude jen světlo zapnutých']],
        pitfalls: [
          ['Červené brýle', 'nechat jen `R`: červená splyne s papírem, modrá a azurová zčernají'],
          ['Skrytý text', 'zkusit postupně jen `R`, jen `G`, jen `B`']
        ]
      }
    },
    {
      id: 'cmy',
      label: 'CMY',
      help: {
        controls: [['`C` `M` `Y`', 'vypnutá vrstva se neotiskne, papír v ní zbělá']],
        pitfalls: [['Text v jedné barvě', 'zmizí po vypnutí vrstvy jeho inkoustu']]
      }
    }
  ];

  const help: RefHelpData = {
    controls: [
      ['Fotka', 'tlačítko Vyfotit nebo vybrat šifru'],
      ['RGB / CMY', 'přepíná barevný model'],
      ['Dva prsty', 'posun a zoom, tlačítko s % vrátí 1×'],
      ['Podržet koš', 'smaže fotku']
    ],
    pitfalls: [['Malířské míchání', 'žlutá + modrá = zelená platí jen pro barvy (RYB), ne pro světlo a tisk']]
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
