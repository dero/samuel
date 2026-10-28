<script lang="ts">
  import RefList from './RefList.svelte';
  import RefSection from './RefSection.svelte';
  import type { RefHelpData } from './refTypes';

  interface Props {
    help: RefHelpData;
  }

  let { help }: Props = $props();
</script>

{#if help.controls?.length}
  <RefSection title="Ovládání">
    <RefList items={help.controls} />
  </RefSection>
{/if}

{#if help.pitfalls?.length}
  <RefSection title="Pozor">
    <RefList items={help.pitfalls} variant="warn" />
  </RefSection>
{/if}
