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
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if open && flag}
  <div
    class="flag-zoom-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Celoobrazovkový náhled vlajky: {flag.name_cs}"
  >
    <!-- Header Bar -->
    <header class="zoom-header">
      <div class="zoom-title-group">
        <h2 class="zoom-country-name">{flag.name_cs}</h2>
        <span class="zoom-country-code font-mono">
          {flag.code.toUpperCase()} / {flag.code3.toUpperCase()}
        </span>
      </div>

      <div class="zoom-header-actions">
        <button
          type="button"
          class="zoom-header-btn close-btn"
          onclick={handleClose}
          aria-label="Zavřít celoobrazovkový náhled (Esc)"
          title="Zavřít (Esc)"
        >
          <X size={20} weight="bold" />
        </button>
      </div>
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
        <span class="dock-zoom-val font-mono">{zoomPercent}%</span>
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
    background-color: #000000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    user-select: none;
    touch-action: none;
  }

  .zoom-header {
    flex-shrink: 0;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-md);
    background-color: rgba(18, 18, 20, 0.88);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--color-border-subtle);
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
    font-size: calc(11px * var(--font-scale));
    color: var(--color-text-secondary);
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .zoom-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .zoom-header-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    cursor: pointer;
    touch-action: manipulation;
    transition: background-color 0.12s, transform 0.08s;
  }

  .zoom-header-btn:active {
    background-color: var(--color-surface-active);
    transform: scale(0.95);
  }

  .zoom-viewport-container {
    flex: 1;
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  :global(.flag-fs-viewport) {
    background-color: #000000 !important;
  }

  .fullscreen-flag-stage {
    width: 640px;
    height: 480px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-1);
    border-radius: var(--radius-xs);
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7);
  }

  .fullscreen-flag-stage :global(svg) {
    width: 100% !important;
    height: 100% !important;
    display: block !important;
  }

  .zoom-bottom-dock {
    position: absolute;
    bottom: max(16px, env(safe-area-inset-bottom));
    left: 50%;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px;
    background-color: rgba(22, 22, 26, 0.9);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: var(--radius-full);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.75);
    z-index: 20;
  }

  .dock-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    height: 38px;
    background: transparent;
    border: none;
    border-radius: var(--radius-full);
    color: var(--color-text-primary);
    font-size: calc(12px * var(--font-scale));
    font-weight: 600;
    cursor: pointer;
    touch-action: manipulation;
    transition: background-color 0.12s, transform 0.08s;
  }

  .dock-btn:active {
    background-color: rgba(255, 255, 255, 0.14);
    transform: scale(0.95);
  }

  .dock-btn.icon-btn {
    width: 38px;
    padding: 0;
  }

  .dock-btn.reset-btn {
    min-width: 80px;
    padding: 0 12px;
    background-color: rgba(255, 255, 255, 0.08);
  }

  .dock-btn.reset-btn.is-active {
    color: var(--color-accent-primary);
    background-color: rgba(0, 210, 255, 0.12);
  }

  .dock-zoom-val {
    font-size: calc(12px * var(--font-scale));
    letter-spacing: 0.3px;
  }
</style>
