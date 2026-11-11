<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import type { ModuleBarConfig } from '../../components/layout/ModuleBar.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import InterlinearText, { type InterlinearToken } from '../../components/ui/InterlinearText.svelte';
  import KeypadBottomRow from '../../components/ui/KeypadBottomRow.svelte';
  import SpaceCommitButton from '../../components/ui/SpaceCommitButton.svelte';
  import MenuGroup from '../../components/ui/MenuGroup.svelte';
  import AlphabetSelect from '../../components/ui/AlphabetSelect.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import NonStandardAlphabetBanner from '../../components/ui/NonStandardAlphabetBanner.svelte';
  import InteractiveCross from './InteractiveCross.svelte';
  import CoordinateKeypad from './CoordinateKeypad.svelte';
  import CrossReference from './CrossReference.svelte';
  import {
    CROSS_TYPES,
    LARGE_CROSS_AXES,
    type CrossType,
    type CrossTypeConfig
  } from './crossData';
  import { fieldToChar } from './crossSolver';
  import { alphabet, type AlphabetLayout } from '../../state/alphabet.svelte';
  import { createModuleState } from '../../state/moduleState.svelte';
  import { localSettingsService } from '../../services/localSettingsService';
  import { launcher } from '../../state/launcher.svelte';
  import { untrack } from 'svelte';
  import { parseNotation, serializeNotation } from '../../utils/notation';

  const modSettings = localSettingsService.forModule('cross');

  // Each cross has its own field list: the two notations cannot be read as each other
  const { state: modState, reset: resetModState } = createModuleState('cross', {
    type: 'large-polish' as CrossType,
    fields_large: [] as string[],
    fields_small: [] as string[]
  });

  const crossSubmoduleOptions: SegmentOption<CrossType>[] = [
    { id: 'large-polish', label: 'Velký' },
    { id: 'small-polish', label: 'Pigpen' }
  ];

  const TYPE_TEXTS: Record<CrossType, { hint: string; description: string; example: string }> = {
    'large-polish': {
      hint: 'Klepněte do kříže nebo na souřadnice.',
      description: 'Řádek, sloupec a pozice, čárka dělí znaky.',
      example: '111,132,231,212'
    },
    'small-polish': {
      hint: 'Klepněte na písmeno v kříži.',
      description: 'Tabulka 1–4 a pozice v ní, čárka dělí znaky.',
      example: '11,18,26,21,22,43'
    }
  };

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

  const NO_SELECTION: (number | null)[] = [null, null, null];

  // Coordinate keypad state: row, column, position in any order
  let selection = $state.raw<(number | null)[]>(NO_SELECTION);

  const activeConfig = $derived.by<CrossTypeConfig>(() => {
    return CROSS_TYPES.find((c) => c.id === modState.type) ?? CROSS_TYPES[0];
  });

  const crossTypeId = $derived(activeConfig.id);
  const typeTexts = $derived(TYPE_TEXTS[crossTypeId]);

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
  const lettersForTool = (toolId: CrossType): string[] =>
    (alphabet.getLayout(toolAlphabetMap[toolId]) ?? alphabet.layouts[0]).letters;

  const fieldsKey = $derived(crossTypeId === 'small-polish' ? 'fields_small' : 'fields_large');
  const fields = $derived<string[]>(modState[fieldsKey]);
  const decoded = $derived(
    fields.map((field) => ({ field, char: fieldToChar(crossTypeId, field, activeLetters) }))
  );

  const hasSelection = $derived(selection.some((v) => v !== null));
  const isEmpty = $derived(fields.length === 0 && !hasSelection);

  const tokens = $derived<InterlinearToken[]>(
    decoded.map(({ field, char }) => {
      if (field === '') return { primary: '', isSpace: true };
      if (char === null) {
        return {
          primary: '?',
          secondary: field,
          isError: true,
          errorText: `Neplatné pole „${field}“`
        };
      }
      if (char === ' ') return { primary: '␣', secondary: field, className: 'token-space' };
      return { primary: char, secondary: field };
    })
  );

  const pendingToken = $derived<InterlinearToken | null>(
    hasSelection
      ? { primary: '…', secondary: selection.map((v) => v ?? '·').join(''), isPending: true }
      : null
  );

  const plainText = $derived(decoded.map(({ char }) => char ?? '?').join(''));

  const bar = $derived<ModuleBarConfig>({
    empty: isEmpty,
    hint: typeTexts.hint,
    charCount: decoded.filter(({ char }) => char !== ' ').length
  });

  let interactiveCrossComponent = $state<ReturnType<typeof InteractiveCross> | null>(null);

  function setFields(next: string[]) {
    modState[fieldsKey] = next;
  }

  function appendField(field: string) {
    setFields([...fields, field]);
    selection = NO_SELECTION;
  }

  function handleAxisChange(next: (number | null)[]) {
    const [row, col, pos] = next;
    if (row !== null && col !== null && pos !== null) {
      appendField(next.join(''));
      interactiveCrossComponent?.flashCoordinate(row, col, pos);
    } else {
      selection = next;
    }
  }

  function handleBackspace() {
    if (hasSelection) {
      selection = NO_SELECTION;
    } else {
      setFields(fields.slice(0, -1));
    }
  }

  function handleClearAll() {
    setFields([]);
    selection = NO_SELECTION;
  }

  function handleReset() {
    const type = modState.type;
    resetModState();
    modState.type = type; // the chosen cross is not a setting to lose
    selection = NO_SELECTION;
    setToolAlphabet('large-polish', 'english-ch-27');
    setToolAlphabet('small-polish', 'english-26');
  }

  function handleTypeChange(newType: CrossType) {
    modState.type = newType;
    selection = NO_SELECTION;
  }

  // A launcher shortcut (Polák) opens its cross; each cross keeps its own text, so nothing is lost
  $effect(() => {
    const preset = launcher.takePreset('cross');
    if (!preset || !('crossType' in preset)) return;
    untrack(() => {
      if (modState.type !== preset.crossType) handleTypeChange(preset.crossType);
    });
  });
</script>

<ModuleShell
  hasWarning={isNonStandardAlphabet}
  onReset={handleReset}
  podklad={{
    kind: 'text',
    required: false,
    empty: fields.length === 0,
    title: 'Zápis',
    description: typeTexts.description,
    example: typeTexts.example,
    placeholder: `Např. ${typeTexts.example}`,
    autocapitalize: 'none',
    value: serializeNotation(fields),
    onSave: (val) => {
      selection = NO_SELECTION;
      setFields(parseNotation(val));
    }
  }}
  {bar}
>
  {#snippet menuOptions()}
    {#if activeConfig.hasAlphabet}
      <MenuGroup title="Abeceda">
        <NonStandardAlphabetBanner
          isWarning={isNonStandardAlphabet}
          description="Obvykle {activeConfig.defaultAlphabetId === 'english-ch-27'
            ? 'anglická s CH (27)'
            : 'anglická (26)'}."
        />

        <AlphabetSelect
          value={currentAlphabetId}
          onChange={(newId) => setToolAlphabet(crossTypeId, newId)}
        />
      </MenuGroup>
    {/if}
  {/snippet}

  {#snippet reference()}
    <CrossReference
      largeLetters={lettersForTool('large-polish')}
      pigpenLetters={lettersForTool('small-polish')}
      activeTool={crossTypeId}
    />
  {/snippet}

  {#snippet output()}
    <TranslationCard text={plainText} hasContent={!isEmpty}>
      {#snippet children()}
        <InterlinearText {tokens} {pendingToken} scalePrimaryBy="primary" />
      {/snippet}
    </TranslationCard>
  {/snippet}

  {#snippet variants()}
    <SegmentedControl
      options={crossSubmoduleOptions}
      value={crossTypeId}
      size="sm"
      ariaLabel="Varianta kříže"
      onChange={handleTypeChange}
    />
  {/snippet}

  {#snippet input()}
    <div class="cross-zone">
      <InteractiveCross
        bind:this={interactiveCrossComponent}
        crossType={crossTypeId}
        letters={activeLetters}
        selectedAxis1={selection[0]}
        selectedAxis2={selection[1]}
        selectedAxis3={selection[2]}
        onFieldSelect={appendField}
      />

      {#if crossTypeId === 'large-polish'}
        <CoordinateKeypad axes={LARGE_CROSS_AXES} selected={selection} onChange={handleAxisChange} />
      {/if}

      <KeypadBottomRow
        clearDisabled={isEmpty}
        backspaceDisabled={isEmpty}
        clearLabel="Vymazat text podržením"
        hasActiveSelection={hasSelection}
        cancelTitle="Zrušit výběr souřadnic"
        onClear={handleClearAll}
        onBackspace={handleBackspace}
      >
        {#snippet middle()}
          <SpaceCommitButton onSpace={() => appendField('')} />
        {/snippet}
      </KeypadBottomRow>
    </div>
  {/snippet}
</ModuleShell>

<style>
  .cross-zone {
    display: flex;
    flex-direction: column;
    gap: var(--zone-input-gap);
    width: 100%;
  }
</style>
