<script lang="ts">
  import type { Snippet } from 'svelte';
  import HoldToAction from './HoldToAction.svelte';
  import BackspaceButton from './BackspaceButton.svelte';

  /**
   * Bottom key row in its fixed order: clear all (hold) | space or commit | backspace.
   * Without a `middle`, a blank filler keeps both sides the same width.
   */
  interface Props {
    clearDisabled?: boolean;
    backspaceDisabled?: boolean;
    clearLabel?: string;
    backspaceTitle?: string;
    /** Backspace currently cancels a half-finished selection instead of deleting. */
    hasActiveSelection?: boolean;
    cancelLabel?: string;
    cancelTitle?: string;
    onClear: () => void;
    onBackspace: () => void;
    middle?: Snippet;
  }

  let {
    clearDisabled = false,
    backspaceDisabled = false,
    clearLabel,
    backspaceTitle,
    hasActiveSelection = false,
    cancelLabel,
    cancelTitle,
    onClear,
    onBackspace,
    middle
  }: Props = $props();
</script>

<div class="keypad-utility-row-3col">
  <HoldToAction disabled={clearDisabled} onAction={onClear} ariaLabel={clearLabel} />

  {#if middle}
    {@render middle()}
  {:else}
    <div class="bottom-filler" aria-hidden="true"></div>
  {/if}

  <BackspaceButton
    disabled={backspaceDisabled}
    title={backspaceTitle}
    {hasActiveSelection}
    {cancelLabel}
    {cancelTitle}
    onAction={onBackspace}
  />
</div>

<style>
  .bottom-filler {
    background-color: var(--color-surface-2);
    opacity: 0.35;
  }
</style>
