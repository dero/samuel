<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import type { RefHelpData } from '../../components/reference/refTypes';
  import DirectionsRefSection from '../turtle/DirectionsRefSection.svelte';

  const help: RefHelpData = {
    controls: [
      ['8 směrů', 'krok o 1 pole, natočení se nepočítá'],
      ['Značka', 'očíslovaný bod na aktuální pozici (střed kříže)'],
      ['Pero', 'Kreslí / Zvednuto = přesun bez čáry'],
      ['Backspace', 'vrátí poslední akci']
    ],
    pitfalls: [
      ['Diagonála', 'krok SV posune o 1 v X i Y, čára je delší (√2)'],
      ['Otočky o úhel (vpřed, vlevo 45°…)', 'modul Želva']
    ]
  };
</script>

<RefLayout tabs={[{ id: 'directions', label: 'Směry' }]} {help}>
  {#snippet content()}
    <DirectionsRefSection />
  {/snippet}
</RefLayout>
