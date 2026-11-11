<script lang="ts">
  import PanZoomViewport from '../../components/ui/PanZoomViewport.svelte';
  import FlagZoomModal from './FlagZoomModal.svelte';
  import { settings } from '../../state/settings.svelte';
  import { ArrowsOut, ArrowCounterClockwise } from 'phosphor-svelte';
  import type { WorldFlagRecord } from '../../db/database.svelte';
  import { WORLD_FLAG_COLORS, WORLD_FLAG_FEATURES, WORLD_CONTINENTS } from './worldFlagsData';

  /** One flag in the module's detail view; the Czech name is the view's title. */
  interface Props {
    flag: WorldFlagRecord;
  }

  let { flag }: Props = $props();

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

  // Fit the flag once the viewport has its final size
  $effect(() => {
    if (flag && inlinePanZoomRef) {
      const t = setTimeout(() => {
        inlinePanZoomRef?.resetView(false);
      }, 50);
      return () => clearTimeout(t);
    }
  });

  const continentName = $derived(
    WORLD_CONTINENTS.find((c) => c.id === flag.continent)?.name ?? flag.continent
  );

  const colorDefs = $derived(
    flag.colors.map((id) => WORLD_FLAG_COLORS.find((c) => c.id === id)).filter((c) => c !== undefined)
  );

  const featureDefs = $derived(
    flag.features.map((id) => WORLD_FLAG_FEATURES.find((f) => f.id === id)).filter((f) => f !== undefined)
  );

  function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // The grid's thumbnails stay mounted underneath, so this copy needs its own SVG ids
  function sanitizeModalSvg(svg: string): string {
    if (!svg) return '';
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

  const detailSvg = $derived(sanitizeModalSvg(flag.svg_4x3));
</script>

<div class="flag-detail" data-allow-copy>
  <div class="flag-preview">
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
      <div class="flag-stage">
        {@html detailSvg}
      </div>
    </PanZoomViewport>

    <div class="preview-actions">
      {#if isInlineZoomed}
        <button
          type="button"
          class="preview-btn is-reset"
          onclick={handleResetInlineZoom}
          aria-label="Obnovit původní velikost"
          title="Obnovit velikost (100 %)"
        >
          <ArrowCounterClockwise size={14} weight="bold" />
          <span class="zoom-pct">{inlineZoomPercent} %</span>
        </button>
      {/if}

      <button
        type="button"
        class="preview-btn is-icon"
        onclick={handleOpenFullscreen}
        aria-label="Zvětšit na celou obrazovku"
        title="Zvětšit na celou obrazovku"
      >
        <ArrowsOut size={16} weight="bold" />
      </button>
    </div>
  </div>

  <dl class="flag-facts">
    <div class="fact-row">
      <dt>Anglicky</dt>
      <dd>{flag.name_en}</dd>
    </div>
    <div class="fact-row">
      <dt>Hlavní město</dt>
      <dd>{flag.capital_cs || flag.capital_en || '—'}</dd>
    </div>
    <div class="fact-row">
      <dt>Kontinent</dt>
      <dd>{continentName}</dd>
    </div>
    <div class="fact-row">
      <dt>ISO kódy</dt>
      <dd class="is-code">{flag.code.toUpperCase()} / {flag.code3.toUpperCase()}</dd>
    </div>
  </dl>

  {#if flag.description_cs}
    <section class="flag-section">
      <h3 class="section-title">Popis vlajky</h3>
      <p class="flag-description">{flag.description_cs}</p>
    </section>
  {/if}

  {#if colorDefs.length > 0}
    <section class="flag-section">
      <h3 class="section-title">Barvy vlajky</h3>
      <div class="chips-row">
        {#each colorDefs as col (col.id)}
          <span class="chip">
            <span class="color-dot" style:background-color={col.hex} style:border-color={col.borderHex}></span>
            {col.name}
          </span>
        {/each}
      </div>
    </section>
  {/if}

  {#if featureDefs.length > 0}
    <section class="flag-section">
      <h3 class="section-title">Prvky vlajky</h3>
      <div class="chips-row">
        {#each featureDefs as feat (feat.id)}
          <span class="chip">{feat.name}</span>
        {/each}
      </div>
    </section>
  {/if}
</div>

<!-- A local overlay: the fullscreen zoom belongs to this detail -->
<FlagZoomModal open={isFullscreenZoomOpen} {flag} onClose={() => (isFullscreenZoomOpen = false)} />

<style>
  .flag-detail {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .flag-preview {
    position: relative;
    flex: none;
    width: 100%;
    aspect-ratio: 4 / 3;
    max-height: 260px;
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
    overflow: hidden;
    background-color: var(--color-surface-1);
  }

  .flag-stage :global(svg) {
    width: 100% !important;
    height: 100% !important;
    display: block !important;
  }

  .preview-actions {
    position: absolute;
    top: var(--space-xs);
    right: var(--space-xs);
    z-index: 5;
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .preview-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    height: var(--control-min-height);
    padding: 0 var(--space-sm);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-medium);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: var(--text-xs);
    font-weight: 700;
    touch-action: manipulation;
    box-sizing: border-box;
  }

  .preview-btn:active {
    background-color: var(--color-surface-active);
  }

  .preview-btn.is-icon {
    width: var(--control-min-height);
    padding: 0;
  }

  .preview-btn.is-reset {
    color: var(--color-accent-primary);
  }

  .zoom-pct {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }

  .flag-facts {
    display: flex;
    flex-direction: column;
    margin: 0;
    border-top: 1px solid var(--color-border-subtle);
  }

  .fact-row {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    gap: var(--space-sm);
    padding: var(--space-sm) 0;
    border-bottom: 1px solid var(--color-border-subtle);
    font-size: var(--text-sm);
    line-height: 1.4;
  }

  .fact-row dt {
    color: var(--color-text-secondary);
  }

  .fact-row dd {
    margin: 0;
    font-weight: 600;
    color: var(--color-text-primary);
    overflow-wrap: anywhere;
  }

  .fact-row dd.is-code {
    font-family: var(--font-mono);
    white-space: nowrap;
  }

  .flag-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .section-title {
    margin: 0;
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text-secondary);
  }

  .flag-description {
    margin: 0;
    font-size: var(--text-sm);
    line-height: 1.5;
    color: var(--color-text-primary);
  }

  .chips-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-full);
    font-size: var(--text-xs);
    color: var(--color-text-primary);
  }

  .color-dot {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
    border: 1px solid;
    border-radius: 50%;
    box-sizing: border-box;
  }
</style>
