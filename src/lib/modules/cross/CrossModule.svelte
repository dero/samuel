<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import SlideToAction from '../../components/ui/SlideToAction.svelte';
  import SpaceCommitButton from '../../components/ui/SpaceCommitButton.svelte';
  import BackspaceButton from '../../components/ui/BackspaceButton.svelte';
  import InteractiveCross from './InteractiveCross.svelte';
  import CoordinateKeypad from './CoordinateKeypad.svelte';
  import CrossReference from './CrossReference.svelte';
  import {
    CROSS_TYPES,
    type CrossType,
    type CrossTypeConfig
  } from './crossData';
  import { coordinatesToChar } from './crossSolver';
  import { alphabet, type AlphabetLayout } from '../../state/alphabet.svelte';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import { localSettingsService } from '../../services/localSettingsService';
  import { navigation } from '../../state/navigation.svelte';
  import AlphabetSelect from '../../components/ui/AlphabetSelect.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import NonStandardAlphabetBanner from '../../components/ui/NonStandardAlphabetBanner.svelte';

  const modSettings = localSettingsService.forModule('cross');

  let inputLetters = $state<string>(modSettings.getString('text', ''));
  let crossTypeId = $state<CrossType>(
    (modSettings.getString('type', 'large-polish') as CrossType) || 'large-polish'
  );

  const crossSubmoduleOptions: SegmentOption<CrossType>[] = [
    { id: 'large-polish', label: 'Velký' },
    { id: 'small-polish', label: 'Malý (Pigpen)' }
  ];

  // Per-tool alphabet configuration
  let toolAlphabetMap = $state<Record<string, string>>({
    'large-polish': modSettings.getString('alphabet:large-polish', 'english-ch-27'),
    'small-polish': modSettings.getString('alphabet:small-polish', 'english-26')
  });

  function setToolAlphabet(toolId: string, alphabetId: string) {
    toolAlphabetMap = {
      ...toolAlphabetMap,
      [toolId]: alphabetId
    };
    modSettings.setString('alphabet:' + toolId, alphabetId);
  }

  // Coordinate keypad state
  let selectedAxis1 = $state<number | null>(null);
  let selectedAxis2 = $state<number | null>(null);
  let selectedAxis3 = $state<number | null>(null);

  // Persistence
  $effect(() => {
    modSettings.update({
      text: inputLetters,
      type: crossTypeId
    });
  });

  const activeConfig = $derived.by<CrossTypeConfig>(() => {
    return CROSS_TYPES.find((c) => c.id === crossTypeId) ?? CROSS_TYPES[0];
  });

  const currentAlphabetId = $derived<string>(
    toolAlphabetMap[crossTypeId] ?? activeConfig.defaultAlphabetId ?? 'english-26'
  );

  const currentLayout = $derived<AlphabetLayout>(
    alphabet.getLayout(currentAlphabetId) ?? alphabet.layouts[0]
  );

  const isNonStandardAlphabet = $derived.by(() => {
    if (!activeConfig.hasAlphabet) return false;
    if (!activeConfig.standardAlphabetIds || activeConfig.standardAlphabetIds.length === 0) return false;
    return !activeConfig.standardAlphabetIds.includes(currentAlphabetId);
  });

  const activeLetters = $derived<string[]>(currentLayout.letters);

  const polishSelectedChar = $derived.by(() => {
    if (selectedAxis1 !== null && selectedAxis2 !== null && selectedAxis3 !== null) {
      return coordinatesToChar(
        crossTypeId,
        selectedAxis1,
        selectedAxis2,
        selectedAxis3,
        activeLetters
      );
    }
    return null;
  });

  let interactiveCrossComponent = $state<ReturnType<typeof InteractiveCross> | null>(null);

  function handleDirectLetterSelect(char: string) {
    inputLetters += char;
    selectedAxis1 = null;
    selectedAxis2 = null;
    selectedAxis3 = null;
  }

  function handleCommitFromKeypad(char: string, a1: number, a2: number, a3: number | null) {
    inputLetters += char;
    interactiveCrossComponent?.flashCoordinate(a1, a2, a3 ?? 1);
  }

  function handleSpace() {
    inputLetters += ' ';
    selectedAxis1 = null;
    selectedAxis2 = null;
    selectedAxis3 = null;
  }

  function handleBackspace() {
    if (selectedAxis1 !== null || selectedAxis2 !== null || selectedAxis3 !== null) {
      selectedAxis1 = null;
      selectedAxis2 = null;
      selectedAxis3 = null;
    } else if (inputLetters.length > 0) {
      inputLetters = inputLetters.slice(0, -1);
    }
  }

  function handleClearAll() {
    settings.vibrate(35);
    inputLetters = '';
    selectedAxis1 = null;
    selectedAxis2 = null;
    selectedAxis3 = null;
  }

  function handleReset() {
    handleClearAll();
  }

  function handlePaste(text: string) {
    if (text) {
      inputLetters += (inputLetters.length > 0 ? ' ' : '') + text.toUpperCase();
      toast.show('Text vložen ze schránky', 'success');
    }
  }

  function handleTypeChange(newType: CrossType) {
    crossTypeId = newType;
    selectedAxis1 = null;
    selectedAxis2 = null;
    selectedAxis3 = null;
  }

  const emptyHint = $derived.by(() => {
    switch (crossTypeId) {
      case 'large-polish':
        return 'Klepněte přímo do pole kříže nebo zvolte souřadnice.';
      case 'small-polish':
        return 'Klepněte do pole kříže se zvolenou tečkou.';
      default:
        return 'Klepnutím vyberte požadovaný znak.';
    }
  });
</script>

<ModuleShell
  title={activeConfig.name}
  onReset={handleReset}
  onPaste={handlePaste}
>
  {#snippet menuOptions()}
    {#if activeConfig.hasAlphabet}
      <div class="menu-group">
        <div class="menu-group-title">Abeceda nástroje</div>

        <NonStandardAlphabetBanner
          isWarning={isNonStandardAlphabet}
          description="Pro tento kříž je obvyklá {activeConfig.defaultAlphabetId === 'english-ch-27'
            ? 'Anglická s CH (27 znaků)'
            : 'Anglická (26 znaků)'}."
        />

        <AlphabetSelect
          value={currentAlphabetId}
          onChange={(newId) => setToolAlphabet(crossTypeId, newId)}
        />
      </div>
    {/if}
  {/snippet}

  {#snippet reference()}
    <CrossReference />
  {/snippet}

  {#snippet output()}
    <TranslationCard
      text={inputLetters}
      pendingText={polishSelectedChar ?? ''}
      {emptyHint}
    />
  {/snippet}

  {#snippet input()}
    <div class="zone-input-flow">
      <!-- 1. Sub-Toolbar: Přepínač Velký vs Malý kříž (36px fixně) -->
      <div class="subtoolbar-container">
        <SegmentedControl
          options={crossSubmoduleOptions}
          value={crossTypeId}
          size="sm"
          ariaLabel="Varianta kříže"
          onChange={handleTypeChange}
        />
      </div>

      <!-- 2. Vstupní zóna: Interaktivní kříž nebo souřadnicová klávesnice -->
      <div class="cross-stage">
        <InteractiveCross
          bind:this={interactiveCrossComponent}
          crossType={crossTypeId}
          letters={activeLetters}
          {selectedAxis1}
          {selectedAxis2}
          {selectedAxis3}
          onLetterSelect={handleDirectLetterSelect}
        />

        <div class="keypad-tray" class:is-hidden={crossTypeId !== 'large-polish'}>
          <CoordinateKeypad
            config={activeConfig}
            letters={activeLetters}
            {selectedAxis1}
            {selectedAxis2}
            {selectedAxis3}
            onAxis1Change={(v) => (selectedAxis1 = v)}
            onAxis2Change={(v) => (selectedAxis2 = v)}
            onAxis3Change={(v) => (selectedAxis3 = v)}
            onCommitLetter={handleCommitFromKeypad}
          />
        </div>
      </div>

      <!-- 3. Utilitní trojblok: Clear | Space/Commit | Backspace -->
      <div class="keypad-utility-row-3col">
        <SlideToAction
          disabled={!inputLetters && !polishSelectedChar}
          onAction={handleClearAll}
          ariaLabel="Vymazat text podržením"
        />

        <SpaceCommitButton
          pendingChar={polishSelectedChar}
          disabled={false}
          onSpace={handleSpace}
          onCommit={() => {
            if (polishSelectedChar) {
              inputLetters += polishSelectedChar;
              selectedAxis1 = null;
              selectedAxis2 = null;
              selectedAxis3 = null;
            }
          }}
        />

        <BackspaceButton
          disabled={!inputLetters && !polishSelectedChar}
          hasActiveSelection={!!polishSelectedChar}
          onAction={handleBackspace}
        />
      </div>
    </div>
  {/snippet}
</ModuleShell>

<style>
  .cross-stage {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 288px;
    gap: var(--zone-input-gap);
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .keypad-tray {
    width: 100%;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .keypad-tray.is-hidden {
    display: none !important;
  }

  .menu-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    margin-bottom: var(--space-md);
  }

  .menu-group-title {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    color: var(--color-text-secondary);
    letter-spacing: 0.5px;
  }

</style>
