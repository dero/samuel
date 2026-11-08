<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import ColorsReference from './ColorsReference.svelte';
  import SegmentedControl from '../../components/ui/SegmentedControl.svelte';
  import { settings } from '../../state/settings.svelte';
  import { ArrowClockwise } from 'phosphor-svelte';
  import { applyRgbFilter, applyCmyFilter } from './colorsFilter';
  import { colorsPhoto } from './colorsPhoto.svelte';

  type ColorModel = 'rgb' | 'cmy';
  type Channel = 'r' | 'g' | 'b' | 'c' | 'm' | 'y';

  const CHANNELS: Record<ColorModel, { id: Channel; color: string; label: string }[]> = {
    rgb: [
      { id: 'r', color: '#ef4444', label: 'Červený kanál (R)' },
      { id: 'g', color: '#22c55e', label: 'Zelený kanál (G)' },
      { id: 'b', color: '#3b82f6', label: 'Modrý kanál (B)' }
    ],
    cmy: [
      { id: 'c', color: '#06b6d4', label: 'Azurová vrstva (C)' },
      { id: 'm', color: '#d946ef', label: 'Purpurová vrstva (M)' },
      { id: 'y', color: '#eab308', label: 'Žlutá vrstva (Y)' }
    ]
  };

  let colorModel = $state<ColorModel>('rgb');
  let channelsOn = $state<Record<Channel, boolean>>({ r: true, g: true, b: true, c: true, m: true, y: true });

  let canvasEl = $state<HTMLCanvasElement | null>(null);
  let targetImageData: ImageData | null = null;

  // Pan and pinch-to-zoom state
  let zoom = $state(1);
  let panX = $state(0);
  let panY = $state(0);

  // Active pointers map for pinch gesture
  const activePointers = new Map<number, { x: number; y: number }>();
  let lastPanPoint = { x: 0, y: 0 };
  let initialPinchDist = 0;
  let initialPinchZoom = 1;

  // Redraw whenever the photo, the model or a channel changes
  $effect(() => {
    const source = colorsPhoto.source;
    if (!canvasEl || !source) return;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    if (canvasEl.width !== source.width || canvasEl.height !== source.height) {
      canvasEl.width = source.width;
      canvasEl.height = source.height;
    }

    if (!targetImageData || targetImageData.width !== source.width || targetImageData.height !== source.height) {
      targetImageData = ctx.createImageData(source.width, source.height);
    }

    if (colorModel === 'rgb') {
      applyRgbFilter(source.data, targetImageData.data, channelsOn.r, channelsOn.g, channelsOn.b);
    } else {
      applyCmyFilter(source.data, targetImageData.data, channelsOn.c, channelsOn.m, channelsOn.y);
    }

    ctx.putImageData(targetImageData, 0, 0);
  });

  // A new photo starts unzoomed
  $effect(() => {
    if (colorsPhoto.source) resetTransform();
  });

  function toggleChannel(channel: Channel) {
    settings.vibrate(20);
    channelsOn[channel] = !channelsOn[channel];
  }

  function resetTransform() {
    zoom = 1;
    panX = 0;
    panY = 0;
  }

  // Pointer & Pinch-to-zoom handlers
  function handlePointerDown(e: PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.size === 1) {
      lastPanPoint = { x: e.clientX, y: e.clientY };
    } else if (activePointers.size === 2) {
      const [p1, p2] = Array.from(activePointers.values());
      initialPinchDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      initialPinchZoom = zoom;
    }
  }

  function handlePointerMove(e: PointerEvent) {
    if (!activePointers.has(e.pointerId)) return;
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.size === 1) {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      panX += dx;
      panY += dy;
      lastPanPoint = { x: e.clientX, y: e.clientY };
    } else if (activePointers.size === 2) {
      const [p1, p2] = Array.from(activePointers.values());
      const currentDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (initialPinchDist > 0) {
        const factor = currentDist / initialPinchDist;
        zoom = Math.min(Math.max(0.5, initialPinchZoom * factor), 8);
      }
    }
  }

  function handlePointerUp(e: PointerEvent) {
    activePointers.delete(e.pointerId);
    if (activePointers.size === 1) {
      const remaining = Array.from(activePointers.values())[0];
      lastPanPoint = { x: remaining.x, y: remaining.y };
    }
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    zoom = Math.min(Math.max(0.5, zoom * factor), 8);
  }
</script>

<ModuleShell
  title="Barvy"
  podklad={{
    kind: 'image',
    required: true,
    empty: !colorsPhoto.source,
    title: 'Fotografie šifry',
    description: 'Barevné vrstvy fotky se oddělí přes kanály RGB nebo CMY.',
    preview: colorsPhoto.previewUrl,
    onFile: (file) => colorsPhoto.load(file),
    onClear: () => colorsPhoto.clear()
  }}
>
  <!-- ZONE-OUTPUT: Viewport with the filtered photo -->
  {#snippet output()}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="canvas-viewport"
      role="region"
      aria-label="Plátno s fotografií šifry"
      onpointerdown={handlePointerDown}
      onpointermove={handlePointerMove}
      onpointerup={handlePointerUp}
      onpointercancel={handlePointerUp}
      onwheel={handleWheel}
    >
      <!-- Canvas Stage with CSS Transform -->
      <div
        class="canvas-stage"
        style:transform="translate({panX}px, {panY}px) scale({zoom})"
      >
        <canvas bind:this={canvasEl}></canvas>
      </div>

      {#if zoom !== 1 || panX !== 0 || panY !== 0}
        <button
          type="button"
          class="reset-zoom-btn"
          onclick={() => {
            settings.vibrate(15);
            resetTransform();
          }}
          aria-label="Obnovit zvětšení na 1×"
          title="Obnovit zvětšení"
        >
          <ArrowClockwise size={14} weight="bold" />
          <span>{Math.round(zoom * 100)} %</span>
        </button>
      {/if}
    </div>
  {/snippet}

  <!-- ZONE-INPUT: Sub-Toolbar and Filters -->
  {#snippet input()}
    <div class="zone-input-flow">
      <!-- 1. Sub-Toolbar: Model Switch (36 px) -->
      <div class="subtoolbar-container">
        <SegmentedControl
          options={[
            { id: 'rgb', label: 'RGB' },
            { id: 'cmy', label: 'CMY' }
          ]}
          value={colorModel}
          size="sm"
          ariaLabel="Barevný model"
          onChange={(newModel) => {
            colorModel = newModel as ColorModel;
          }}
        />
      </div>

      <!-- 2. Channel Filter Switches (in the style of FlagsModule) -->
      <div class="color-filter-group" role="group" aria-label="Kanály barevného filtru">
        {#each CHANNELS[colorModel] as channel (channel.id)}
          <button
            type="button"
            class="color-filter-btn"
            class:is-active={channelsOn[channel.id]}
            onclick={() => toggleChannel(channel.id)}
            aria-pressed={channelsOn[channel.id]}
            aria-label={channel.label}
          >
            <span
              class="color-swatch"
              style:background-color={channel.color}
              style:border-color={channel.color}
            ></span>
            <span class="color-name">{channel.id.toUpperCase()}</span>
          </button>
        {/each}
      </div>
    </div>
  {/snippet}

  <!-- REFERENCE CHEAT SHEET -->
  {#snippet reference()}
    <ColorsReference activeTool={colorModel} />
  {/snippet}
</ModuleShell>

<style>
  /* Viewport Zone */
  .canvas-viewport {
    flex: 1;
    width: 100%;
    height: 100%;
    min-height: var(--output-min-height);
    background-color: #000000;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: none;
    user-select: none;
  }

  .canvas-stage {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transform-origin: center center;
    will-change: transform;
    pointer-events: none;
    padding: var(--space-sm);
    box-sizing: border-box;
  }

  .canvas-stage canvas {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
    display: block;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
  }






  .reset-zoom-btn {
    position: absolute;
    top: var(--space-sm);
    right: var(--space-sm);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: var(--radius-xs);
    background-color: rgba(20, 20, 20, 0.85);
    border: 1px solid var(--color-border-subtle);
    color: var(--color-text-primary);
    font-size: calc(11px * var(--font-scale));
    font-weight: 600;
    backdrop-filter: blur(8px);
    cursor: pointer;
    z-index: 10;
  }

  .reset-zoom-btn:active {
    background-color: var(--color-surface-active);
  }

  /* Zone Input Flow */
  .zone-input-flow {
    display: flex;
    flex-direction: column;
    gap: var(--zone-input-gap);
    width: 100%;
  }

  .subtoolbar-container {
    height: var(--subtoolbar-height, 36px);
    min-height: var(--subtoolbar-height, 36px);
    overflow: hidden;
    width: 100%;
    display: flex;
  }



  .color-filter-group {
    width: 100%;
    height: 36px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
    background-color: #000000;
    padding: 2px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border-subtle);
    box-sizing: border-box;
  }

  /* Tactile Filter Button in Samuel design system */
  .color-filter-btn {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 100%;
    background-color: var(--color-surface-2);
    border: none;
    border-radius: 2px;
    padding: 0 6px;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.10),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    transition: background-color 0.12s ease, box-shadow 0.08s ease;
    touch-action: manipulation;
    box-sizing: border-box;
    cursor: pointer;
  }

  .color-filter-btn:active {
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
  }


  /* Swatch: filled circle when ON, hollow ring when OFF */
  .color-swatch {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid;
    box-sizing: border-box;
    transition: background-color 0.15s ease, box-shadow 0.12s ease;
    flex-shrink: 0;
  }

  .color-filter-btn.is-active .color-swatch {
    box-shadow: 0 0 4px rgba(255, 255, 255, 0.25);
  }

  .color-filter-btn:not(.is-active) .color-swatch {
    background-color: transparent !important;
  }

  .color-name {
    font-family: var(--font-condensed);
    font-size: calc(13px * var(--font-scale));
    font-weight: 700;
    letter-spacing: 0.3px;
    line-height: 1;
    transition: color 0.12s ease;
  }

  .color-filter-btn.is-active .color-name {
    color: var(--color-text-primary);
  }

  .color-filter-btn:not(.is-active) .color-name {
    color: var(--color-text-secondary);
  }
</style>
