<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import type { RefHelpData } from '../../components/reference/refTypes';
  import DirectionsRefSection from './DirectionsRefSection.svelte';

  const help: RefHelpData = {
    controls: [
      ['Vpřed / vzad', 'o 1 ve směru želvy'],
      ['Vlevo / vpravo', 'otočka o zvolený krok'],
      ['Krok otočky', '`1°` `5°` `15°` `45°` `90°`, skládá se: 64° = 45 + 15 + 4 × 1'],
      ['Značka', 'očíslovaný bod na aktuální pozici'],
      ['Pero', 'Kreslí / Zvednuto = přesun bez čáry'],
      ['Backspace', 'vrátí poslední akci']
    ],
    pitfalls: [
      ['Otočka', 'relativní k želvě, ne ke světovým stranám'],
      ['Start', 'želva míří nahoru. Zadání začíná doprava → menu Výchozí směr: Východ'],
      ['Pevné směry (S, SV, V…)', 'modul Plotr']
    ]
  };
</script>

<RefLayout tabs={[{ id: 'directions', label: 'Směry' }]} {help}>
  {#snippet content()}
    <DirectionsRefSection />
  {/snippet}
</RefLayout>
