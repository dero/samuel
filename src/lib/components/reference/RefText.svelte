<script lang="ts">
  import { parseRefText } from './refTypes';

  interface Props {
    text: string;
  }

  let { text }: Props = $props();

  let parts = $derived(parseRefText(text));
</script>

{#each parts as part, i (i)}{#if part.code}<code>{part.text}</code>{:else}{part.text}{/if}{/each}
