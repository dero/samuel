<script lang="ts">
  import type { Snippet } from 'svelte';
  import HoldToAction from './HoldToAction.svelte';

  /**
   * Bottom key row "1+2": clearing by hold on its own on the left, then a joined pair of
   * equal actions (Ze schránky | Do schránky in Podklad, Zpět | Vpřed in Šachy). All three keys
   * are the same width. The pair is two `Keycap`s rendered by the caller; with a caption
   * (`clearLabel`) the keys show an icon over a small caption, as the main keys do.
   */
  interface Props {
    clearDisabled?: boolean;
    /** Shown next to the bin icon when set; without it the key shows the icon only. */
    clearLabel?: string;
    clearAriaLabel?: string;
    tapWarning?: string;
    onClear: () => void;
    pair: Snippet;
  }

  let {
    clearDisabled = false,
    clearLabel,
    clearAriaLabel,
    tapWarning,
    onClear,
    pair
  }: Props = $props();
</script>

<div class="split-row">
  <div class="keypad-utility-row-3col split-clear">
    <HoldToAction
      label={clearLabel ?? 'Vymazat'}
      showLabel={!!clearLabel}
      stacked={!!clearLabel}
      iconSize={clearLabel ? 16 : undefined}
      ariaLabel={clearAriaLabel}
      {tapWarning}
      disabled={clearDisabled}
      onAction={onClear}
    />
  </div>

  <div class="keypad-utility-row-3col split-pair">
    {@render pair()}
  </div>
</div>

<style>
  .split-row {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: var(--space-xs);
    width: 100%;
    flex-shrink: 0;
  }

  .split-clear {
    grid-template-columns: 1fr;
  }

  .split-pair {
    grid-template-columns: 1fr 1fr;
  }
</style>
