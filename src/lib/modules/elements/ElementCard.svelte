<script lang="ts">
  import {
    type ChemicalElement,
    type TacticalFilter,
    getElementFilterStyle,
    getStateLabel,
    isElementRadioactive
  } from './elementsData';
  import { copyToClipboard } from '../../utils/clipboard';
  import { settings } from '../../state/settings.svelte';

  interface Props {
    element: ChemicalElement;
    filter?: TacticalFilter;
    lod?: 0 | 1 | 2;
    isSelected?: boolean;
    isInteractive?: boolean;
    gridRow?: number;
    gridCol?: number;
    onClick?: (element: ChemicalElement) => void;
  }

  let {
    element,
    filter = 'none',
    lod = 2,
    isSelected = false,
    isInteractive = true,
    gridRow,
    gridCol,
    onClick
  }: Props = $props();

  const visualStyle = $derived(getElementFilterStyle(element, filter));
  const isRad = $derived(isElementRadioactive(element));

  function handleClick(e: MouseEvent) {
    if (!isInteractive) return;
    if (onClick) {
      settings.vibrate(20);
      onClick(element);
    } else {
      // Default: copy element summary
      copyElementInfo();
    }
  }

  function copyElementInfo() {
    settings.vibrate(25);
    const summary = `${element.z}. ${element.symbol} – ${element.nameCs} (${element.nameLa}), Ar ${element.atomicMass}`;
    copyToClipboard(summary, `${element.symbol} zkopírováno`);
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="element-tile lod-{lod}"
  class:is-selected={isSelected}
  class:is-dimmed={visualStyle.dimmed}
  class:is-interactive={isInteractive}
  class:is-rad={isRad}
  data-element-z={element.z}
  style="--elem-color: {visualStyle.color}; --elem-bg: {visualStyle.bgTint}; --elem-border: {visualStyle.borderTint}; {gridRow ? `grid-row: ${gridRow};` : ''} {gridCol ? `grid-column: ${gridCol};` : ''}"
  onclick={handleClick}
  title="{element.z}. {element.symbol} – {element.nameCs} ({element.nameLa}){isRad ? ' ☢' : ''}"
>
  {#if lod <= 1}
    <!-- LOD 0 & 1: Unified stable markup for instant zero-churn zoom transitions -->
    <div class="lod-simple-content">
      <span class="simple-symbol" class:is-single={element.symbol.length === 1}>{element.symbol}</span>
      <span class="simple-z font-mono">{element.z}{filter === 'radioactive' && isRad ? ' ☢' : ''}</span>
    </div>
  {:else}
    <!-- LOD 2: Full Rich Card (Search Results & Maximum Zoom) -->
    <div class="lod2-content">
      <!-- Top Header Strip: Z and Ar -->
      <div class="tile-header">
        <span class="tile-z font-mono">{element.z}{isRad ? ' ☢' : ''}</span>
        <span class="tile-mass font-mono">{element.atomicMass}</span>
      </div>

      <!-- Center Hero: Symbol -->
      <div class="tile-hero">
        <span class="tile-symbol">{element.symbol}</span>
      </div>

      <!-- Names: Czech & Latin -->
      <div class="tile-names">
        <div class="name-cs" title={element.nameCs}>{element.nameCs}</div>
        <div class="name-la" title={element.nameLa}>{element.nameLa}</div>
      </div>

      <!-- Period, Group & State of matter -->
      <div class="tile-coords">
        <span class="coord-item">P:{element.period}</span>
        <span class="coord-dot">·</span>
        <span class="coord-item">S:{element.group}{element.groupRoman ? ` (${element.groupRoman})` : ''}</span>
        <span class="coord-dot">·</span>
        <span class="coord-state">{getStateLabel(element.state)}</span>
      </div>

      <!-- Divider line -->
      <div class="tile-divider"></div>

      <!-- Bottom Metadata: Configuration & Oxidation -->
      <div class="tile-bottom">
        <div class="bottom-row">
          <span class="config-label font-mono" title={element.electronConfig}>{element.electronConfig}</span>
        </div>
        <div class="bottom-row ox-row">
          <span class="ox-label font-mono">Ox: {element.oxidationStates}</span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .element-tile {
    width: 100%;
    height: 100%;
    aspect-ratio: 1 / 1.12;
    min-height: 0;
    box-sizing: border-box;
    background-color: var(--color-surface-1);
    border: 1px solid var(--elem-border);
    border-radius: var(--radius-sm, 6px);
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
    /* Scope relayout on LOD switch to the tile itself (no paint containment: would clip selection glow) */
    contain: layout style;
    /* Only the press feedback animates. Transitioning opacity/border-color on filter change
       made the browser promote all 118 tiles to separate compositor layers inside the scaled
       PanZoom layer for the duration of the fade -> full re-raster at start/end = visible flicker. */
    transition: transform 0.12s ease;
  }

  .element-tile.is-interactive {
    cursor: pointer;
  }

  .element-tile.is-interactive:active {
    transform: scale(0.96);
  }

  .element-tile.is-dimmed {
    opacity: 0.18;
  }

  .element-tile.is-selected {
    outline: 2px solid var(--color-accent-primary, #00d2ff);
    box-shadow: 0 0 10px rgba(0, 210, 255, 0.4);
    z-index: 5;
  }

  /* LOD 0 & 1 Shared Stable Container */
  .lod-simple-content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: var(--elem-bg);
    overflow: hidden;
    box-sizing: border-box;
  }

  /* LOD 0 (Overview): Huge symbol filling virtually the whole tile */
  .element-tile.lod-0 .lod-simple-content {
    padding: 0;
    gap: 0;
  }

  .element-tile.lod-0 .simple-symbol {
    font-size: 76px;
    font-weight: 900;
    color: var(--elem-color);
    letter-spacing: -2px;
    line-height: 0.9;
    text-align: center;
    user-select: none;
  }

  .element-tile.lod-0 .simple-symbol.is-single {
    font-size: 94px;
    letter-spacing: -1px;
  }

  .element-tile.lod-0 .simple-z {
    display: none;
  }

  /* LOD 1 (Medium Zoom): Large symbol, smaller atomic number underneath */
  .element-tile.lod-1 .lod-simple-content {
    gap: 6px;
    padding: 8px 4px;
  }

  .element-tile.lod-1 .simple-symbol {
    font-size: 58px;
    font-weight: 900;
    color: var(--elem-color);
    line-height: 0.95;
    letter-spacing: -1.5px;
    text-align: center;
  }

  .element-tile.lod-1 .simple-symbol.is-single {
    font-size: 68px;
  }

  .element-tile.lod-1 .simple-z {
    display: inline-block;
    font-size: 26px;
    font-weight: 700;
    color: var(--color-text-secondary);
    line-height: 1;
    background-color: rgba(0, 0, 0, 0.45);
    border: 1px solid var(--color-border-subtle);
    padding: 3px 10px;
    border-radius: var(--radius-xs, 4px);
  }

  /* LOD 2 Content: Full Rich Card */
  .lod2-content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 8px 9px;
    box-sizing: border-box;
    background: radial-gradient(circle at 50% 25%, var(--elem-bg) 0%, rgba(0, 0, 0, 0.45) 85%);
  }

  .tile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    line-height: 1;
  }

  .tile-z {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-text-secondary);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    padding: 2px 4px;
    border-radius: var(--radius-xs, 4px);
  }

  .tile-mass {
    font-size: 10px;
    color: var(--color-text-muted);
    letter-spacing: 0.2px;
  }

  .tile-hero {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 4px 0 2px 0;
  }

  .tile-symbol {
    font-size: 32px;
    font-weight: 900;
    color: var(--elem-color);
    line-height: 1;
    letter-spacing: -0.5px;
    text-shadow: 0 0 14px var(--elem-bg);
  }

  .tile-names {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    line-height: 1.15;
  }

  .name-cs {
    font-size: 12px;
    font-weight: 800;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .name-la {
    font-size: 10px;
    font-style: italic;
    color: var(--color-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .tile-coords {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    font-size: 9.5px;
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 2px;
  }

  .coord-dot {
    color: var(--color-text-muted);
    font-weight: 700;
  }

  .coord-state {
    color: var(--elem-color);
    font-weight: 600;
  }

  .tile-divider {
    height: 1px;
    width: 100%;
    background-color: var(--color-border-subtle);
    margin: 4px 0;
    opacity: 0.7;
  }

  .tile-bottom {
    display: flex;
    flex-direction: column;
    gap: 2px;
    line-height: 1.1;
  }

  .bottom-row {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  .config-label {
    font-size: 8.5px;
    color: var(--color-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ox-row {
    font-size: 9px;
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ox-label {
    font-size: 8.5px;
    color: var(--color-text-muted);
  }

  .font-mono {
    font-family: var(--font-mono, monospace);
  }
</style>
