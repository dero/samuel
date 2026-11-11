<script lang="ts">
  import { onMount } from 'svelte';
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import { versionService } from '../../services/versionService.svelte';
  import { navigation } from '../../state/navigation.svelte';
  import FlagDetail from './FlagDetail.svelte';
  import WorldFlagsFilterDashboard from './WorldFlagsFilterDashboard.svelte';
  import { getWorldFlags, type WorldFlagRecord } from '../../db/database.svelte';
  import type { WorldContinent, WorldFlagColorId, WorldFlagFeatureId } from './worldFlagsData';
  import { Database, DownloadSimple, SpinnerGap } from 'phosphor-svelte';

  let allFlags = $state<WorldFlagRecord[]>([]);
  let isLoading = $state(true);

  // No continent selected means all of them
  let selectedContinents = $state<WorldContinent[]>([]);
  let selectedColors = $state<WorldFlagColorId[]>([]);
  let selectedFeatures = $state<WorldFlagFeatureId[]>([]);

  // Installing the database remounts the module, so loading once is enough
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

  const dbReady = $derived(versionService.state.isDbInstalled);
  const isDownloading = $derived(versionService.state.status === 'downloading_db');

  const hasActiveFilters = $derived(
    selectedContinents.length > 0 || selectedColors.length > 0 || selectedFeatures.length > 0
  );

  const filteredFlags = $derived(
    allFlags.filter(
      (flag) =>
        (selectedContinents.length === 0 || selectedContinents.includes(flag.continent as WorldContinent)) &&
        selectedColors.every((c) => flag.colors.includes(c)) &&
        selectedFeatures.every((f) => flag.features.includes(f))
    )
  );

  const flagsByCode = $derived(new Map(allFlags.map((flag) => [flag.code, flag])));

  function countStates(n: number): string {
    if (n === 1) return '1 stát';
    return n >= 2 && n <= 4 ? `${n} státy` : `${n} států`;
  }

  const barWarning = $derived.by(() => {
    if (!dbReady) return 'Slovník není stažen';
    if (!isLoading && allFlags.length === 0) return 'Ve slovníku chybí státy';
    return null;
  });

  const barStatus = $derived.by(() => {
    if (isLoading) return 'Načítám…';
    if (!hasActiveFilters) return countStates(allFlags.length);
    return `Nalezeno ${filteredFlags.length} z ${allFlags.length}`;
  });

  // Haptics: the Keycaps and the bar action vibrate themselves
  function resetAllFilters() {
    selectedContinents = [];
    selectedColors = [];
    selectedFeatures = [];
  }

  function toggleContinent(continent: WorldContinent) {
    selectedContinents = selectedContinents.includes(continent)
      ? selectedContinents.filter((c) => c !== continent)
      : [...selectedContinents, continent];
  }

  function toggleFeature(feature: WorldFlagFeatureId) {
    selectedFeatures = selectedFeatures.includes(feature)
      ? selectedFeatures.filter((f) => f !== feature)
      : [...selectedFeatures, feature];
  }

  function toggleColor(color: WorldFlagColorId) {
    selectedColors = selectedColors.includes(color)
      ? selectedColors.filter((c) => c !== color)
      : [...selectedColors, color];
  }

  function openFlag(flag: WorldFlagRecord) {
    settings.vibrate(25);
    navigation.openDetail(flag.code);
  }

  async function handleDownloadDatabase() {
    settings.vibrate(20);
    try {
      toast.show('Stahuji slovník…', { type: 'info' });
      if (await versionService.downloadDb()) toast.show('Slovník stažen', { type: 'success' });
    } catch (err: any) {
      toast.show(`Chyba stažení: ${err?.message || 'Neznámá chyba'}`, { type: 'danger' });
    }
  }
</script>

<ModuleShell
  title="Státy"
  bar={{
    status: barStatus,
    warning: barWarning,
    action: hasActiveFilters
      ? { label: 'Zrušit filtry', title: 'Zrušit všechny filtry', onClick: resetAllFilters }
      : undefined
  }}
  detailTitle={(code) => flagsByCode.get(code)?.name_cs ?? 'Vlajka'}
>
  {#snippet output()}
    <div class="states-output" data-allow-copy>
      {#if !dbReady}
        <div class="state-card">
          <div class="db-icon-circle">
            <Database size={28} weight="bold" />
          </div>
          <div class="state-title">Slovník není stažen</div>
          <div class="state-desc">
            Státy jsou součástí offline slovníku ({versionService.formattedDbSize}).
          </div>
          {#if versionService.state.error}
            <div class="db-error">{versionService.state.error}</div>
          {/if}
          <div class="db-btn-cluster">
            <button
              type="button"
              class="download-db-btn"
              onclick={handleDownloadDatabase}
              disabled={isDownloading}
            >
              {#if isDownloading}
                <SpinnerGap size={18} weight="bold" class="states-spin" />
                <span>Stahuji ({versionService.state.progress} %)…</span>
              {:else}
                <DownloadSimple size={18} weight="bold" />
                <span>{versionService.state.error ? 'Zkusit znovu' : 'Stáhnout slovník'}</span>
              {/if}
            </button>
            {#if isDownloading}
              <button type="button" class="cancel-db-btn" onclick={() => versionService.cancelDownload()}>
                Zrušit
              </button>
            {/if}
          </div>
        </div>
      {:else if isLoading}
        <div class="state-card">
          <SpinnerGap size={28} weight="bold" class="states-spin" />
          <span class="state-desc">Načítám státy…</span>
        </div>
      {:else if allFlags.length === 0}
        <div class="state-card">
          <span class="state-title">Žádná data</span>
          <span class="state-desc">Aktualizujte slovník v Nastavení.</span>
        </div>
      {:else if filteredFlags.length === 0}
        <div class="state-card">
          <span class="state-title">Žádný stát neodpovídá filtrům</span>
          <span class="state-desc">Uberte některý filtr.</span>
        </div>
      {:else}
        <div class="flags-scroll">
          <div class="flags-grid">
            {#each filteredFlags as flag (flag.code)}
              <button
                type="button"
                class="flag-card"
                onclick={() => openFlag(flag)}
                aria-label="{flag.name_cs} ({flag.code.toUpperCase()})"
              >
                <span class="flag-thumb">
                  {@html flag.svg_1x1 || flag.svg_4x3}
                </span>
                <span class="flag-code">{flag.code.toUpperCase()}</span>
                <span class="flag-name">{flag.name_cs}</span>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/snippet}

  {#snippet input()}
    <WorldFlagsFilterDashboard
      {selectedContinents}
      {selectedFeatures}
      {selectedColors}
      onToggleContinent={toggleContinent}
      onToggleFeature={toggleFeature}
      onToggleColor={toggleColor}
    />
  {/snippet}

  {#snippet detail(code)}
    {@const flag = flagsByCode.get(code)}
    {#if flag}
      {#key flag.code}
        <FlagDetail {flag} />
      {/key}
    {:else if !dbReady}
      <p class="detail-missing">Slovník není stažen, vlajky jsou jeho součástí.</p>
    {:else if isLoading}
      <p class="detail-missing">Načítám…</p>
    {:else}
      <p class="detail-missing">Vlajka nenalezena.</p>
    {/if}
  {/snippet}
</ModuleShell>

<style>
  .states-output {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    color: var(--color-text-primary);
  }

  .flags-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }

  .flags-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(68px, 1fr));
    gap: 6px;
  }

  /* Results are flat: a plain surface that only darkens while pressed */
  .flag-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    width: 100%;
    min-width: 0;
    padding: var(--space-xs);
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    box-sizing: border-box;
    transition: background-color 0.12s ease;
  }

  .flag-card:active {
    background-color: var(--color-surface-active);
  }

  .flag-thumb {
    position: relative;
    display: block;
    width: 100%;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    border-radius: var(--radius-xs);
    background-color: var(--color-surface-2);
  }

  .flag-thumb :global(svg) {
    position: absolute;
    inset: 0;
    width: 100% !important;
    height: 100% !important;
    display: block;
  }

  .flag-code,
  .flag-name {
    width: 100%;
    overflow: hidden;
    /* Dense grid on 320 px: capped by width, DESIGN_SYSTEM §9 */
    font-size: min(var(--text-xs), 3.6vw);
    line-height: 1.2;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .flag-code {
    font-family: var(--font-mono);
    font-weight: 700;
    color: var(--color-text-secondary);
  }

  .flag-name {
    font-weight: 500;
    color: var(--color-text-primary);
  }

  /* Loading, empty and missing-data states */
  .state-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    padding: var(--space-sm);
    text-align: center;
    color: var(--color-text-secondary);
  }

  .state-title {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .state-desc {
    max-width: 300px;
    font-size: var(--text-xs);
    line-height: 1.4;
    color: var(--color-text-secondary);
  }

  .db-icon-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-full);
    color: var(--color-accent-primary);
  }

  .db-error {
    max-width: 300px;
    padding: var(--space-sm) var(--space-md);
    background-color: var(--color-accent-danger-subtle);
    border: 1px solid var(--color-accent-danger);
    border-radius: var(--radius-sm);
    font-size: var(--text-xs);
    line-height: 1.4;
    color: var(--color-accent-danger);
  }

  .db-btn-cluster {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin-top: var(--space-xs);
  }

  .download-db-btn {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    height: 40px;
    padding: 0 var(--space-md);
    background-color: var(--color-accent-primary);
    border-radius: var(--radius-sm);
    color: var(--color-text-inverse);
    font-size: var(--text-sm);
    font-weight: 700;
  }

  .download-db-btn:disabled {
    cursor: wait;
  }

  /* The surface keeps its colour; only the content dims (DESIGN_SYSTEM §8) */
  .download-db-btn:disabled > :global(*) {
    opacity: 0.7;
  }

  .cancel-db-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    padding: 0 var(--space-md);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-accent-danger);
  }

  .cancel-db-btn:active {
    background-color: var(--color-surface-active);
  }

  .detail-missing {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .states-output :global(.states-spin) {
    animation: states-spin 1s linear infinite;
  }

  @keyframes states-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .states-output :global(.states-spin) {
      animation: none;
    }
  }
</style>
