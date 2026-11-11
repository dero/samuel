<script lang="ts">
  import type { Snippet } from 'svelte';

  /** Recessed black frame around a key matrix: the single source of its look. */
  interface Props {
    columns?: number;
    /** Height of each key (any CSS length); keys need a definite height, see Keycap. */
    keyHeight?: string;
    class?: string;
    children: Snippet;
  }

  let { columns = 1, keyHeight, class: customClass = '', children }: Props = $props();
</script>

<div class="chassis {customClass}" style:--chassis-columns={columns} style:--key-height={keyHeight}>
  {@render children()}
</div>

<style>
  .chassis {
    display: grid;
    grid-template-columns: repeat(var(--chassis-columns), 1fr);
    gap: 2px;
    width: 100%;
    padding: 2px;
    background-color: var(--color-bg-canvas);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    box-sizing: border-box;
    flex-shrink: 0;
    overflow: hidden;
    touch-action: none;
  }
</style>
