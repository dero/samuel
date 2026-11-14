<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import type { ModuleBarConfig } from '../../components/layout/ModuleBar.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import InterlinearText, { type InterlinearToken } from '../../components/ui/InterlinearText.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import KeypadBottomRow from '../../components/ui/KeypadBottomRow.svelte';
  import SpaceCommitButton from '../../components/ui/SpaceCommitButton.svelte';
  import MenuGroup from '../../components/ui/MenuGroup.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import SegmentDisplayPad from './SegmentDisplayPad.svelte';
  import DisplaysReference from './DisplaysReference.svelte';
  import { DISPLAY_CONFIGS, type DisplayType } from './displaysData';
  import {
    convertSevenSegField,
    decodeDisplayField,
    decodeDisplayFields,
    displayFieldsToText,
    formatSevenSegIds,
    segmentsToField,
    type DecodedDisplayField,
    type DisplayDecodeOptions
  } from './displaysSolver';
  import { parseNotation, serializeNotation } from '../../utils/notation';
  import { settings } from '../../state/settings.svelte';
  import { createModuleState } from '../../state/moduleState.svelte';
  import { launcher } from '../../state/launcher.svelte';

  const { state: modState, reset: resetState } = createModuleState('displays', {
    type: '7seg' as DisplayType,
    fields_7seg: [] as string[],
    fields_14seg: [] as string[],
    fields_16seg: [] as string[],
    auto_insert: false,
    prefer_numbers: false,
    letter_indexing: false
  });

  const displayTypeOptions: SegmentOption<DisplayType>[] = [
    { id: '7seg', label: '7-segment' },
    { id: '14seg', label: '14-segment' },
    { id: '16seg', label: '16-segment' }
  ];

  let activeSegments = $state<string[]>([]);
  let committedFade = $state<boolean>(false);
  let fadeTimeout: ReturnType<typeof setTimeout> | null = null;

  const displayType = $derived<DisplayType>(
    modState.type === '14seg' || modState.type === '16seg' ? modState.type : '7seg'
  );
  const config = $derived(DISPLAY_CONFIGS[displayType]);

  const fieldsKey = $derived(
    displayType === '14seg'
      ? 'fields_14seg'
      : displayType === '16seg'
        ? 'fields_16seg'
        : 'fields_7seg'
  );
  const fields = $derived<string[]>(modState[fieldsKey]);

  const decodeOptions = $derived<DisplayDecodeOptions>({
    preferNumbers: modState.prefer_numbers,
    letterIndexing: modState.letter_indexing
  });

  const decoded = $derived(decodeDisplayFields(displayType, fields, decodeOptions));
  const plainText = $derived(displayFieldsToText(decoded));

  const pendingField = $derived(
    activeSegments.length > 0 && !committedFade ? segmentsToField(activeSegments) : null
  );
  const pendingDisplayField = $derived(
    pendingField !== null
      ? displayType === '7seg' && modState.letter_indexing
        ? formatSevenSegIds(activeSegments, true).join('')
        : pendingField
      : null
  );
  const pendingDecoded = $derived(
    pendingField !== null ? decodeDisplayField(displayType, pendingField, decodeOptions) : null
  );

  function toToken({ field, normalizedField, char, kind }: DecodedDisplayField): InterlinearToken {
    if (kind === 'space') return { primary: '␣', isSpace: true };
    if (kind === 'invalid') {
      return {
        primary: char,
        secondary: field,
        isError: true,
        errorText: `Neznámé segmenty „${field}“`
      };
    }
    return { primary: char, secondary: normalizedField };
  }

  const tokens = $derived(decoded.map(toToken));
  const pendingToken = $derived<InterlinearToken | null>(
    pendingDecoded
      ? {
          primary: pendingDecoded.char,
          secondary: pendingDecoded.normalizedField,
          isPending: true,
          isError: pendingDecoded.kind === 'invalid'
        }
      : null
  );

  const hasContent = $derived(fields.length > 0 || activeSegments.length > 0);
  const invalidCount = $derived(decoded.filter((d) => d.kind === 'invalid').length);
  const hasMenuWarning = $derived(displayType === '7seg' && modState.letter_indexing);

  const podkladExample = $derived(
    displayType === '7seg' && modState.letter_indexing
      ? 'abcefg,cefg,cdeg,bcde'
      : config.exampleNotation
  );

  const bar = $derived<ModuleBarConfig>({
    empty: !hasContent,
    hint: 'Segmenty zadávejte klepnutím nebo tahem.',
    warning: invalidCount > 0 ? `Neplatné části zápisu: ${invalidCount}` : null,
    status: pendingDecoded
      ? `${pendingDecoded.normalizedField} → ${pendingDecoded.char}${pendingDecoded.altHint ? ` (${pendingDecoded.altHint})` : ''}`
      : undefined,
    charCount: decoded.filter((d) => d.kind !== 'space').length
  });

  function clearFadeTimer() {
    if (fadeTimeout) {
      clearTimeout(fadeTimeout);
      fadeTimeout = null;
    }
    committedFade = false;
  }

  function setFields(next: string[]) {
    modState[fieldsKey] = next;
  }

  function appendField(field: string) {
    setFields([...fields, field]);
  }

  function commitPending() {
    if (pendingDisplayField === null) return;
    appendField(pendingDisplayField);
    committedFade = true;
    if (fadeTimeout) clearTimeout(fadeTimeout);
    fadeTimeout = setTimeout(() => {
      activeSegments = [];
      committedFade = false;
    }, 380);
  }

  function handleStartInteraction() {
    if (committedFade) {
      clearFadeTimer();
      activeSegments = [];
    }
  }

  function handleStrokeCommit() {
    if (!pendingDecoded) return;
    if (pendingDecoded.kind !== 'invalid') {
      settings.vibrate([15, 30, 15]);
      commitPending();
    } else {
      settings.vibrate(20);
    }
  }

  function handleTypeChange(nextType: DisplayType) {
    if (nextType === displayType) return;
    clearFadeTimer();
    activeSegments = [];
    modState.type = nextType;
  }

  function handleLetterIndexingChange(enabled: boolean) {
    modState.letter_indexing = enabled;
    modState.fields_7seg = modState.fields_7seg.map((f) => convertSevenSegField(f, enabled));
  }

  function handleSpace() {
    clearFadeTimer();
    activeSegments = [];
    appendField('');
  }

  function handleBackspace() {
    const hadPending = pendingField !== null;
    clearFadeTimer();
    activeSegments = [];
    if (!hadPending) setFields(fields.slice(0, -1));
  }

  function handleClearAll() {
    clearFadeTimer();
    setFields([]);
    activeSegments = [];
  }

  function handleReset() {
    const currentType = displayType;
    clearFadeTimer();
    activeSegments = [];
    resetState();
    modState.type = currentType;
  }

  $effect(() => {
    const preset = launcher.takePreset('displays');
    if (!preset || !('displayType' in preset)) return;
    untrack(() => {
      if (modState.type !== preset.displayType) {
        clearFadeTimer();
        activeSegments = [];
        modState.type = preset.displayType;
      }
    });
  });

  onDestroy(() => {
    clearFadeTimer();
  });
</script>

<ModuleShell
  hasWarning={hasMenuWarning}
  onReset={handleReset}
  podklad={{
    kind: 'text',
    required: false,
    empty: fields.length === 0,
    title: 'Zápis',
    description: config.description,
    example: podkladExample,
    placeholder: `Např. ${podkladExample}`,
    autocapitalize: 'none',
    value: serializeNotation(fields),
    onSave: (val) => {
      clearFadeTimer();
      activeSegments = [];
      setFields(parseNotation(val));
    }
  }}
  {bar}
>
  {#snippet output()}
    <TranslationCard text={plainText} {hasContent}>
      {#snippet children()}
        <InterlinearText {tokens} {pendingToken} scalePrimaryBy="primary" />
      {/snippet}
    </TranslationCard>
  {/snippet}

  {#snippet variants()}
    <SegmentedControl
      options={displayTypeOptions}
      value={displayType}
      size="sm"
      ariaLabel="Typ segmentového displeje"
      onChange={handleTypeChange}
    />
  {/snippet}

  {#snippet input()}
    <div class="keypad-zone">
      <SegmentDisplayPad
        type={displayType}
        {activeSegments}
        {committedFade}
        letterIndexing={modState.letter_indexing}
        autoInsert={modState.auto_insert}
        onSegmentsChange={(next) => (activeSegments = next)}
        onStartInteraction={handleStartInteraction}
        onStrokeCommit={handleStrokeCommit}
      />

      <KeypadBottomRow
        clearDisabled={!hasContent}
        backspaceDisabled={!hasContent}
        clearLabel="Vymazat celý zápis podržením"
        hasActiveSelection={pendingField !== null}
        cancelTitle="Zrušit vybrané segmenty"
        onClear={handleClearAll}
        onBackspace={handleBackspace}
      >
        {#snippet middle()}
          <SpaceCommitButton
            pendingChar={pendingDecoded?.char ?? ''}
            onSpace={handleSpace}
            onCommit={commitPending}
          />
        {/snippet}
      </KeypadBottomRow>
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <MenuGroup>
      <OptionRow
        label="Okamžité vkládání"
        hint="Znak se vloží hned po dokončení tahu, bez potvrzení."
        checked={modState.auto_insert}
        onChange={(v) => (modState.auto_insert = v)}
      />
      <OptionRow
        label="Preference čísel"
        hint="U shodných tvarů (Z/2, S/5, O/0) upřednostní číslice před písmeny."
        checked={modState.prefer_numbers}
        onChange={(v) => (modState.prefer_numbers = v)}
      />
      {#if displayType === '7seg'}
        <OptionRow
          label="Indexování písmeny"
          hint="Segmenty 7-segmentu značí písmeny a–g místo 1–7."
          checked={modState.letter_indexing}
          isNonStandard={modState.letter_indexing}
          onChange={handleLetterIndexingChange}
        />
      {/if}
    </MenuGroup>
  {/snippet}

  {#snippet reference()}
    <DisplaysReference activeTool={displayType} />
  {/snippet}
</ModuleShell>

<style>
  .keypad-zone {
    display: flex;
    flex-direction: column;
    gap: var(--zone-input-gap);
    width: 100%;
    flex-shrink: 0;
  }
</style>
