<script lang="ts">
  import type { Snippet } from 'svelte';

  /**
   * Vertical scroll container with its own quiet indicator instead of the system scrollbar
   * (which sits tight against the text, and on iOS only shows while scrolling).
   * - The thumb is always visible while the content overflows, in a gutter away from the text.
   * - The content fades out at an edge that has more behind it, so a list that ends exactly
   *   at the cut still reads as "continues".
   * The thumb is an indicator only: scrolling stays a finger on the content.
   */
  interface Props {
    children: Snippet;
    /**
     * Width of the parent's side padding the thumb may live in. The area reaches into it,
     * so the content keeps its edge and the thumb sits beside it, not on it.
     */
    outset?: string;
    /** The same on the left, for content that reaches into the parent's left padding (OptionRow). */
    outsetLeft?: string;
    class?: string;
    /** The scrolling element, for callers that reset or read the scroll position. */
    viewport?: HTMLDivElement | null;
  }

  let {
    children,
    outset = '0px',
    outsetLeft = '0px',
    class: customClass = '',
    viewport = $bindable(null)
  }: Props = $props();

  const TRACK_INSET = 4;
  const MIN_THUMB = 24;

  let canScroll = $state(false);
  let atTop = $state(true);
  let atBottom = $state(true);
  let thumbSize = $state(0);
  let thumbOffset = $state(0);

  function measure() {
    const el = viewport;
    if (!el) return;
    const { scrollHeight, clientHeight, scrollTop } = el;
    canScroll = scrollHeight > clientHeight + 1;
    atTop = scrollTop <= 1;
    atBottom = scrollTop + clientHeight >= scrollHeight - 1;
    const track = clientHeight - 2 * TRACK_INSET;
    thumbSize = Math.max(MIN_THUMB, (track * clientHeight) / Math.max(scrollHeight, 1));
    const range = scrollHeight - clientHeight;
    thumbOffset = range > 0 ? (track - thumbSize) * (scrollTop / range) : 0;
  }

  // Content can grow without the viewport changing size (tabs, lazy data), so watch both
  $effect(() => {
    const el = viewport;
    if (!el) return;
    const resize = new ResizeObserver(measure);
    const observeChildren = () => {
      for (const child of el.children) resize.observe(child);
    };
    resize.observe(el);
    observeChildren();
    const mutation = new MutationObserver(() => {
      observeChildren();
      measure();
    });
    mutation.observe(el, { childList: true, subtree: true, characterData: true });
    measure();
    return () => {
      resize.disconnect();
      mutation.disconnect();
    };
  });
</script>

<div class="scroll-area {customClass}" style:--scroll-outset={outset} style:--scroll-outset-left={outsetLeft}>
  <div
    bind:this={viewport}
    class="scroll-viewport"
    class:fade-top={canScroll && !atTop}
    class:fade-bottom={canScroll && !atBottom}
    onscroll={measure}
  >
    {@render children()}
  </div>

  {#if canScroll}
    <div class="scroll-track" aria-hidden="true">
      <div
        class="scroll-thumb"
        style:height="{thumbSize}px"
        style:transform="translateY({thumbOffset}px)"
      ></div>
    </div>
  {/if}
</div>

<style>
  .scroll-area {
    --fade-top: 0px;
    --fade-bottom: 0px;
    position: relative;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
    margin-right: calc(-1 * var(--scroll-outset));
    margin-left: calc(-1 * var(--scroll-outset-left));
  }

  .scroll-viewport {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding-right: max(var(--scroll-outset), 10px);
    padding-left: var(--scroll-outset-left);
    box-sizing: border-box;
    overflow-y: auto;
    overscroll-behavior: contain;
    touch-action: pan-y;
    scrollbar-width: none;
    -webkit-mask-image: linear-gradient(
      to bottom,
      transparent 0,
      #000 var(--fade-top),
      #000 calc(100% - var(--fade-bottom)),
      transparent 100%
    );
    mask-image: linear-gradient(
      to bottom,
      transparent 0,
      #000 var(--fade-top),
      #000 calc(100% - var(--fade-bottom)),
      transparent 100%
    );
  }

  .scroll-viewport::-webkit-scrollbar {
    display: none;
  }

  .scroll-viewport.fade-top {
    --fade-top: 20px;
  }

  .scroll-viewport.fade-bottom {
    --fade-bottom: 28px;
  }

  .scroll-track {
    position: absolute;
    top: 4px;
    bottom: 4px;
    right: 3px;
    width: 3px;
    border-radius: var(--radius-full);
    background-color: var(--color-border-subtle);
    pointer-events: none;
  }

  .scroll-thumb {
    width: 100%;
    border-radius: var(--radius-full);
    background-color: var(--color-text-muted);
  }

  @media (prefers-reduced-motion: no-preference) {
    .scroll-thumb {
      transition: height 0.12s ease;
    }
  }
</style>
