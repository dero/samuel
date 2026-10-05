<script lang="ts">
  import { tick } from 'svelte';
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import ColorsReference from './ColorsReference.svelte';
  import SegmentedControl from '../../components/ui/SegmentedControl.svelte';
  import HoldToAction from '../../components/ui/HoldToAction.svelte';
  import { settings } from '../../state/settings.svelte';
  import { Camera, Image as ImageIcon, ArrowClockwise } from 'phosphor-svelte';
  import { applyRgbFilter, applyCmyFilter, getScaledDimensions } from './colorsFilter';

  type ColorModel = 'rgb' | 'cmy';

  let colorModel = $state<ColorModel>('rgb');
  let rgbChannels = $state({ r: true, g: true, b: true });
  let cmyChannels = $state({ c: true, m: true, y: true });

  let imageLoaded = $state(false);
  let canvasEl = $state<HTMLCanvasElement | null>(null);
  let fileInputEl = $state<HTMLInputElement | null>(null);

  // Cached raw image data
  let sourceImageData = $state<ImageData | null>(null);
  let targetImageData: ImageData | null = null;
  let imgWidth = $state(0);
  let imgHeight = $state(0);

  // Pan and pinch-to-zoom state
  let zoom = $state(1);
  let panX = $state(0);
  let panY = $state(0);

  // Active pointers map for pinch gesture
  const activePointers = new Map<number, { x: number; y: number }>();
  let lastPanPoint = { x: 0, y: 0 };
  let initialPinchDist = 0;
  let initialPinchZoom = 1;

  function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    loadImageFromFile(file);
    input.value = '';
  }

  function loadImageFromFile(file: File) {
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const src = loadEvt.target?.result as string;
      if (!src) return;
      const img = new Image();
      img.onload = () => {
        setupImage(img);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }

  async function setupImage(img: HTMLImageElement) {
    const { width, height } = getScaledDimensions(img.width, img.height, 1600);
    imgWidth = width;
    imgHeight = height;

    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
    if (!offCtx) return;

    offCtx.drawImage(img, 0, 0, width, height);
    sourceImageData = offCtx.getImageData(0, 0, width, height);

    imageLoaded = true;
    resetTransform();

    await tick();

    if (canvasEl) {
      canvasEl.width = width;
      canvasEl.height = height;
      const ctx = canvasEl.getContext('2d');
      if (ctx) {
        targetImageData = ctx.createImageData(width, height);
      }
      applyActiveFilters();
    }
  }

  function applyActiveFilters() {
    if (!canvasEl || !sourceImageData) return;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    if (canvasEl.width !== imgWidth || canvasEl.height !== imgHeight) {
      canvasEl.width = imgWidth;
      canvasEl.height = imgHeight;
    }

    if (!targetImageData || targetImageData.width !== imgWidth || targetImageData.height !== imgHeight) {
      targetImageData = ctx.createImageData(imgWidth, imgHeight);
    }

    if (colorModel === 'rgb') {
      applyRgbFilter(
        sourceImageData.data,
        targetImageData.data,
        rgbChannels.r,
        rgbChannels.g,
        rgbChannels.b
      );
    } else {
      applyCmyFilter(
        sourceImageData.data,
        targetImageData.data,
        cmyChannels.c,
        cmyChannels.m,
        cmyChannels.y
      );
    }

    ctx.putImageData(targetImageData, 0, 0);
  }

  function toggleChannel(channel: 'r' | 'g' | 'b' | 'c' | 'm' | 'y') {
    settings.vibrate(20);
    if (channel === 'r') rgbChannels.r = !rgbChannels.r;
    else if (channel === 'g') rgbChannels.g = !rgbChannels.g;
    else if (channel === 'b') rgbChannels.b = !rgbChannels.b;
    else if (channel === 'c') cmyChannels.c = !cmyChannels.c;
    else if (channel === 'm') cmyChannels.m = !cmyChannels.m;
    else if (channel === 'y') cmyChannels.y = !cmyChannels.y;
    applyActiveFilters();
  }

  function resetTransform() {
    zoom = 1;
    panX = 0;
    panY = 0;
  }

  function handleReset() {
    settings.vibrate(30);
    imageLoaded = false;
    sourceImageData = null;
    targetImageData = null;
    rgbChannels = { r: true, g: true, b: true };
    cmyChannels = { c: true, m: true, y: true };
    resetTransform();
  }

  // Pointer & Pinch-to-zoom handlers
  function handlePointerDown(e: PointerEvent) {
    if (!imageLoaded) return;
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
    if (!imageLoaded || !activePointers.has(e.pointerId)) return;
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
    if (!imageLoaded) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    zoom = Math.min(Math.max(0.5, zoom * factor), 8);
  }

  // Effect to re-render filters when model changes
  $effect(() => {
    if (imageLoaded) {
      // track model change
      const _m = colorModel;
      applyActiveFilters();
    }
  });
</script>

<ModuleShell title="Barvy">
  <!-- ZONE-OUTPUT: Viewport with Canvas or Empty State -->
  {#snippet output()}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="canvas-viewport"
      class:has-image={imageLoaded}
      role="region"
      aria-label="Plátno s fotografií šifry"
      onpointerdown={handlePointerDown}
      onpointermove={handlePointerMove}
      onpointerup={handlePointerUp}
      onpointercancel={handlePointerUp}
      onwheel={handleWheel}
    >
      {#if !imageLoaded}
        <div class="empty-upload-state">
          <div class="empty-icon-circle">
            <Camera size={36} weight="duotone" />
          </div>
          <button
            type="button"
            class="upload-trigger-btn"
            onclick={() => {
              settings.vibrate(20);
              fileInputEl?.click();
            }}
          >
            <ImageIcon size={18} weight="bold" />
            <span>Vyfotit nebo vybrat šifru</span>
          </button>
                  </div>
      {:else}
        <!-- Canvas Stage with CSS Transform -->
        <div
          class="canvas-stage"
          style:transform="translate({panX}px, {panY}px) scale({zoom})"
        >
          <canvas bind:this={canvasEl} width={imgWidth} height={imgHeight}></canvas>
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
      {/if}

      <!-- Hidden File Input -->
      <input
        bind:this={fileInputEl}
        type="file"
        accept="image/*"
        class="hidden-file-input"
        onchange={handleFileSelect}
      />
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

      <!-- 2. Controls Row: HoldToAction (left) + Channel Filters (right) -->
      <div class="colors-control-row">
        <!-- Clear Photo Button (Hold to action) -->
        <div class="clear-btn-wrap">
          <HoldToAction
            variant="icon-only"
            disabled={!imageLoaded}
            onAction={handleReset}
            ariaLabel="Podržte pro vymazání fotografie"
          />
        </div>

        <!-- Channel Filter Switches (in the style of FlagsModule) -->
        <div class="color-filter-group" role="group" aria-label="Kanály barevného filtru">
          {#if colorModel === 'rgb'}
            <!-- Red Channel -->
            <button
              type="button"
              class="color-filter-btn"
              class:is-active={rgbChannels.r}
              disabled={!imageLoaded}
              onclick={() => toggleChannel('r')}
              aria-pressed={rgbChannels.r}
              aria-label="Červený kanál (R)"
            >
              <span
                class="color-swatch"
                style:background-color="#ef4444"
                style:border-color="#ef4444"
              ></span>
              <span class="color-name">R</span>
            </button>

            <!-- Green Channel -->
            <button
              type="button"
              class="color-filter-btn"
              class:is-active={rgbChannels.g}
              disabled={!imageLoaded}
              onclick={() => toggleChannel('g')}
              aria-pressed={rgbChannels.g}
              aria-label="Zelený kanál (G)"
            >
              <span
                class="color-swatch"
                style:background-color="#22c55e"
                style:border-color="#22c55e"
              ></span>
              <span class="color-name">G</span>
            </button>

            <!-- Blue Channel -->
            <button
              type="button"
              class="color-filter-btn"
              class:is-active={rgbChannels.b}
              disabled={!imageLoaded}
              onclick={() => toggleChannel('b')}
              aria-pressed={rgbChannels.b}
              aria-label="Modrý kanál (B)"
            >
              <span
                class="color-swatch"
                style:background-color="#3b82f6"
                style:border-color="#3b82f6"
              ></span>
              <span class="color-name">B</span>
            </button>
          {:else}
            <!-- Cyan Channel -->
            <button
              type="button"
              class="color-filter-btn"
              class:is-active={cmyChannels.c}
              disabled={!imageLoaded}
              onclick={() => toggleChannel('c')}
              aria-pressed={cmyChannels.c}
              aria-label="Azurová vrstva (C)"
            >
              <span
                class="color-swatch"
                style:background-color="#06b6d4"
                style:border-color="#06b6d4"
              ></span>
              <span class="color-name">C</span>
            </button>

            <!-- Magenta Channel -->
            <button
              type="button"
              class="color-filter-btn"
              class:is-active={cmyChannels.m}
              disabled={!imageLoaded}
              onclick={() => toggleChannel('m')}
              aria-pressed={cmyChannels.m}
              aria-label="Purpurová vrstva (M)"
            >
              <span
                class="color-swatch"
                style:background-color="#d946ef"
                style:border-color="#d946ef"
              ></span>
              <span class="color-name">M</span>
            </button>

            <!-- Yellow Channel -->
            <button
              type="button"
              class="color-filter-btn"
              class:is-active={cmyChannels.y}
              disabled={!imageLoaded}
              onclick={() => toggleChannel('y')}
              aria-pressed={cmyChannels.y}
              aria-label="Žlutá vrstva (Y)"
            >
              <span
                class="color-swatch"
                style:background-color="#eab308"
                style:border-color="#eab308"
              ></span>
              <span class="color-name">Y</span>
            </button>
          {/if}
        </div>
      </div>
    </div>
  {/snippet}

  <!-- REFERENCE CHEAT SHEET -->
  {#snippet reference()}
    <ColorsReference />
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

  /* Empty state */
  .empty-upload-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-md);
    padding: var(--space-xl) var(--space-md);
    text-align: center;
    pointer-events: auto;
  }

  .empty-icon-circle {
    width: 64px;
    height: 64px;
    border-radius: var(--radius-full, 9999px);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-accent-primary);
  }

  .upload-trigger-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    padding: 10px 18px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.12s ease, border-color 0.12s ease;
  }

  .upload-trigger-btn:active {
    background-color: var(--color-surface-active);
  }

  .hidden-file-input {
    display: none;
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
    font-size: 11px;
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

  .colors-control-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    width: 100%;
    height: 36px;
  }

  .clear-btn-wrap {
    flex: 0 0 36px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .color-filter-group {
    flex: 1;
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

  .color-filter-btn:disabled {
    cursor: not-allowed;
    opacity: 0.35;
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
    font-size: 13px;
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
