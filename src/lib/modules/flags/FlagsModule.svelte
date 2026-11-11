<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import InterlinearText from '../../components/ui/InterlinearText.svelte';
  import Chassis from '../../components/ui/Chassis.svelte';
  import Keycap from '../../components/ui/Keycap.svelte';
  import KeypadBottomRow from '../../components/ui/KeypadBottomRow.svelte';
  import SpaceCommitButton from '../../components/ui/SpaceCommitButton.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import FlagSvg from './FlagSvg.svelte';
  import FlagsReference from './FlagsReference.svelte';
  import SailboatEasterEgg from './SailboatEasterEgg.svelte';
  import {
    LETTER_FLAGS,
    FLAG_COLORS,
    type FlagColor,
    type FlagItem
  } from './flagsData';
  import { flagTextToTokens } from './flagsSolver';
  import { settings } from '../../state/settings.svelte';
  import { localSettingsService } from '../../services/localSettingsService';

  const modSettings = localSettingsService.forModule('flags');

  // Persisted state
  let inputLetters = $state(modSettings.getString('text', ''));
  let autoResetFilter = $state(modSettings.getBoolean('auto_reset_filter', false));
  let showSailboat = $state(modSettings.getBoolean('show_sailboat', true));

  // Selected filter colors (for maritime mode)
  let selectedColors = $state<FlagColor[]>([]);

  // Update storage
  $effect(() => {
    modSettings.setString('text', inputLetters);
    modSettings.setBoolean('auto_reset_filter', autoResetFilter);
    modSettings.setBoolean('show_sailboat', showSailboat);
  });

  const tokens = $derived(flagTextToTokens(inputLetters));
  const hasFilter = $derived(selectedColors.length > 0);

  // Check if a maritime flag matches currently selected colors
  function matchesFilter(flag: FlagItem): boolean {
    if (selectedColors.length === 0) return true;
    return selectedColors.every((c) => flag.colors.includes(c));
  }

  // Count matching maritime flags
  let matchCount = $derived(
    LETTER_FLAGS.filter((f) => matchesFilter(f)).length
  );

  function formatFlagCount(n: number): string {
    if (n === 1) return '1 vlajka';
    return n >= 2 && n <= 4 ? `${n} vlajky` : `${n} vlajek`;
  }

  function toggleColor(color: FlagColor) {
    settings.vibrate(20);
    if (selectedColors.includes(color)) {
      selectedColors = selectedColors.filter((c) => c !== color);
    } else {
      selectedColors = [...selectedColors, color];
    }
  }

  function handleFlagClick(flag: FlagItem) {
    inputLetters += flag.code;

    if (autoResetFilter && selectedColors.length > 0) {
      selectedColors = [];
    }
  }

  function handleBackspace() {
    if (selectedColors.length > 0) {
      selectedColors = [];
    } else if (inputLetters.length > 0) {
      inputLetters = Array.from(inputLetters).slice(0, -1).join('');
    }
  }

  function handleClearAll() {
    inputLetters = '';
    selectedColors = [];
  }

  // Data and Menu options back to defaults
  function handleReset() {
    handleClearAll();
    autoResetFilter = false;
    showSailboat = true;
  }

  function handleSpace() {
    inputLetters += ' ';
  }
</script>

<ModuleShell
  onReset={handleReset}
  podklad={{
    kind: 'text',
    required: false,
    empty: !inputLetters,
    title: 'Zápis',
    description: 'Přímo písmena vlajek, mezera je mezera.',
    example: 'AHOJ SVETE',
    placeholder: 'Např. AHOJ SVETE',
    autocapitalize: 'characters',
    value: inputLetters,
    onSave: (val) => {
      inputLetters = val;
    }
  }}
  bar={{
    empty: !inputLetters && !hasFilter,
    hint: 'Filtrujte barvami, klepněte na vlajku.',
    status: hasFilter ? `Filtr: ${formatFlagCount(matchCount)}` : undefined,
    charCount: tokens.filter((t) => !t.isSpace).length
  }}
>
  {#snippet output()}
    <TranslationCard text={inputLetters.toUpperCase()} hasContent={!!inputLetters}>
      {#snippet children()}
        <InterlinearText {tokens} scalePrimaryBy="primary" />
      {/snippet}
    </TranslationCard>
  {/snippet}

  {#snippet variants()}
    <div class="color-filter" role="group" aria-label="Filtr barev">
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
  {/snippet}

  {#snippet input()}
    <div class="flags-keypad">
      <!-- 26 flags, with the sailboat filling the top-left 2×2 corner -->
      <Chassis columns={5} keyHeight="40px">
        {#if showSailboat}
          <SailboatEasterEgg />
        {/if}
        {#each LETTER_FLAGS as flag (flag.code)}
          {@const isMatching = matchesFilter(flag)}
          <Keycap ariaLabel="{flag.code} - {flag.name}" onPress={() => handleFlagClick(flag)}>
            <span class="flag-key" class:is-dimmed={!isMatching}>
              <span class="flag-key-image">
                <FlagSvg {flag} dimmed={!isMatching} />
              </span>
              <span class="flag-key-code">{flag.code}</span>
            </span>
          </Keycap>
        {/each}
        {#if !showSailboat}
          <div class="grid-filler" aria-hidden="true"></div>
        {/if}
      </Chassis>

      <KeypadBottomRow
        clearDisabled={!inputLetters && !hasFilter}
        backspaceDisabled={!inputLetters && !hasFilter}
        clearLabel="Vymazat text podržením"
        hasActiveSelection={hasFilter}
        cancelTitle="Zrušit filtr barev"
        onClear={handleClearAll}
        onBackspace={handleBackspace}
      >
        {#snippet middle()}
          <SpaceCommitButton onSpace={handleSpace} />
        {/snippet}
      </KeypadBottomRow>
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <OptionRow
      label="Lodička"
      hint="Dekorace v rohu mřížky"
      type="switch"
      checked={showSailboat}
      onChange={(val) => (showSailboat = val)}
    />
    <OptionRow
      label="Rušit filtr po zadání"
      hint="Po klepnutí na vlajku zruší filtr barev"
      type="switch"
      checked={autoResetFilter}
      onChange={(val) => (autoResetFilter = val)}
    />
  {/snippet}

  {#snippet reference()}
    <FlagsReference />
  {/snippet}
</ModuleShell>

<style>
  .flags-keypad {
    display: flex;
    flex-direction: column;
    gap: var(--zone-input-gap);
    width: 100%;
    user-select: none;
    -webkit-user-select: none;
  }

  /* Side by side: a 40 px key has no room for a readable flag above its letter */
  .flag-key {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
  }

  .flag-key-image {
    flex: none;
    width: 28px;
    height: 28px;
  }

  .flag-key-code {
    font-family: var(--font-mono);
    font-size: var(--key-s);
    font-weight: 800;
    line-height: 1;
  }

  .flag-key.is-dimmed .flag-key-code {
    color: var(--color-text-muted);
  }

  .grid-filler {
    grid-column: span 4;
    height: 100%;
    background-color: var(--color-surface-2);
    opacity: 0.35;
    pointer-events: none;
  }

  .color-filter {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--space-xs);
    width: 100%;
    height: 100%;
    touch-action: manipulation;
  }

  .color-filter-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-width: 0;
    padding: 0;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs);
    color: var(--color-text-secondary);
    box-sizing: border-box;
    transition: background-color 0.12s ease, border-color 0.12s ease;
  }

  .color-filter-btn:active {
    background-color: var(--color-surface-active);
  }

  .color-filter-btn.is-active {
    background-color: var(--color-accent-primary-subtle);
    border-color: var(--color-accent-primary);
    box-shadow: inset 0 0 0 1px var(--color-accent-primary);
    color: var(--color-accent-primary);
  }

  .color-swatch {
    width: 12px;
    height: 12px;
    border: 1.5px solid;
    border-radius: 50%;
    box-sizing: border-box;
  }

  .color-name {
    max-width: 100%;
    overflow: hidden;
    font-size: min(var(--text-xs), 3.6vw);
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
  }
</style>
