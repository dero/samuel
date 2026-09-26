<script lang="ts">
  import { onMount } from 'svelte';
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import { settings } from '../../state/settings.svelte';
  import { versionService } from '../../services/versionService.svelte';
  import { navigation } from '../../state/navigation.svelte';
  import FlagDetailModal from './FlagDetailModal.svelte';
  import WorldFlagsFilterDashboard from './WorldFlagsFilterDashboard.svelte';
  import { getWorldFlags, type WorldFlagRecord } from '../../db/database.svelte';
  import type {
    WorldContinent,
    WorldFlagColorId,
    WorldFlagFeatureId
  } from './worldFlagsData';
  import { ArrowCounterClockwise, Globe } from 'phosphor-svelte';

  // Data state
  let allFlags = $state<WorldFlagRecord[]>([]);
  let isLoading = $state(true);

  // Filter states
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
    selectedContinent !== 'all' ||
      selectedColors.length > 0 ||
      selectedFeatures.length > 0
  );

  function resetAllFilters() {
    settings.vibrate(20);
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

      return true;
    });
  });
</script>

<ModuleShell title="Státy" layoutMode="fullscreen-input">
  {#snippet input()}
    <div class="states-view" data-allow-copy>
      <!-- Top Section: Filter Count & Reset -->
      <div class="states-header-zone">
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
            <span class="empty-hint text-muted">Katalog států a vlajek je součástí offline balíčku (~102 MB).</span>
            <button type="button" class="empty-reset-btn" onclick={() => navigation.openModule('settings')}>
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
            <span class="empty-title">Žádný stát neodpovídá filtrům</span>
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

      <!-- Bottom Filter Dashboard (Fixed Thumb Zone) -->
      <WorldFlagsFilterDashboard
        {selectedContinent}
        {selectedFeatures}
        {selectedColors}
        onToggleContinent={toggleContinent}
        onToggleFeature={toggleFeature}
        onToggleColor={toggleColor}
      />

      <!-- Detail Modal -->
      <FlagDetailModal
        open={isDetailOpen}
        flag={selectedFlagForDetail}
        onClose={() => (isDetailOpen = false)}
      />
    </div>
  {/snippet}
</ModuleShell>

<style>
  .states-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    overflow: hidden;
    background-color: var(--color-bg-canvas);
    color: var(--color-text-primary);
  }

  .states-header-zone {
    flex-shrink: 0;
    padding: var(--space-xs) var(--space-sm);
    background-color: var(--color-bg-surface);
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .filter-status-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 28px;
  }

  .count-badge {
    font-size: 12px;
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  .text-accent {
    color: var(--color-accent-primary);
  }

  .reset-filters-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: transparent;
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    cursor: pointer;
    transition: background-color 0.12s, color 0.12s;
  }

  .reset-filters-btn:active {
    background-color: var(--color-surface-active);
    color: var(--color-text-primary);
  }

  .flags-scroll-zone {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: var(--space-xs);
    -webkit-overflow-scrolling: touch;
  }

  .flags-result-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(68px, 1fr));
    gap: 6px;
    padding-bottom: var(--space-md);
  }

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 180px;
    gap: var(--space-sm);
    text-align: center;
    padding: var(--space-md);
  }

  .empty-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .empty-hint {
    font-size: 12px;
    line-height: 1.4;
    max-width: 260px;
  }

  .empty-reset-btn {
    margin-top: var(--space-xs);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-accent-primary);
    font-size: 12px;
    font-weight: 600;
    padding: 6px 14px;
    cursor: pointer;
  }

  .empty-reset-btn:active {
    background-color: var(--color-surface-active);
  }

  .world-flag-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    cursor: pointer;
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
</style>
