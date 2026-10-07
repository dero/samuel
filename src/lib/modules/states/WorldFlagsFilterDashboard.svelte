<script lang="ts">
  import {
    WORLD_CONTINENTS,
    WORLD_FLAG_COLORS,
    WORLD_FLAG_FEATURES,
    type WorldContinent,
    type WorldFlagColorId,
    type WorldFlagFeatureId
  } from './worldFlagsData';

  interface Props {
    selectedContinent: WorldContinent;
    selectedFeatures: WorldFlagFeatureId[];
    selectedColors: WorldFlagColorId[];
    onToggleContinent: (continent: WorldContinent) => void;
    onToggleFeature: (feature: WorldFlagFeatureId) => void;
    onToggleColor: (color: WorldFlagColorId) => void;
  }

  let {
    selectedContinent,
    selectedFeatures,
    selectedColors,
    onToggleContinent,
    onToggleFeature,
    onToggleColor
  }: Props = $props();
</script>

<div class="filters-dashboard-zone">
  <!-- 1. Continents Bar (1 row x 6 items, Olympic ring order) -->
  <div class="continents-bar">
    {#each WORLD_CONTINENTS as cont (cont.id)}
      {@const isActive = selectedContinent === cont.id}
      <button
        type="button"
        class="continent-chip"
        class:is-active={isActive}
        onclick={() => onToggleContinent(cont.id)}
        aria-pressed={isActive}
      >
        {cont.name}
      </button>
    {/each}
  </div>

  <!-- 2. Colors Matrix Grid (1 row x 6 items, directly aligned under Olympic Continents) -->
  <div class="colors-matrix-grid">
    {#each WORLD_FLAG_COLORS as col (col.id)}
      {@const isActive = selectedColors.includes(col.id)}
      <button
        type="button"
        class="color-btn"
        class:is-active={isActive}
        onclick={() => onToggleColor(col.id)}
        aria-pressed={isActive}
        aria-label="Filtrovat barvu {col.name}"
      >
        <span
          class="color-dot"
          style:background-color={col.hex}
          style:border-color={col.borderHex || col.hex}
        ></span>
        <span class="color-text">{col.name}</span>
      </button>
    {/each}
  </div>

  <!-- 3. Features / Design Elements (2 rows x 6 items) -->
  <div class="features-grid">
    {#each WORLD_FLAG_FEATURES as feat (feat.id)}
      {@const isActive = selectedFeatures.includes(feat.id)}
      <button
        type="button"
        class="feature-btn"
        class:is-active={isActive}
        onclick={() => onToggleFeature(feat.id)}
        aria-pressed={isActive}
        title={feat.name}
      >
        <span class="feature-name">{feat.name}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  /* Bottom filters dashboard */
  .filters-dashboard-zone {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-xs);
    flex-shrink: 0;
    width: 100%;
    box-sizing: border-box;
  }

  /* 1. Continents Bar (6 columns) */
  .continents-bar {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 3px;
    width: 100%;
    box-sizing: border-box;
  }

  .continent-chip {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    min-height: 32px;
    padding: 3px 1px;
    font-size: 10px;
    font-weight: 600;
    color: var(--color-text-secondary);
    min-width: 0;
    overflow: hidden;
    text-align: center;
    white-space: nowrap;
    transition: background-color 0.12s, border-color 0.12s, color 0.12s, transform 0.06s;
    touch-action: manipulation;
  }

  .continent-chip:active {
    background-color: var(--color-surface-active);
    transform: scale(0.96);
  }

  .continent-chip.is-active {
    background-color: var(--color-surface-active);
    border-color: var(--color-accent-primary);
    color: var(--color-accent-primary);
    font-weight: 700;
  }

  /* 2. Colors Matrix Grid (6 columns directly under Continents) */
  .colors-matrix-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 3px;
    width: 100%;
    box-sizing: border-box;
  }

  .color-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: 3px 1px;
    min-height: 40px;
    min-width: 0;
    transition: background-color 0.12s, border-color 0.12s, transform 0.06s, box-shadow 0.12s;
    touch-action: manipulation;
  }

  .color-btn:active {
    background-color: var(--color-surface-active);
    transform: scale(0.96);
  }

  .color-btn.is-active {
    background-color: var(--color-surface-active);
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 10px rgba(0, 210, 255, 0.35);
  }

  .color-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    transition: transform 0.12s, box-shadow 0.12s;
    flex-shrink: 0;
  }

  .color-btn.is-active .color-dot {
    transform: scale(1.15);
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.5);
  }

  .color-text {
    font-family: var(--font-sans);
    font-size: 9.5px;
    font-weight: 600;
    color: var(--color-text-secondary);
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .color-btn.is-active .color-text {
    color: var(--color-accent-primary);
    font-weight: 700;
  }

  /* 3. Features Grid (2 rows x 6 columns) */
  .features-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 3px;
    width: 100%;
    box-sizing: border-box;
  }

  .feature-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    min-height: 34px;
    padding: 2px 2px;
    min-width: 0;
    transition: background-color 0.12s, border-color 0.12s, transform 0.06s;
    touch-action: manipulation;
  }

  .feature-btn:active {
    background-color: var(--color-surface-active);
    transform: scale(0.96);
  }

  .feature-btn.is-active {
    background-color: rgba(0, 210, 255, 0.15);
    border-color: var(--color-accent-primary);
  }

  .feature-name {
    font-size: 9px;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-align: center;
    line-height: 1.15;
    white-space: normal;
    word-break: normal;
    overflow: hidden;
  }

  .feature-btn.is-active .feature-name {
    color: var(--color-accent-primary);
    font-weight: 700;
  }
</style>
