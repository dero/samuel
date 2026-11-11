<script lang="ts">
  import PanZoomViewport from '../../components/ui/PanZoomViewport.svelte';
  import ElementCard from './ElementCard.svelte';
  import {
    ELEMENTS,
    PLACEHOLDERS,
    GROUPS_META,
    PERIODS_META,
    type ChemicalElement
  } from './elementsData';
  import { elementsState } from './elementsState.svelte';
  import { onMount, untrack } from 'svelte';

  let panZoomRef = $state<{
    resetView: (vibrate?: boolean) => void;
    ensureVisible: (el: HTMLElement) => void;
    focusElement: (el: HTMLElement, targetScale?: number, vibrate?: boolean) => void;
  } | null>(null);

  let currentScale = $state(0.12);

  // LOD level based on actual render scale (visual cell = 150px * scale):
  // ~scale < 0.28: visual cell < 42px -> LOD 0
  // ~0.28 <= scale < 0.62: visual cell 42-93px -> LOD 1
  // ~scale >= 0.62: visual cell > 93px -> LOD 2
  //
  // A LOD switch re-renders all 118 cards (LOD 2 mounts/unmounts ~20 nodes per card) and
  // forces re-layout + re-raster of the whole zoomed layer. Two safeguards keep it off the
  // hot gesture path:
  //  1) Hysteresis – separate up/down thresholds, so finger jitter around a boundary
  //     cannot flip the LOD back and forth on every pointermove.
  //  2) Settle debounce – the LOD is committed only once the scale stops changing,
  //     so sweeping through LOD 1 on the way to LOD 2 never renders LOD 1 at all.
  const LOD_UP = [0.3, 0.66] as const; // enter LOD 1 / LOD 2 at or above
  const LOD_DOWN = [0.26, 0.58] as const; // drop to LOD 0 / LOD 1 below
  const LOD_SETTLE_MS = 110;

  function resolveLod(s: number, current: 0 | 1 | 2): 0 | 1 | 2 {
    let lod: number = current;
    while (lod < 2 && s >= LOD_UP[lod]) lod++;
    while (lod > 0 && s < LOD_DOWN[lod - 1]) lod--;
    return lod as 0 | 1 | 2;
  }

  let currentLod = $state<0 | 1 | 2>(resolveLod(0.12, 0));

  $effect(() => {
    const committed = untrack(() => currentLod);
    const next = resolveLod(currentScale, committed);
    if (next === committed) return;
    // Cleanup runs on every scale change -> acts as a trailing debounce
    const timer = setTimeout(() => {
      currentLod = next;
    }, LOD_SETTLE_MS);
    return () => clearTimeout(timer);
  });

  // Zoom level used when focusing a single element (search -> table, tap on unselected tile)
  const FOCUS_SCALE = 0.85;

  let wrapperRef: HTMLDivElement | null = $state(null);

  function findTile(z: number): HTMLElement | null {
    return wrapperRef?.querySelector<HTMLElement>(`[data-element-z="${z}"]`) ?? null;
  }

  function handleSelectElement(el: ChemicalElement) {
    // ElementCard already vibrates on tap -> no extra haptics here
    // The selected element (Fe at start) still zooms to its card
    if (elementsState.selectedElementZ !== el.z) elementsState.selectElement(el.z);
    const tile = findTile(el.z);
    if (tile) panZoomRef?.focusElement(tile, FOCUS_SCALE, false);
  }

  export function resetView() {
    panZoomRef?.resetView(false);
  }

  // Smooth zoom to element if navigated from search
  onMount(() => {
    if (elementsState.targetFocusZ && panZoomRef) {
      const zToFocus = elementsState.targetFocusZ;
      const timer = setTimeout(() => {
        const el = findTile(zToFocus);
        // No vibration here: we're inside a timer, and the "show in table" tap already vibrated
        if (el) {
          panZoomRef?.focusElement(el, FOCUS_SCALE, false);
        }
        elementsState.targetFocusZ = null;
      }, 70);
      return () => clearTimeout(timer);
    }
  });
</script>

<div class="elements-table-wrapper" bind:this={wrapperRef}>
  <!-- PanZoom Viewport with Semantic LOD Table -->
  <PanZoomViewport
    bind:this={panZoomRef}
    bind:currentScale
    minScale={0.07}
    maxScale={3.0}
    initialScale={0.12}
    autoFitOnMount={!elementsState.targetFocusZ}
  >
    <div class="periodic-grid-stage">
      <!-- Corner Cell (Row 1, Col 1) -->
      <div class="corner-header-cell" style="grid-row: 1; grid-column: 1;">
        <span class="corner-label font-mono">P \ S</span>
      </div>

      <!-- Column Headers: Groups 1 - 18 (Row 1, Cols 2..19) -->
      {#each GROUPS_META as g}
        <div
          class="group-header-cell lod-{currentLod}"
          style="grid-row: 1; grid-column: {g.group + 1};"
          title="Skupina {g.group} ({g.roman})"
        >
          <div class="group-header-content">
            <span class="group-num font-mono">{g.group}</span>
            <span class="group-roman font-mono">{g.roman}</span>
          </div>
        </div>
      {/each}

      <!-- Row Headers: Periods 1 - 7 (Rows 2..8, Col 1) -->
      {#each PERIODS_META as p}
        <div
          class="period-header-cell lod-{currentLod}"
          style="grid-row: {p + 1}; grid-column: 1;"
          title="{p}. perioda"
        >
          <span class="period-num font-mono">{p}</span>
          <span class="period-sub">per.</span>
        </div>
      {/each}

      <!-- Lanthanoid / Actinoid Row Headers (Col 1, Rows 10 & 11) -->
      <div
        class="period-header-cell la-header lod-{currentLod}"
        style="grid-row: 10; grid-column: 1;"
        title="Lanthanoidy"
      >
        <span class="period-num font-mono">La</span>
      </div>
      <div
        class="period-header-cell ac-header lod-{currentLod}"
        style="grid-row: 11; grid-column: 1;"
        title="Aktinoidy"
      >
        <span class="period-num font-mono">Ac</span>
      </div>

      <!-- 118 Elements (shifted by +1 in col & adjusted row) -->
      {#each ELEMENTS as element (element.z)}
        <ElementCard
          {element}
          gridRow={element.gridRow === 9 ? 10 : element.gridRow === 10 ? 11 : element.period + 1}
          gridCol={element.gridCol + 1}
          filter={elementsState.tacticalFilter}
          lod={currentLod}
          isSelected={elementsState.selectedElementZ === element.z}
          onClick={handleSelectElement}
        />
      {/each}

      <!-- Lanthanoid & Actinoid Placeholders in Rows 7 & 8 (Col 4) -->
      {#each PLACEHOLDERS as p}
        <div
          class="placeholder-tile placeholder-{p.category} lod-{currentLod}"
          style="grid-row: {p.gridRow + 1}; grid-column: {p.gridCol + 1};"
        >
          <span class="placeholder-symbols">{p.labelSymbols}</span>
          <span class="placeholder-range font-mono">{p.labelRange}</span>
          <span class="placeholder-name">{p.name}</span>
        </div>
      {/each}
    </div>
  </PanZoomViewport>
</div>

<style>
  .elements-table-wrapper {
    flex: 1;
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    background-color: var(--color-bg-canvas);
  }

  /* Periodic Table Grid Stage: Col 1 is 50px, Cols 2..19 are 150px; Row 1 is 50px */
  .periodic-grid-stage {
    display: grid;
    grid-template-columns: 50px repeat(18, 150px);
    grid-template-rows: 50px repeat(7, 168px) 24px repeat(2, 168px);
    gap: 4px;
    padding: 16px;
    box-sizing: border-box;
    width: max-content;
    height: max-content;
  }

  /* Corner Header Cell (P \ S) */
  .corner-header-cell {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs, 4px);
    box-sizing: border-box;
  }

  .corner-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-text-muted);
  }

  /* Group Header Cells (Row 1) */
  .group-header-cell {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs, 4px);
    box-sizing: border-box;
    user-select: none;
  }

  .group-header-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .group-header-cell.lod-0 .group-num {
    font-size: 26px;
    font-weight: 800;
    color: var(--color-text-secondary);
  }

  .group-header-cell.lod-0 .group-roman {
    display: none;
  }

  .group-header-cell:not(.lod-0) .group-num {
    font-size: 18px;
    font-weight: 800;
    color: var(--color-text-primary);
    margin-bottom: 2px;
  }

  .group-header-cell:not(.lod-0) .group-roman {
    display: inline-block;
    font-size: 11px;
    font-weight: 700;
    color: var(--color-text-muted);
  }

  /* Period Header Cells (Col 1) */
  .period-header-cell {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs, 4px);
    box-sizing: border-box;
    user-select: none;
    gap: 4px;
  }

  .period-num {
    font-size: 32px;
    font-weight: 800;
    color: var(--color-text-secondary);
    line-height: 1;
  }

  .period-sub {
    display: none;
  }

  .period-header-cell.lod-2 .period-sub {
    display: inline-block;
    font-size: 10px;
    color: var(--color-text-muted);
    font-family: var(--font-sans);
    line-height: 1;
  }

  .la-header {
    border-color: rgba(236, 72, 153, 0.4);
    color: #ec4899;
  }

  .ac-header {
    border-color: rgba(139, 92, 246, 0.4);
    color: #8b5cf6;
  }

  /* Placeholders for Lanthanoids & Actinoids */
  .placeholder-tile {
    width: 100%;
    height: 100%;
    aspect-ratio: 1 / 1.12;
    box-sizing: border-box;
    border-radius: var(--radius-sm, 6px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    user-select: none;
    text-align: center;
    border: 1px dashed var(--color-border-subtle);
  }

  .placeholder-lanthanoid {
    background-color: rgba(236, 72, 153, 0.08);
    border-color: rgba(236, 72, 153, 0.4);
    color: #ec4899;
  }

  .placeholder-actinoid {
    background-color: rgba(139, 92, 246, 0.08);
    border-color: rgba(139, 92, 246, 0.4);
    color: #8b5cf6;
  }

  .placeholder-symbols {
    font-weight: 900;
    line-height: 1;
    letter-spacing: -1px;
  }

  .placeholder-tile.lod-0 .placeholder-symbols {
    font-size: 52px;
  }

  .placeholder-tile.lod-0 .placeholder-range,
  .placeholder-tile.lod-0 .placeholder-name {
    display: none;
  }

  .placeholder-tile.lod-1 .placeholder-symbols {
    font-size: 46px;
    margin-bottom: 4px;
  }

  .placeholder-tile.lod-1 .placeholder-range {
    display: inline-block;
    font-size: 22px;
    font-weight: 700;
    color: var(--color-text-secondary);
    background-color: rgba(0, 0, 0, 0.45);
    border: 1px solid var(--color-border-subtle);
    padding: 2px 8px;
    border-radius: var(--radius-xs, 4px);
    line-height: 1;
  }

  .placeholder-tile.lod-1 .placeholder-name {
    display: none;
  }

  .placeholder-tile.lod-2 {
    justify-content: space-between;
    padding: 12px 8px;
  }

  .placeholder-tile.lod-2 .placeholder-range {
    display: inline-block;
    font-size: 12px;
    font-weight: 700;
    color: var(--color-text-secondary);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    padding: 2px 6px;
    border-radius: var(--radius-xs, 4px);
    line-height: 1;
  }

  .placeholder-tile.lod-2 .placeholder-symbols {
    font-size: 28px;
    font-weight: 800;
    margin: 4px 0;
  }

  .placeholder-tile.lod-2 .placeholder-name {
    display: block;
    font-size: 11px;
    font-weight: 700;
    color: var(--color-text-secondary);
  }

  .font-mono {
    font-family: var(--font-mono, monospace);
  }
</style>
