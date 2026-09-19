<script lang="ts">
  import type { FlagItem } from './flagsData';

  interface Props {
    flag: FlagItem;
    dimmed?: boolean;
    class?: string;
  }

  let { flag, dimmed = false, class: className = '' }: Props = $props();
</script>

<div class="flag-wrapper {className}" class:is-dimmed={dimmed}>
  {@html flag.svg}
</div>

<style>
  .flag-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    transition: opacity 0.15s ease, filter 0.15s ease;
  }

  .flag-wrapper :global(svg) {
    width: 100%;
    height: 100%;
    display: block;
    border-radius: var(--radius-xs);
    overflow: hidden;
  }

  .flag-wrapper.is-dimmed {
    opacity: 0.2;
    filter: grayscale(100%);
  }
</style>
