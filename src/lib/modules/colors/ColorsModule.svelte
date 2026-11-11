<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import ColorsReference from './ColorsReference.svelte';
  import Chassis from '../../components/ui/Chassis.svelte';
  import Keycap from '../../components/ui/Keycap.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import { ArrowClockwise } from 'phosphor-svelte';
  import { applyRgbFilter, applyCmyFilter } from './colorsFilter';
  import { colorsPhoto } from './colorsPhoto.svelte';

  type ColorModel = 'rgb' | 'cmy';
  type Channel = 'r' | 'g' | 'b' | 'c' | 'm' | 'y';

  // Swatch colours are content: they name the channel, the Keycap shows whether it is on
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

  const MODEL_OPTIONS: SegmentOption<ColorModel>[] = [
    { id: 'rgb', label: 'RGB' },
    { id: 'cmy', label: 'CMY' }
  ];

  const ALL_CHANNELS_ON: Record<Channel, boolean> = { r: true, g: true, b: true, c: true, m: true, y: true };

  let colorModel = $state<ColorModel>('rgb');
  let channelsOn = $state<Record<Channel, boolean>>({ ...ALL_CHANNELS_ON });

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

  const isTransformed = $derived(zoom !== 1 || panX !== 0 || panY !== 0);

  // What the photo shows now
  const filterStatus = $derived.by(() => {
    const channels = CHANNELS[colorModel];
    const on = channels.filter((ch) => channelsOn[ch.id]).map((ch) => ch.id.toUpperCase());
    if (on.length === channels.length) return 'Původní barvy';
    if (colorModel === 'rgb') {
      if (on.length === 0) return 'Žádný kanál, vše černé';
      return on.length === 1 ? `Jen kanál ${on[0]}` : `Kanály ${on.join(' + ')}`;
    }
    if (on.length === 0) return 'Žádná vrstva, vše bílé';
    return on.length === 1 ? `Jen vrstva ${on[0]}` : `Vrstvy ${on.join(' + ')}`;
  });

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
    channelsOn[channel] = !channelsOn[channel];
  }

  function resetTransform() {
    zoom = 1;
    panX = 0;
    panY = 0;
  }

  // Photo and channels back to defaults; the colour model is the variant and stays
  function handleReset() {
    colorsPhoto.clear();
    channelsOn = { ...ALL_CHANNELS_ON };
    resetTransform();
  }

  // Pointer & Pinch-to-zoom handlers (read-only photo: one finger pans)
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
  onReset={handleReset}
  podklad={{
    kind: 'image',
    required: true,
    empty: !colorsPhoto.source && !colorsPhoto.loading,
    title: 'Fotografie šifry',
    description: 'Barevné vrstvy fotky se oddělí přes kanály RGB nebo CMY.',
    preview: colorsPhoto.previewUrl,
    onFile: (file) => colorsPhoto.load(file),
    onClear: () => colorsPhoto.clear()
  }}
  bar={{
    empty: !colorsPhoto.source,
    hint: 'Vyfoťte nebo vyberte fotku šifry.',
    status: filterStatus,
    action: isTransformed
      ? {
          label: `${Math.round(zoom * 100)} %`,
          icon: ArrowClockwise,
          title: 'Obnovit zvětšení na 100 %',
          onClick: resetTransform
        }
      : undefined
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
      <div
        class="canvas-stage"
        style:transform="translate({panX}px, {panY}px) scale({zoom})"
      >
        <canvas bind:this={canvasEl}></canvas>
      </div>
    </div>
  {/snippet}

  {#snippet variants()}
    <SegmentedControl
      options={MODEL_OPTIONS}
      value={colorModel}
      size="sm"
      ariaLabel="Barevný model"
      onChange={(model) => {
        colorModel = model;
      }}
    />
  {/snippet}

  <!-- ZONE-INPUT: channel toggles -->
  {#snippet input()}
    <Chassis columns={3} keyHeight="42px">
      {#each CHANNELS[colorModel] as channel (channel.id)}
        <Keycap
          selected={channelsOn[channel.id]}
          title={channel.label}
          ariaLabel="{channel.label}: {channelsOn[channel.id] ? 'zapnuto' : 'vypnuto'}"
          onPress={() => toggleChannel(channel.id)}
        >
          <span class="channel-key">
            <span class="channel-swatch" style:background-color={channel.color}></span>
            <span class="channel-name">{channel.id.toUpperCase()}</span>
          </span>
        </Keycap>
      {/each}
    </Chassis>
  {/snippet}

  <!-- REFERENCE CHEAT SHEET -->
  {#snippet reference()}
    <ColorsReference activeTool={colorModel} />
  {/snippet}
</ModuleShell>

<style>
  .canvas-viewport {
    flex: 1;
    width: 100%;
    height: 100%;
    background-color: var(--color-bg-canvas);
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
  }

  /* The swatch is content; on/off is the Keycap's own fill and ring */
  .channel-key {
    display: flex;
    align-items: center;
    gap: 0.3em;
    font-family: var(--font-mono);
    font-size: min(var(--key-m), 60cqh);
    font-weight: 800;
    line-height: 1;
  }

  .channel-swatch {
    width: 0.6em;
    height: 0.6em;
    border-radius: 50%;
    flex-shrink: 0;
  }
</style>
