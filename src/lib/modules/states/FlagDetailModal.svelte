<script lang="ts">
  import BottomSheet from '../../components/ui/BottomSheet.svelte';
  import PanZoomViewport from '../../components/ui/PanZoomViewport.svelte';
  import FlagZoomModal from './FlagZoomModal.svelte';
  import { settings } from '../../state/settings.svelte';
  import {
    Globe,
    ArrowsOut,
    ArrowCounterClockwise
  } from 'phosphor-svelte';
  import type { WorldFlagRecord } from '../../db/database.svelte';
  import {
    WORLD_FLAG_COLORS,
    WORLD_FLAG_FEATURES,
    WORLD_CONTINENTS,
    type WorldFlagColorId,
    type WorldFlagFeatureId
  } from './worldFlagsData';

  interface Props {
    open: boolean;
    flag: WorldFlagRecord | null;
    onClose: () => void;
  }

  let { open, flag, onClose }: Props = $props();

  let isFullscreenZoomOpen = $state(false);

  let inlinePanZoomRef = $state<{
    resetView: (vibrate?: boolean) => void;
    getScale: () => number;
    getFitScale: () => number;
  } | null>(null);

  let inlineScale = $state(1.0);

  const inlineFitScale = $derived(inlinePanZoomRef?.getFitScale() ?? 1.0);
  const isInlineZoomed = $derived(inlineScale > inlineFitScale * 1.05);
  const inlineZoomPercent = $derived(Math.round((inlineScale / Math.max(0.001, inlineFitScale)) * 100));

  function handleResetInlineZoom() {
    settings.vibrate(20);
    inlinePanZoomRef?.resetView(false);
  }

  function handleOpenFullscreen() {
    settings.vibrate(20);
    isFullscreenZoomOpen = true;
  }

  $effect(() => {
    if (flag && open && inlinePanZoomRef) {
      const t = setTimeout(() => {
        inlinePanZoomRef?.resetView(false);
      }, 50);
      return () => clearTimeout(t);
    }
  });

  const continentName = $derived.by(() => {
    if (!flag) return '';
    const found = WORLD_CONTINENTS.find((c) => c.id === flag.continent);
    return found ? found.name : flag.continent;
  });

  function getColorDef(colId: string) {
    return WORLD_FLAG_COLORS.find((c) => c.id === colId);
  }

  function getFeatureDef(featId: string) {
    return WORLD_FLAG_FEATURES.find((f) => f.id === featId);
  }

  function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function sanitizeModalSvg(svg: string): string {
    if (!svg) return '';
    // If already namespaced with -4x3- or -modal-, no need to re-namespace
    if (svg.includes('-4x3-') || svg.includes('-modal-')) return svg;

    const idRegex = /\bid=(['"])([^'"]+)\1/g;
    const ids: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = idRegex.exec(svg)) !== null) {
      if (!ids.includes(m[2])) ids.push(m[2]);
    }
    if (ids.length === 0) return svg;
    ids.sort((a, b) => b.length - a.length);

    let result = svg;
    for (const oldId of ids) {
      let newId: string;
      if (oldId.startsWith('flag-icons-')) {
        newId = `${oldId}-modal`;
      } else {
        const parts = oldId.split('-');
        if (parts.length >= 2) {
          newId = `${parts[0]}-modal-${parts.slice(1).join('-')}`;
        } else {
          newId = `${oldId}-modal`;
        }
      }
      const defRegex = new RegExp(`\\bid=(['"])${escapeRegex(oldId)}\\1`, 'g');
      result = result.replace(defRegex, `id=$1${newId}$1`);

      const urlRegex = new RegExp(`url\\((['"]?)#${escapeRegex(oldId)}(['"]?\\))`, 'g');
      result = result.replace(urlRegex, `url($1#${newId}$2`);

      const hrefRegex = new RegExp(`((?:xlink:)?href=(['"])#)${escapeRegex(oldId)}\\2`, 'g');
      result = result.replace(hrefRegex, `$1${newId}$2`);
    }
    return result;
  }

  const detailSvg = $derived(flag ? sanitizeModalSvg(flag.svg_4x3) : '');
</script>

<BottomSheet
  {open}
  title={flag ? `${flag.name_cs} (${flag.code.toUpperCase()})` : 'Detail vlajky'}
  icon={Globe}
  maxWidth="520px"
  {onClose}
>
  {#if flag}
    <div class="flag-detail-container" data-allow-copy>
      <!-- Large Flag SVG Preview with PanZoom -->
      <div class="flag-preview-wrapper">
        <PanZoomViewport
          bind:this={inlinePanZoomRef}
          bind:currentScale={inlineScale}
          minScale={0.08}
          maxScale={6.0}
          initialScale={1.0}
          contentWidth={640}
          contentHeight={480}
          allowSinglePointerPan="when-zoomed"
          doubleTapToZoom={true}
          class="flag-inline-viewport"
        >
          <div class="flag-stage" style="width: 640px; height: 480px;">
            {@html detailSvg}
          </div>
        </PanZoomViewport>

        <!-- Preview Top-Right Quick Controls -->
        <div class="preview-actions-bar">
          {#if isInlineZoomed}
            <button
              type="button"
              class="preview-action-btn reset-btn"
              onclick={handleResetInlineZoom}
              aria-label="Obnovit původní velikost"
              title="Obnovit velikost (100%)"
            >
              <ArrowCounterClockwise size={14} weight="bold" />
              <span class="zoom-pct font-mono">{inlineZoomPercent}%</span>
            </button>
          {/if}

          <button
            type="button"
            class="preview-action-btn fullscreen-btn"
            onclick={handleOpenFullscreen}
            aria-label="Zvětšit na celou obrazovku"
            title="Zvětšit na celou obrazovku"
          >
            <ArrowsOut size={16} weight="bold" />
          </button>
        </div>
      </div>

      <!-- Country Title & Names -->
      <div class="flag-detail-header">
        <h3 class="flag-cs-name">{flag.name_cs}</h3>
        <p class="flag-en-name">{flag.name_en}</p>
      </div>

      <!-- Metadata Grid -->
      <div class="flag-info-grid">
        <div class="info-card">
          <span class="info-label">Hlavní město</span>
          <span class="info-value">{flag.capital_cs || flag.capital_en || '—'}</span>
        </div>
        <div class="info-card">
          <span class="info-label">Kontinent</span>
          <span class="info-value">{continentName}</span>
        </div>
        <div class="info-card">
          <span class="info-label">ISO kódy</span>
          <span class="info-value font-mono">
            {flag.code.toUpperCase()} / {flag.code3.toUpperCase()}
          </span>
        </div>
      </div>

      <!-- Description -->
      {#if flag.description_cs}
        <div class="flag-section">
          <div class="section-title">Popis vlajky</div>
          <p class="flag-description-text">{flag.description_cs}</p>
        </div>
      {/if}

      <!-- Colors -->
      {#if flag.colors && flag.colors.length > 0}
        <div class="flag-section">
          <div class="section-title">Barvy vlajky</div>
          <div class="chips-row">
            {#each flag.colors as colId}
              {@const colDef = getColorDef(colId)}
              {#if colDef}
                <div class="color-chip">
                  <span
                    class="color-dot"
                    style:background-color={colDef.hex}
                    style:border-color={colDef.borderHex}
                  ></span>
                  <span>{colDef.name}</span>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      {/if}

      <!-- Features / Design Elements -->
      {#if flag.features && flag.features.length > 0}
        <div class="flag-section">
          <div class="section-title">Prvky vlajky</div>
          <div class="chips-row">
            {#each flag.features as featId}
              {@const featDef = getFeatureDef(featId)}
              {#if featDef}
                <div class="feature-chip">
                  <span>{featDef.name}</span>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</BottomSheet>

<!-- Fullscreen Flag Zoom Modal -->
<FlagZoomModal
  open={isFullscreenZoomOpen && open}
  {flag}
  onClose={() => (isFullscreenZoomOpen = false)}
/>

<style>
  .flag-detail-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-xs) 0 var(--space-md);
  }

  .flag-preview-wrapper {
    position: relative;
    width: 100%;
    height: clamp(190px, 32vh, 230px);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  :global(.flag-inline-viewport) {
    background-color: transparent !important;
  }

  .flag-stage {
    width: 640px;
    height: 480px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-xs);
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
    background-color: var(--color-surface-1);
  }

  .flag-stage :global(svg) {
    width: 100% !important;
    height: 100% !important;
    display: block !important;
  }

  .preview-actions-bar {
    position: absolute;
    top: var(--space-xs);
    right: var(--space-xs);
    display: flex;
    align-items: center;
    gap: 6px;
    z-index: 5;
    pointer-events: auto;
  }

  .preview-action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 32px;
    padding: 0 8px;
    background-color: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    touch-action: manipulation;
    transition: background-color 0.12s, transform 0.08s;
  }

  .preview-action-btn:active {
    background-color: var(--color-surface-active);
    transform: scale(0.96);
  }

  .preview-action-btn.fullscreen-btn {
    width: 32px;
    padding: 0;
  }

  .preview-action-btn.reset-btn {
    color: var(--color-accent-primary);
  }

  .zoom-pct {
    font-size: 11px;
    letter-spacing: 0.2px;
  }

  .flag-detail-header {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .flag-cs-name {
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
  }

  .flag-en-name {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .flag-info-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-xs);
  }

  .info-card {
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: var(--space-sm) var(--space-xs);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 2px;
  }

  .info-label {
    font-size: var(--text-2xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.3px;
  }

  .info-value {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .font-mono {
    font-family: var(--font-mono, monospace);
  }

  .flag-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .section-title {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .flag-description-text {
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    line-height: 1.5;
    margin: 0;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: var(--space-sm);
  }

  .chips-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .color-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-full);
    padding: 3px 10px;
    font-size: var(--text-xs);
    color: var(--color-text-primary);
  }

  .color-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1px solid;
    flex-shrink: 0;
  }

  .feature-chip {
    display: inline-flex;
    align-items: center;
    background-color: rgba(0, 210, 255, 0.1);
    border: 1px solid rgba(0, 210, 255, 0.25);
    border-radius: var(--radius-full);
    padding: 3px 10px;
    font-size: var(--text-xs);
    color: var(--color-accent-primary);
    font-weight: 500;
  }
</style>
