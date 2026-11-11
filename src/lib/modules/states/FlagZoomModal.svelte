<script lang="ts">
  import PanZoomViewport from '../../components/ui/PanZoomViewport.svelte';
  import { settings } from '../../state/settings.svelte';
  import type { WorldFlagRecord } from '../../db/database.svelte';
  import {
    X,
    ArrowCounterClockwise,
    MagnifyingGlassPlus,
    MagnifyingGlassMinus
  } from 'phosphor-svelte';

  interface Props {
    open: boolean;
    flag: WorldFlagRecord | null;
    onClose: () => void;
  }

  let { open, flag, onClose }: Props = $props();

  let panZoomRef = $state<{
    resetView: (vibrate?: boolean) => void;
    getScale: () => number;
    getFitScale: () => number;
    zoomIn: (factor?: number) => void;
    zoomOut: (factor?: number) => void;
  } | null>(null);

  let currentScale = $state(1.0);

  // SVG namespaced for fullscreen zoom to guarantee 100% unique IDs in the DOM
  const fsSvg = $derived.by(() => {
    if (!flag?.svg_4x3) return '';
    return flag.svg_4x3.replaceAll('-4x3-', '-fs-');
  });

  const fitScale = $derived(panZoomRef?.getFitScale() ?? 1.0);
  const zoomPercent = $derived(Math.round((currentScale / Math.max(0.001, fitScale)) * 100));
  const isZoomed = $derived(currentScale > fitScale * 1.05);

  function handleClose() {
    settings.vibrate(20);
    onClose();
  }

  function handleReset() {
    settings.vibrate(20);
    panZoomRef?.resetView(false);
  }

  function handleZoomIn() {
    panZoomRef?.zoomIn(1.35);
  }

  function handleZoomOut() {
    panZoomRef?.zoomOut(1.35);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!open) return;
    if (e.key === 'Escape') {
      e.stopPropagation();
      handleClose();
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      handleZoomIn();
    } else if (e.key === '-') {
      e.preventDefault();
      handleZoomOut();
    } else if (e.key === '0') {
      e.preventDefault();
      handleReset();
    }
  }

  $effect(() => {
    if (open && flag && panZoomRef) {
      const t = setTimeout(() => {
        panZoomRef?.resetView(false);
      }, 50);
      return () => clearTimeout(t);
    }
  });

  // The detail view is a stacking context below the app header; the zoom must cover the header too
  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      }
    };
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if open && flag}
  <div
    use:portal
    class="flag-zoom-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Celoobrazovkový náhled vlajky: {flag.name_cs}"
  >
    <!-- Header Bar -->
    <header class="zoom-header">
      <div class="zoom-title-group">
        <h2 class="zoom-country-name">{flag.name_cs}</h2>
        <span class="zoom-country-code">
          {flag.code.toUpperCase()} / {flag.code3.toUpperCase()}
        </span>
      </div>

      <button
        type="button"
        class="zoom-close"
        onclick={handleClose}
        aria-label="Zavřít celoobrazovkový náhled (Esc)"
        title="Zavřít (Esc)"
      >
        <X size={20} weight="bold" />
      </button>
    </header>

    <!-- Fullscreen Viewport Area -->
    <div class="zoom-viewport-container">
      <PanZoomViewport
        bind:this={panZoomRef}
        bind:currentScale
        minScale={0.08}
        maxScale={12.0}
        initialScale={1.0}
        contentWidth={640}
        contentHeight={480}
        allowSinglePointerPan={true}
        doubleTapToZoom={true}
        class="flag-fs-viewport"
      >
        <div class="fullscreen-flag-stage">
          {@html fsSvg}
        </div>
      </PanZoomViewport>
    </div>

    <!-- Floating Bottom Dock -->
    <footer class="zoom-bottom-dock">
      <button
        type="button"
        class="dock-btn icon-btn"
        onclick={handleZoomOut}
        aria-label="Oddálit (-)"
        title="Oddálit (-)"
      >
        <MagnifyingGlassMinus size={18} weight="bold" />
      </button>

      <button
        type="button"
        class="dock-btn reset-btn"
        class:is-active={isZoomed}
        onclick={handleReset}
        aria-label="Obnovit původní velikost (0)"
        title="Obnovit původní velikost (0)"
      >
        <ArrowCounterClockwise size={15} weight="bold" />
        <span class="dock-zoom-val">{zoomPercent} %</span>
      </button>

      <button
        type="button"
        class="dock-btn icon-btn"
        onclick={handleZoomIn}
        aria-label="Přiblížit (+)"
        title="Přiblížit (+)"
      >
        <MagnifyingGlassPlus size={18} weight="bold" />
      </button>
    </footer>
  </div>
{/if}

<style>
  .flag-zoom-overlay {
    position: fixed;
    inset: 0;
    z-index: 350;
    background-color: var(--color-bg-canvas);
    display: flex;
    flex-direction: column;
    padding-top: env(safe-area-inset-top, 0px);
    overflow: hidden;
    user-select: none;
    touch-action: none;
  }

  .zoom-header {
    flex-shrink: 0;
    height: var(--header-height);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    padding: 0 var(--space-xs) 0 var(--space-lg);
    background-color: var(--color-surface-1);
    border-bottom: 1px solid var(--color-border-medium);
    z-index: 10;
  }

  .zoom-title-group {
    display: flex;
    flex-direction: column;
    gap: 1px;
    overflow: hidden;
    min-width: 0;
  }

  .zoom-country-name {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
  }

  .zoom-country-code {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    font-weight: 600;
  }

  .zoom-close {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--tap-min-size);
    height: var(--tap-min-size);
    color: var(--color-text-primary);
    touch-action: manipulation;
  }

  .zoom-close:active {
    background-color: var(--color-surface-active);
  }

  .zoom-viewport-container {
    flex: 1;
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  :global(.flag-fs-viewport) {
    background-color: var(--color-bg-canvas) !important;
  }

  .fullscreen-flag-stage {
    width: 640px;
    height: 480px;
    overflow: hidden;
    background-color: var(--color-surface-1);
  }

  .fullscreen-flag-stage :global(svg) {
    width: 100% !important;
    height: 100% !important;
    display: block !important;
  }

  .zoom-bottom-dock {
    position: absolute;
    bottom: max(var(--space-lg), env(safe-area-inset-bottom));
    left: 50%;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-medium);
    border-radius: var(--radius-full);
    z-index: 20;
  }

  .dock-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    height: 40px;
    border-radius: var(--radius-full);
    color: var(--color-text-primary);
    font-size: var(--text-xs);
    font-weight: 700;
    touch-action: manipulation;
  }

  .dock-btn:active {
    background-color: var(--color-surface-active);
  }

  .dock-btn.icon-btn {
    width: 40px;
  }

  .dock-btn.reset-btn {
    min-width: 84px;
    padding: 0 var(--space-md);
    background-color: var(--color-surface-3);
  }

  .dock-btn.reset-btn.is-active {
    color: var(--color-accent-primary);
    background-color: var(--color-accent-primary-subtle);
  }

  .dock-zoom-val {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }
</style>
