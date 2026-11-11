<script lang="ts">
  import type { Snippet } from 'svelte';
  import { BookOpen, X } from 'phosphor-svelte';
  import { navigation } from '../../state/navigation.svelte';
  import { settings } from '../../state/settings.svelte';
  import ScrollArea from '../ui/ScrollArea.svelte';

  /**
   * Covers everything below the header: the cheat sheet (nobody types without seeing the
   * output), and the detail of a Přehled item (an article is read, not typed).
   */
  interface Props {
    title?: string;
    closeLabel?: string;
    /** The cheat-sheet book; a detail shows its title only. */
    showIcon?: boolean;
    /** Plain content that scrolls here; a tahák's RefLayout scrolls its own body. */
    scrollable?: boolean;
    onClose?: () => void;
    children: Snippet;
  }

  let {
    title = 'Tahák a návod',
    closeLabel = 'Zavřít tahák',
    showIcon = true,
    scrollable = false,
    onClose = () => navigation.closeTahak(),
    children
  }: Props = $props();
</script>

<section class="tahak" aria-label={title}>
  <div class="tahak-head">
    {#if showIcon}
      <BookOpen size={20} weight="duotone" />
    {/if}
    <h2 class="tahak-title">{title}</h2>
    <button
      type="button"
      class="tahak-close"
      aria-label={closeLabel}
      onclick={() => {
        settings.vibrate(20);
        onClose();
      }}
    >
      <X size={20} weight="bold" />
    </button>
  </div>

  <div class="ref-wrapper" class:is-scrolling={scrollable}>
    {#if scrollable}
      <ScrollArea outset="var(--space-lg)">
        <div class="detail-content">
          {@render children()}
        </div>
      </ScrollArea>
    {:else}
      {@render children()}
    {/if}
  </div>
</section>

<style>
  .tahak {
    position: absolute;
    inset: 0;
    z-index: 50;
    display: flex;
    flex-direction: column;
    background-color: var(--color-bg-canvas);
  }

  .tahak-head {
    flex: none;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    height: var(--tap-min-size);
    padding-left: var(--space-lg);
    background-color: var(--color-surface-1);
    border-bottom: 1px solid var(--color-border-medium);
  }

  .tahak-title {
    flex: 1;
    margin: 0;
    font-size: var(--text-base);
    font-weight: 700;
  }

  .tahak-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--tap-min-size);
    height: var(--tap-min-size);
  }

  .tahak-close:active {
    background-color: var(--color-surface-active);
  }

  .ref-wrapper {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: var(--space-md) var(--space-lg) calc(var(--space-lg) + env(safe-area-inset-bottom, 0px));
    box-sizing: border-box;
    overflow: hidden;
  }

  /* The fades reach the edges, so the vertical padding moves inside the scrolled content */
  .ref-wrapper.is-scrolling {
    padding-top: 0;
    padding-bottom: 0;
  }

  .detail-content {
    padding: var(--space-md) 0 calc(var(--space-lg) + env(safe-area-inset-bottom, 0px));
  }
</style>
