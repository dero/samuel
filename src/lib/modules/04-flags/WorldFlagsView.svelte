<script lang="ts">
  import { onMount } from 'svelte';
  import { settings } from '../../state/settings.svelte';
  import { versionService } from '../../services/versionService.svelte';
  import { navigation } from '../../state/navigation.svelte';
  import { matchesSearch } from '../../utils/search';
  import SearchInput from '../../components/ui/SearchInput.svelte';
  import FlagDetailModal from './FlagDetailModal.svelte';
  import { getWorldFlags, type WorldFlagRecord } from '../../db/database.svelte';
  import {
    WORLD_CONTINENTS,
    WORLD_FLAG_COLORS,
    WORLD_FLAG_FEATURES,
    type WorldContinent,
    type WorldFlagColorId,
    type WorldFlagFeatureId
  } from './worldFlagsData';
  import { ArrowCounterClockwise, Globe } from 'phosphor-svelte';

  // Data state
  let allFlags = $state<WorldFlagRecord[]>([]);
  let isLoading = $state(true);

  // Filter states
  let searchQuery = $state('');
  let selectedContinent = $state<WorldContinent>('all');
  let selectedColors = $state<WorldFlagColorId[]>([]);
  let selectedFeatures = $state<WorldFlagFeatureId[]>([]);

  // Modal detail state
  let selectedFlagForDetail = $state<WorldFlagRecord | null>(null);
  let isDetailOpen = $state(false);

  onMount(async () => {
    if (!versionService.state.isDbInstalled) {
      isLoading = false;
      return;
    }
    try {
      allFlags = await getWorldFlags();
    } catch (err) {
      console.warn('Could not fetch world flags from DB:', err);
    } finally {
      isLoading = false;
    }
  });

  const hasActiveFilters = $derived(
    searchQuery.trim().length > 0 ||
      selectedContinent !== 'all' ||
      selectedColors.length > 0 ||
      selectedFeatures.length > 0
  );

  function resetAllFilters() {
    settings.vibrate(20);
    searchQuery = '';
    selectedContinent = 'all';
    selectedColors = [];
    selectedFeatures = [];
  }

  function toggleContinent(continent: WorldContinent) {
    settings.vibrate(20);
    selectedContinent = continent;
  }

  function toggleFeature(feature: WorldFlagFeatureId) {
    settings.vibrate(20);
    if (selectedFeatures.includes(feature)) {
      selectedFeatures = selectedFeatures.filter((f) => f !== feature);
    } else {
      selectedFeatures = [...selectedFeatures, feature];
    }
  }

  function toggleColor(color: WorldFlagColorId) {
    settings.vibrate(20);
    if (selectedColors.includes(color)) {
      selectedColors = selectedColors.filter((c) => c !== color);
    } else {
      selectedColors = [...selectedColors, color];
    }
  }

  function openDetail(flag: WorldFlagRecord) {
    settings.vibrate(25);
    selectedFlagForDetail = flag;
    isDetailOpen = true;
  }

  // Filtered flags computation
  const filteredFlags = $derived.by(() => {
    return allFlags.filter((flag) => {
      // 1. Continent filter
      if (selectedContinent !== 'all' && flag.continent !== selectedContinent) {
        return false;
      }

      // 2. Colors filter (AND condition: flag must have all selected colors)
      if (selectedColors.length > 0) {
        const hasAllColors = selectedColors.every((c) => flag.colors.includes(c));
        if (!hasAllColors) return false;
      }

      // 3. Features filter (AND condition: flag must have all selected features)
      if (selectedFeatures.length > 0) {
        const hasAllFeatures = selectedFeatures.every((f) => flag.features.includes(f));
        if (!hasAllFeatures) return false;
      }

      // 4. Text search query
      if (searchQuery.trim()) {
        const matches = matchesSearch(
          [
            flag.name_cs,
            flag.name_cs_nodiac,
            flag.name_en,
            flag.capital_cs,
            flag.capital_cs_nodiac,
            flag.capital_en,
            flag.code,
            flag.code3
          ],
          searchQuery
        );
        if (!matches) return false;
      }

      return true;
    });
  });
</script>

<div class="world-flags-view" data-allow-copy>
  <!-- Top Section: Search Bar + Filter Count & Reset -->
  <div class="world-header-zone">
    <SearchInput
      bind:value={searchQuery}
      placeholder="Hledat stát, hlavní město, kód..."
    />
    <div class="filter-status-row">
      <div class="count-badge">
        Nalezeno <strong class="text-accent">{filteredFlags.length}</strong> / {allFlags.length} států
      </div>
      {#if hasActiveFilters}
        <button
          type="button"
          class="reset-filters-btn"
          onclick={resetAllFilters}
          aria-label="Resetovat všechny filtry"
        >
          <ArrowCounterClockwise size={13} />
          <span>Resetovat filtry</span>
        </button>
      {/if}
    </div>
  </div>

  <!-- Middle Section: Scrollable Results Grid with 1x1 Flags -->
  <div class="flags-scroll-zone">
    {#if !versionService.state.isDbInstalled}
      <div class="empty-state">
        <span class="empty-title">Slovníková data nejsou stažena</span>
        <span class="empty-hint text-muted">Katalog státních vlajek je součástí slovníkového balíčku (~102 MB).</span>
        <button type="button" class="empty-reset-btn" onclick={() => navigation.navigate('settings')}>
          Stáhnout v Nastavení
        </button>
      </div>
    {:else if isLoading}
      <div class="loading-state">
        <Globe size={32} class="spin-icon text-muted" />
        <span class="text-muted">Načítám státy světa...</span>
      </div>
    {:else if filteredFlags.length === 0}
      <div class="empty-state">
        <span class="empty-title">Žádná vlajka neodpovídá filtrům</span>
        <span class="empty-hint text-muted">Zkuste odebrat některé barvy nebo prvky</span>
        <button type="button" class="empty-reset-btn" onclick={resetAllFilters}>
          Obnovit všechny filtry
        </button>
      </div>
    {:else}
      <div class="flags-result-grid">
        {#each filteredFlags as flag (flag.code)}
          <button
            type="button"
            class="world-flag-card"
            onclick={() => openDetail(flag)}
            aria-label="{flag.name_cs} ({flag.code.toUpperCase()})"
          >
            <div class="flag-thumb-wrap">
              {@html flag.svg_1x1 || flag.svg_4x3}
            </div>
            <div class="flag-card-info">
              <span class="flag-card-code font-mono">{flag.code.toUpperCase()}</span>
              <span class="flag-card-name" title={flag.name_cs}>{flag.name_cs}</span>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Bottom Section: Filters Dashboard (Thumb Reach) -->
  <div class="filters-dashboard-zone">
    <!-- 1. Continents Bar -->
    <div class="continents-bar">
      {#each WORLD_CONTINENTS as cont (cont.id)}
        {@const isActive = selectedContinent === cont.id}
        <button
          type="button"
          class="continent-chip"
          class:is-active={isActive}
          onclick={() => toggleContinent(cont.id)}
          aria-pressed={isActive}
        >
          {cont.name}
        </button>
      {/each}
    </div>

    <!-- 2. Features / Design Elements (2 rows x 5 items) -->
    <div class="features-grid">
      {#each WORLD_FLAG_FEATURES as feat (feat.id)}
        {@const isActive = selectedFeatures.includes(feat.id)}
        <button
          type="button"
          class="feature-btn"
          class:is-active={isActive}
          onclick={() => toggleFeature(feat.id)}
          aria-pressed={isActive}
          title={feat.name}
        >
          <span class="feature-name">{feat.name}</span>
        </button>
      {/each}
    </div>

    <!-- 3. Colors Matrix (2 rows x 5 items, dominant thumb ergonomics) -->
    <div class="colors-matrix-grid">
      {#each WORLD_FLAG_COLORS as col (col.id)}
        {@const isActive = selectedColors.includes(col.id)}
        <button
          type="button"
          class="color-btn"
          class:is-active={isActive}
          onclick={() => toggleColor(col.id)}
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
  </div>
</div>

<FlagDetailModal
  open={isDetailOpen}
  flag={selectedFlagForDetail}
  onClose={() => {
    isDetailOpen = false;
  }}
/>

<style>
  .world-flags-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    max-width: 100%;
    gap: var(--space-xs);
    overflow-x: hidden;
    overflow-y: hidden;
    box-sizing: border-box;
    user-select: none;
  }

  /* Header zone */
  .world-header-zone {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
    flex-shrink: 0;
    width: 100%;
    box-sizing: border-box;
  }

  .filter-status-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2px;
    font-size: var(--text-xs);
  }

  .count-badge {
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  .text-accent {
    color: var(--color-accent-primary);
    font-weight: 700;
  }

  .text-muted {
    color: var(--color-text-secondary);
  }

  .font-mono {
    font-family: var(--font-mono, monospace);
  }

  .reset-filters-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs);
    padding: 2px 8px;
    font-size: var(--text-xs);
    color: var(--color-text-primary);
    transition: background-color 0.12s;
    touch-action: manipulation;
  }

  .reset-filters-btn:active {
    background-color: var(--color-surface-active);
  }

  /* Middle flags scroll zone */
  .flags-scroll-zone {
    flex: 1;
    min-height: 0;
    width: 100%;
    max-width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    box-sizing: border-box;
    padding: 2px 1px;
  }

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: var(--space-xs);
    text-align: center;
    padding: var(--space-md);
  }

  .empty-title {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .empty-hint {
    font-size: var(--text-xs);
  }

  .empty-reset-btn {
    margin-top: var(--space-xs);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-medium);
    border-radius: var(--radius-sm);
    padding: 6px 14px;
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-accent-primary);
  }

  /* Flags Result Grid (Uniform 1:1 square tiles, perfectly aligned) */
  .flags-result-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
    width: 100%;
    box-sizing: border-box;
  }

  @media (min-width: 520px) {
    .flags-result-grid {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
  }

  @media (min-width: 680px) {
    .flags-result-grid {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }
  }

  .world-flag-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: 3px;
    gap: 3px;
    min-width: 0;
    width: 100%;
    box-sizing: border-box;
    transition: background-color 0.12s, border-color 0.12s, transform 0.06s;
    touch-action: manipulation;
  }

  .world-flag-card:active {
    background-color: var(--color-surface-active);
    transform: scale(0.95);
  }

  .flag-thumb-wrap {
    width: 100%;
    aspect-ratio: 1 / 1;
    position: relative;
    overflow: hidden;
    border-radius: var(--radius-xs);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    box-sizing: border-box;
  }

  .flag-thumb-wrap :global(svg) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    display: block;
  }

  .flag-card-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    overflow: hidden;
    padding: 1px 0;
  }

  .flag-card-code {
    font-size: 9.5px;
    font-weight: 700;
    color: var(--color-text-secondary);
    line-height: 1;
  }

  .flag-card-name {
    font-size: 9.5px;
    font-weight: 500;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    text-align: center;
    line-height: 1.2;
  }

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

  /* 1. Continents Bar */
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
    min-height: 36px;
    padding: 4px 1px;
    font-size: 10.5px;
    font-weight: 600;
    color: var(--color-text-secondary);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
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

  /* 2. Features Grid (2x5) */
  .features-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
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
    min-height: 38px;
    padding: 4px 1px;
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
    font-size: 10px;
    font-weight: 600;
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1;
  }

  .feature-btn.is-active .feature-name {
    color: var(--color-accent-primary);
    font-weight: 700;
  }

  /* 3. Colors Matrix Grid (2x5, dominant button styling like maritime) */
  .colors-matrix-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 3px;
    width: 100%;
    box-sizing: border-box;
  }

  .color-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    padding: 5px 1px;
    min-height: 48px;
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
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
    transition: transform 0.12s, box-shadow 0.12s;
    flex-shrink: 0;
  }

  .color-btn.is-active .color-dot {
    transform: scale(1.15);
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
  }

  .color-text {
    font-family: var(--font-sans);
    font-size: var(--text-2xs);
    font-weight: 600;
    color: var(--color-text-secondary);
    letter-spacing: 0.2px;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .color-btn.is-active .color-text {
    color: var(--color-accent-primary);
    font-weight: 700;
  }
</style>
