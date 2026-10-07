<script lang="ts">
  import BottomSheet from '../../components/ui/BottomSheet.svelte';
  import { Globe } from 'phosphor-svelte';
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
      <!-- Large Flag SVG Preview -->
      <div class="flag-large-preview">
        {@html flag.svg_4x3}
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

<style>
  .flag-detail-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-xs) 0 var(--space-md);
  }

  .flag-large-preview {
    width: 100%;
    max-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-sm);
    overflow: hidden;
  }

  .flag-large-preview :global(svg) {
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 180px;
    border-radius: var(--radius-xs);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
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
