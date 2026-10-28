<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import RefSection from '../../components/reference/RefSection.svelte';
  import type { RefHelpData, RefTool } from '../../components/reference/refTypes';
  import type { TurtleFlavour } from './turtleTypes';

  const DIRECTIONS = [
    { code: 'S', name: 'sever, nahoru', angle: '0°', delta: '0, +1' },
    { code: 'SV', name: 'severovýchod', angle: '45°', delta: '+1, +1' },
    { code: 'V', name: 'východ, doprava', angle: '90°', delta: '+1, 0' },
    { code: 'JV', name: 'jihovýchod', angle: '135°', delta: '+1, −1' },
    { code: 'J', name: 'jih, dolů', angle: '180°', delta: '0, −1' },
    { code: 'JZ', name: 'jihozápad', angle: '225°', delta: '−1, −1' },
    { code: 'Z', name: 'západ, doleva', angle: '270°', delta: '−1, 0' },
    { code: 'SZ', name: 'severozápad', angle: '315°', delta: '−1, +1' }
  ];

  interface Props {
    /** Mode currently active in the module (opens its help). */
    activeTool: TurtleFlavour;
  }

  let { activeTool }: Props = $props();

  const tools: RefTool<TurtleFlavour>[] = [
    {
      id: 'angles',
      label: 'Úhly',
      help: {
        controls: [
          ['Vpřed / vzad', 'o 1 ve směru želvy'],
          ['Vlevo / vpravo', 'otočka o zvolený krok'],
          ['Krok otočky', '`1°` `5°` `15°` `45°` `90°`, skládá se: 64° = 45 + 15 + 4 × 1']
        ],
        pitfalls: [['Otočka', 'relativní k želvě, ne ke světovým stranám']]
      }
    },
    {
      id: 'directions',
      label: 'Směry',
      help: {
        controls: [['8 směrů', 'krok o 1 pole, natočení želvy se nepočítá']],
        pitfalls: [['Diagonála', 'krok SV posune o 1 v X i Y, čára je delší (√2)']]
      }
    }
  ];

  const help: RefHelpData = {
    controls: [
      ['Úhly / Směry', 'lišta nad klávesnicí'],
      ['Značka', 'očíslovaný bod na aktuální pozici'],
      ['Pero', 'Kreslí / Zvednuto = přesun bez čáry'],
      ['Backspace', 'vrátí poslední akci']
    ],
    pitfalls: [['Start', 'želva míří nahoru. Zadání začíná doprava → menu Výchozí směr: Východ']]
  };
</script>

<RefLayout tabs={[{ id: 'directions', label: 'Směry' }]} {help} {tools} {activeTool}>
  {#snippet content()}
    <RefSection title="Směry" note="Úhel od severu po směru hodinových ručiček. Posun X, Y.">
      <div class="ref-table-wrap">
        <table class="ref-table">
          <thead>
            <tr>
              <th class="col-code"></th>
              <th>Směr</th>
              <th class="col-val">Úhel</th>
              <th class="col-val">Posun</th>
            </tr>
          </thead>
          <tbody>
            {#each DIRECTIONS as dir (dir.code)}
              <tr>
                <td class="col-code dir-code">{dir.code}</td>
                <td>{dir.name}</td>
                <td class="col-val">{dir.angle}</td>
                <td class="col-val">{dir.delta}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </RefSection>
  {/snippet}
</RefLayout>

<style>
  .dir-code {
    font-weight: 700;
    color: var(--color-accent-primary);
  }
</style>
