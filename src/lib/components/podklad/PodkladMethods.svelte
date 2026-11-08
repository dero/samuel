<script lang="ts">
  import PodkladMethodButton from './PodkladMethodButton.svelte';
  import { podklad, PODKLAD_METHODS, type PodkladConfig } from '../../state/podklad.svelte';

  interface Props {
    config: PodkladConfig;
  }

  let { config }: Props = $props();
</script>

<!-- Podklad phase, ZONE-INPUT: ways to insert, in thumb reach -->
<div class="zone-input-flow">
  {#each PODKLAD_METHODS[config.kind] as method (method.id)}
    <PodkladMethodButton
      {method}
      onWrite={() => podklad.open()}
      onFile={(file) => {
        if (config.kind === 'image') config.onFile(file);
      }}
    />
  {/each}
</div>
