<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import SlideToAction from '../../components/ui/SlideToAction.svelte';
  import SpaceButton from '../../components/ui/SpaceButton.svelte';
  import BackspaceButton from '../../components/ui/BackspaceButton.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import SegmentedControl from '../../components/ui/SegmentedControl.svelte';
  import FlagSvg from './FlagSvg.svelte';
  import FlagsReference from './FlagsReference.svelte';
  import WorldFlagsView from './WorldFlagsView.svelte';
  import SailboatEasterEgg from './SailboatEasterEgg.svelte';
  import {
    LETTER_FLAGS,
    FLAG_COLORS,
    type FlagColor,
    type FlagItem
  } from './flagsData';
  import { settings } from '../../state/settings.svelte';
  import { localSettingsService } from '../../services/localSettingsService';

  const modSettings = localSettingsService.forModule('flags');

  // Persisted state
  type FlagMode = 'maritime' | 'world';
  let flagMode = $state<FlagMode>((modSettings.getString('flag_mode', 'maritime') as FlagMode) || 'maritime');
  let inputLetters = $state(modSettings.getString('text', ''));
  let autoResetFilter = $state(modSettings.getBoolean('auto_reset_filter', false));
  let showSailboat = $state(modSettings.getBoolean('show_sailboat', true));

  // Selected filter colors (for maritime mode)
  let selectedColors = $state<FlagColor[]>([]);

  // Update storage
  $effect(() => {
    modSettings.setString('flag_mode', flagMode);
    modSettings.setString('text', inputLetters);
    modSettings.setBoolean('auto_reset_filter', autoResetFilter);
    modSettings.setBoolean('show_sailboat', showSailboat);
  });

  // Check if a maritime flag matches currently selected colors
  function matchesFilter(flag: FlagItem): boolean {
    if (selectedColors.length === 0) return true;
    return selectedColors.every((c) => flag.colors.includes(c));
  }

  // Count matching maritime flags
  let matchCount = $derived(
    LETTER_FLAGS.filter((f) => matchesFilter(f)).length
  );

  function toggleColor(color: FlagColor) {
    settings.vibrate(20);
    if (selectedColors.includes(color)) {
      selectedColors = selectedColors.filter((c) => c !== color);
    } else {
      selectedColors = [...selectedColors, color];
    }
  }

  function handleFlagClick(flag: FlagItem) {
    settings.vibrate(25);
    inputLetters += flag.code;

    if (autoResetFilter && selectedColors.length > 0) {
      selectedColors = [];
    }
  }

  function handleBackspace() {
    if (selectedColors.length > 0) {
      selectedColors = [];
    } else if (inputLetters.length > 0) {
      inputLetters = inputLetters.slice(0, -1);
    }
  }

  function handleClearAll() {
    inputLetters = '';
    selectedColors = [];
  }

  function handleSpace() {
    inputLetters += ' ';
  }

  function handlePaste(text: string) {
    if (!text) return;
    const sanitized = text
      .toUpperCase()
      .replace(/[^A-Z\s]/g, '')
      .replace(/\s+/g, ' ');
    inputLetters += sanitized;
  }
</script>

<ModuleShell
  layoutMode={flagMode === 'world' ? 'fullscreen-input' : 'default'}
  onReset={flagMode === 'maritime' ? handleClearAll : undefined}
  onPaste={flagMode === 'maritime' ? handlePaste : undefined}
>
  {#snippet output()}
    {#if flagMode === 'maritime'}
      <TranslationCard text={inputLetters} />
    {/if}
  {/snippet}

  {#snippet input()}
    {#if flagMode === 'maritime'}
      <div class="flags-keypad">
        <!-- Active Filter Summary (Shown only when filtering) -->
        {#if selectedColors.length > 0}
          <div class="filter-indicator-bar">
            <span class="filter-indicator-text">
              Nalezeno {matchCount} z 26
            </span>
          </div>
        {/if}

        <!-- 26 Flags Grid (A–Z) with Sailboat Easter Egg in Top-Left Corner (2x2) -->
        <div class="flags-grid">
          {#if showSailboat}
            <SailboatEasterEgg />
          {/if}
          {#each LETTER_FLAGS as flag (flag.code)}
            {@const isMatching = matchesFilter(flag)}
            <button
              type="button"
              class="flag-tile"
              class:is-dimmed={!isMatching}
              class:is-solo-z={!showSailboat && flag.code === 'Z'}
              onpointerdown={(e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                handleFlagClick(flag);
              }}
              aria-label="{flag.code} - {flag.name}"
            >
              <div class="flag-tile-preview">
                <FlagSvg {flag} dimmed={!isMatching} />
              </div>
              <span class="flag-tile-code">{flag.code}</span>
            </button>
          {/each}
        </div>

        <!-- Utility Row: SlideToAction (Vymazat) + Mezera + Backspace (1.2fr 1fr 1fr) -->
        <div class="keypad-utility-row-3col">
          <SlideToAction
            disabled={!inputLetters && selectedColors.length === 0}
            onAction={handleClearAll}
            label="Vymazat"
            ariaLabel="Vymazat text tažením"
          />

          <SpaceButton
            onAction={handleSpace}
          />

          <BackspaceButton
            disabled={!inputLetters && selectedColors.length === 0}
            hasActiveSelection={selectedColors.length > 0}
            cancelLabel="Zrušit filtr"
            cancelTitle="Zrušit aktivní filtr barev"
            onAction={handleBackspace}
          />
        </div>

        <!-- Dominant Row: 5 Large Color Filter Buttons (Bottom Thumb Reach) -->
        <div class="color-filter-row">
          {#each FLAG_COLORS as color (color.id)}
            {@const isActive = selectedColors.includes(color.id)}
            <button
              type="button"
              class="color-filter-btn"
              class:is-active={isActive}
              onpointerdown={(e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                toggleColor(color.id);
              }}
              aria-pressed={isActive}
              aria-label="Filtrovat barvu {color.name}"
            >
              <span
                class="color-swatch"
                style:background-color={color.hex}
                style:border-color={color.borderHex || color.hex}
              ></span>
              <span class="color-name">{color.name}</span>
            </button>
          {/each}
        </div>
      </div>
    {:else}
      <WorldFlagsView />
    {/if}
  {/snippet}

  {#snippet menuOptions()}
    <div class="menu-mode-section">
      <span class="menu-mode-title">Kategorie vlajek</span>
      <SegmentedControl
        options={[
          { id: 'maritime', label: 'Námořní (ICS)' },
          { id: 'world', label: 'Vlajky světa' }
        ]}
        value={flagMode}
        ariaLabel="Režim vlajek"
        onChange={(v) => (flagMode = v)}
      />
    </div>

    {#if flagMode === 'maritime'}
      <OptionRow
        label="Zobrazovat lodičku"
        hint="Dekorativní námořní motiv v levém horním rohu mřížky vlajek"
        type="switch"
        checked={showSailboat}
        onChange={(val) => (showSailboat = val)}
      />
      <OptionRow
        label="Resetovat filtr po zadání"
        hint="Po klepnutí na vlajku automaticky zrušit zvolený filtr barev"
        type="switch"
        checked={autoResetFilter}
        onChange={(val) => (autoResetFilter = val)}
      />
    {/if}
  {/snippet}

  {#snippet reference()}
    <FlagsReference />
  {/snippet}
</ModuleShell>

<style>
  .flags-keypad {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    width: 100%;
    user-select: none;
  }

  /* Filter Indicator Bar */
  .filter-indicator-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3px var(--space-sm);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    animation: fadeIn 0.15s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .filter-indicator-text {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  /* Flags Grid: 5 columns x 6 rows (with Sailboat in top-left 2x2) */
  .flags-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--space-xs);
    width: 100%;
  }

  .flag-tile.is-solo-z {
    grid-column: 3;
  }

  .flag-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: 4px 2px;
    gap: 2px;
    min-height: 48px;
    transition: background-color 0.12s, border-color 0.12s, transform 0.06s;
    touch-action: manipulation;
  }

  .flag-tile:active {
    background-color: var(--color-surface-active);
    transform: scale(0.94);
  }

  .flag-tile.is-dimmed {
    border-color: transparent;
    background-color: var(--color-surface-1);
    opacity: 0.45;
  }

  .flag-tile-preview {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .flag-tile-code {
    font-family: var(--font-condensed);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-text-primary);
    line-height: 1;
  }

  .flag-tile.is-dimmed .flag-tile-code {
    color: var(--color-text-muted);
  }

  /* Dominant Bottom Row: 5 Large Color Buttons */
  .color-filter-row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--space-xs);
    width: 100%;
    height: var(--dominant-key-height);
  }

  .color-filter-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-xs) 2px;
    transition: background-color 0.12s, border-color 0.12s, transform 0.06s, box-shadow 0.12s;
    touch-action: manipulation;
  }

  .color-filter-btn:active {
    background-color: var(--color-surface-active);
    transform: scale(0.96);
  }

  .color-filter-btn.is-active {
    background-color: var(--color-surface-active);
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 10px rgba(0, 210, 255, 0.35);
  }

  .color-swatch {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
    transition: transform 0.12s, box-shadow 0.12s;
  }

  .color-filter-btn.is-active .color-swatch {
    transform: scale(1.15);
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
  }

  .color-name {
    font-family: var(--font-sans);
    font-size: var(--text-2xs);
    font-weight: 600;
    color: var(--color-text-secondary);
    letter-spacing: 0.2px;
    line-height: 1;
  }

  .color-filter-btn.is-active .color-name {
    color: var(--color-accent-primary);
    font-weight: 700;
  }

  .menu-mode-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space-xs) 0 var(--space-sm);
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .menu-mode-title {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
</style>
