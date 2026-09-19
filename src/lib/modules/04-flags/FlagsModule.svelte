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
      <div class="flags-output-container">
        <TranslationCard
          text={inputLetters}
          emptyHint="Filtrujte vlajky barvami dole."
        />
      </div>
    {/if}
  {/snippet}

  {#snippet input()}
    {#if flagMode === 'maritime'}
      <div class="flags-keypad">
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
          {#if !showSailboat}
            <div class="grid-filler" style="grid-column: span 4;" aria-hidden="true"></div>
          {/if}
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

  /* Flags Output Container & Floating Filter Bar */
  .flags-output-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  /* Flags Grid: 5 columns x 6 rows (with Sailboat in top-left 2x2) */
  .flags-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-auto-rows: clamp(34px, 5.6vh, 52px);
    gap: 2px;
    padding: 2px;
    width: 100%;
    border-radius: var(--radius-sm);
    overflow: hidden;
    background-color: var(--color-bg-canvas);
    border: 1px solid var(--color-border-subtle);
    box-sizing: border-box;
  }

  .flag-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-2);
    border: none;
    border-radius: 2px;
    padding: 3px 2px;
    gap: 2px;
    height: 100%;
    min-height: 0;
    box-sizing: border-box;
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.10),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    transition: background-color 0.12s, box-shadow 0.08s, opacity 0.12s;
    touch-action: manipulation;
  }

  .grid-filler {
    background-color: var(--color-surface-2);
    opacity: 0.35;
    border-radius: 2px;
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      inset 0 -1px 0 rgba(0, 0, 0, 0.4);
    pointer-events: none;
    user-select: none;
    height: 100%;
  }

  .flag-tile:active {
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
    transform: none;
  }

  .flag-tile.is-dimmed {
    background-color: var(--color-surface-1);
    box-shadow: none;
    opacity: 0.35;
  }

  .flag-tile-preview {
    width: clamp(20px, 3.4vh, 30px);
    height: clamp(20px, 3.4vh, 30px);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .flag-tile-code {
    font-family: var(--font-condensed);
    font-size: var(--text-2xs);
    font-weight: 700;
    color: var(--color-text-primary);
    line-height: 1;
  }

  .flag-tile.is-dimmed .flag-tile-code {
    color: var(--color-text-muted);
  }

  /* Color Filter Row: 5 Compact Color Buttons (42px) */
  .color-filter-row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 2px;
    padding: 2px;
    width: 100%;
    height: var(--utility-row-height, 42px);
    border-radius: var(--radius-sm);
    overflow: hidden;
    background-color: var(--color-bg-canvas);
    border: 1px solid var(--color-border-subtle);
    box-sizing: border-box;
  }

  .color-filter-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    background-color: var(--color-surface-2);
    border: none;
    border-radius: 2px;
    padding: 2px;
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.10),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    transition: background-color 0.12s, box-shadow 0.08s;
    touch-action: manipulation;
    box-sizing: border-box;
  }

  .color-filter-btn:active {
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
    transform: none;
  }

  .color-filter-btn.is-active {
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
  }

  .color-swatch {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 1.5px solid;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    transition: transform 0.12s, box-shadow 0.12s;
  }

  .color-filter-btn.is-active .color-swatch {
    transform: scale(1.15);
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.5);
  }

  .color-name {
    font-family: var(--font-sans);
    font-size: 9px;
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
