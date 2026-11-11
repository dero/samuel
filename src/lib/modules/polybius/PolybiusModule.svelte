<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import InterlinearText, { type InterlinearToken } from '../../components/ui/InterlinearText.svelte';
  import Chassis from '../../components/ui/Chassis.svelte';
  import Keycap from '../../components/ui/Keycap.svelte';
  import KeypadBottomRow from '../../components/ui/KeypadBottomRow.svelte';
  import SpaceCommitButton from '../../components/ui/SpaceCommitButton.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import MenuGroup from '../../components/ui/MenuGroup.svelte';
  import MenuAction from '../../components/ui/MenuAction.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import AlphabetSelect from '../../components/ui/AlphabetSelect.svelte';
  import PolybiusOmissionModal from './PolybiusOmissionModal.svelte';
  import PolybiusReference from './PolybiusReference.svelte';
  import NonStandardAlphabetBanner from '../../components/ui/NonStandardAlphabetBanner.svelte';
  import {
    POLYBIUS_CONFIGS,
    type PolybiusSize,
    type PolybiusCoordLabel
  } from './polybiusData';
  import {
    convertPolybiusFields,
    polybiusCoordLabel,
    polybiusField,
    polybiusFieldToToken
  } from './polybiusSolver';
  import { alphabet, type AlphabetLayout } from '../../state/alphabet.svelte';
  import { toast } from '../../state/toast.svelte';
  import { localSettingsService } from '../../services/localSettingsService';
  import { parseNotation, serializeNotation } from '../../utils/notation';
  import { Sliders } from 'phosphor-svelte';

  const modSettings = localSettingsService.forModule('polybius');

  // The notation is the data: letters are derived, so every option recomputes what is entered
  let fields = $state.raw<string[]>(modSettings.getJSON<string[]>('fields', []));
  let polybiusSize = $state<PolybiusSize>(
    (modSettings.getString('size', '5x5') as PolybiusSize) || '5x5'
  );
  let polybiusCoordLabels = $state<PolybiusCoordLabel>(
    (modSettings.getString('coordLabels', 'numbers') as PolybiusCoordLabel) || 'numbers'
  );

  const sizeOptions: SegmentOption<PolybiusSize>[] = [
    { id: '5x5', label: '5×5 (25)' },
    { id: '6x6', label: '6×6 (36)' }
  ];

  // Half-entered field: a tapped row or column waiting for its other axis
  let selectedRow = $state<number | null>(null);
  let selectedCol = $state<number | null>(null);

  // Alphabet per size
  let alphabetMap = $state<Record<string, string>>({
    '5x5': modSettings.getString('alphabet:5x5', 'english-26'),
    '6x6': modSettings.getString('alphabet:6x6', 'alphanumeric-36')
  });

  function setSizeAlphabet(size: PolybiusSize, alphaId: string) {
    alphabetMap = { ...alphabetMap, [size]: alphaId };
    modSettings.setString('alphabet:' + size, alphaId);
  }

  $effect(() => {
    modSettings.setJSON('fields', fields);
    modSettings.update({
      size: polybiusSize,
      coordLabels: polybiusCoordLabels
    });
  });

  const activeConfig = $derived(POLYBIUS_CONFIGS[polybiusSize]);
  const currentAlphabetId = $derived<string>(alphabetMap[polybiusSize] ?? activeConfig.defaultAlphabetId);
  const currentLayout = $derived<AlphabetLayout>(
    alphabet.getLayout(currentAlphabetId) ?? alphabet.layouts[0]
  );

  const isNonStandardAlphabet = $derived(
    !activeConfig.standardAlphabetIds.includes(currentAlphabetId)
  );

  // Omission state
  const omissionStorageKey = $derived(`polybius:omitted:${polybiusSize}:${currentAlphabetId}`);
  let isOmissionModalOpen = $state<boolean>(false);
  let omittedLetters = $state<string[]>([]);
  // Bumped by Reset modulu, so the stored omissions are read (and defaulted) again
  let omissionRevision = $state(0);

  $effect(() => {
    void omissionRevision;
    const cap = activeConfig.capacity;
    const rawLetters = currentLayout.letters;
    const key = omissionStorageKey;
    const stored = modSettings.getJSON<string[] | null>(key, null);

    if (stored !== null) {
      omittedLetters = stored;
    } else {
      if (rawLetters.length === cap + 1 && rawLetters.includes('Q')) {
        omittedLetters = ['Q'];
        modSettings.setJSON(key, ['Q']);
      } else if (rawLetters.length <= cap) {
        omittedLetters = [];
        modSettings.setJSON(key, []);
      } else {
        omittedLetters = [];
        isOmissionModalOpen = true;
      }
    }
  });

  const omittedPillText = $derived.by(() => {
    if (omittedLetters.length === 0) return '—';
    if (omittedLetters.length <= 3) return omittedLetters.join(', ');
    return omittedLetters.slice(0, 3).join(', ') + '... (+' + (omittedLetters.length - 3) + ')';
  });

  function handleSaveOmitted(newOmitted: string[]) {
    omittedLetters = newOmitted;
    modSettings.setJSON(omissionStorageKey, newOmitted);
    isOmissionModalOpen = false;
    toast.show('Vynechaná písmena uložena', 'success');
  }

  const effectiveLetters = $derived.by<string[]>(() => {
    const omittedSet = new Set(omittedLetters);
    const filtered = currentLayout.letters.filter((ch) => !omittedSet.has(ch));
    const cap = activeConfig.capacity;
    if (filtered.length >= cap) return filtered.slice(0, cap);
    const padded = [...filtered];
    while (padded.length < cap) padded.push(' ');
    return padded;
  });

  const tokens = $derived(
    fields.map((field) =>
      polybiusFieldToToken(field, activeConfig.sizeNum, polybiusCoordLabels, effectiveLetters)
    )
  );
  const plainText = $derived(tokens.map((t) => (t.isSpace ? ' ' : t.primary)).join(''));

  const hasSelection = $derived(selectedRow !== null || selectedCol !== null);
  const pendingToken = $derived.by<InterlinearToken | null>(() => {
    if (!hasSelection) return null;
    const row = selectedRow !== null ? getCoordLabel(selectedRow) : '·';
    const col = selectedCol !== null ? getCoordLabel(selectedCol) : '·';
    return { primary: '…', secondary: row + col, isPending: true };
  });

  const notationExample = $derived(
    convertPolybiusFields(['11', '23', '35', '25'], 'numbers', polybiusCoordLabels).join(',')
  );

  const axis = $derived(Array.from({ length: activeConfig.sizeNum }, (_, i) => i + 1));
  // At 320 × 540 the square gets 258 px: 308 budget − 42 bottom row − 8 gap
  const letterKeyHeight = $derived(activeConfig.sizeNum === 6 ? '34px' : '42px');

  function getCoordLabel(index: number): string {
    return polybiusCoordLabel(index, polybiusCoordLabels);
  }

  function clearSelection() {
    selectedRow = null;
    selectedCol = null;
  }

  function handleSizeChange(newSize: PolybiusSize) {
    if (polybiusSize === newSize) return;
    polybiusSize = newSize;
    clearSelection();
  }

  function handleLabelsChange(newLabels: PolybiusCoordLabel) {
    fields = convertPolybiusFields(fields, polybiusCoordLabels, newLabels);
    polybiusCoordLabels = newLabels;
  }

  function appendField(row: number, col: number) {
    fields = [...fields, polybiusField(row, col, polybiusCoordLabels)];
    clearSelection();
  }

  function handleCoordSelect(kind: 'row' | 'col', val: number) {
    if (kind === 'row') {
      selectedRow = selectedRow === val ? null : val;
    } else {
      selectedCol = selectedCol === val ? null : val;
    }

    if (selectedRow !== null && selectedCol !== null) {
      appendField(selectedRow, selectedCol);
    }
  }

  function handleSpace() {
    fields = [...fields, ''];
    clearSelection();
  }

  function handleBackspace() {
    if (hasSelection) {
      clearSelection();
    } else {
      fields = fields.slice(0, -1);
    }
  }

  function handleClearAll() {
    fields = [];
    clearSelection();
  }

  // Data and Menu options back to defaults; the chosen size is a variant and stays
  function handleReset() {
    handleClearAll();
    polybiusCoordLabels = 'numbers';
    setSizeAlphabet('5x5', POLYBIUS_CONFIGS['5x5'].defaultAlphabetId);
    setSizeAlphabet('6x6', POLYBIUS_CONFIGS['6x6'].defaultAlphabetId);
    // Forget chosen omissions; the omission effect derives the default for the alphabet again
    for (const key of Object.keys(modSettings.getAll())) {
      if (key.startsWith('polybius:omitted:')) modSettings.removeItem(key);
    }
    omissionRevision++;
  }
</script>

<ModuleShell
  hasWarning={isNonStandardAlphabet}
  onReset={handleReset}
  podklad={{
    kind: 'text',
    required: false,
    empty: fields.length === 0,
    title: 'Zápis',
    description: 'Řádek a sloupec, čárka dělí znaky, prázdné pole je mezera.',
    example: notationExample,
    placeholder: `Např. ${notationExample}`,
    autocapitalize: polybiusCoordLabels === 'letters' ? 'characters' : 'none',
    value: serializeNotation(fields),
    onSave: (val) => {
      fields = parseNotation(val);
      clearSelection();
    }
  }}
  bar={{
    empty: fields.length === 0,
    hint: 'Zadejte řádek a sloupec.',
    charCount: tokens.filter((t) => !t.isSpace).length
  }}
>
  {#snippet menuOptions()}
    <OptionRow
      label="Souřadnice písmeny"
      hint={polybiusSize === '6x6' ? 'A–F místo 1–6' : 'A–E místo 1–5'}
      type="switch"
      checked={polybiusCoordLabels === 'letters'}
      onChange={(v) => handleLabelsChange(v ? 'letters' : 'numbers')}
    />

    <MenuGroup title="Abeceda">
      <NonStandardAlphabetBanner
        isWarning={isNonStandardAlphabet}
        description="Obvykle {polybiusSize === '6x6'
          ? 'alfanumerická (36)'
          : 'anglická (26)'}."
      />

      <AlphabetSelect
        value={currentAlphabetId}
        onChange={(newId) => setSizeAlphabet(polybiusSize, newId)}
      />
    </MenuGroup>

    {#if currentLayout.letters.length > activeConfig.capacity}
      <MenuAction
        label="Vynechaná písmena"
        hint="Vynecháno ({omittedLetters.length}): {omittedPillText}"
        icon={Sliders}
        onClick={() => (isOmissionModalOpen = true)}
      />
    {/if}
  {/snippet}

  {#snippet reference()}
    <PolybiusReference />
  {/snippet}

  {#snippet output()}
    <TranslationCard text={plainText} hasContent={fields.length > 0 || hasSelection}>
      {#snippet children()}
        <InterlinearText {tokens} {pendingToken} scalePrimaryBy="primary" />
      {/snippet}
    </TranslationCard>
  {/snippet}

  {#snippet variants()}
    <SegmentedControl
      options={sizeOptions}
      value={polybiusSize}
      size="sm"
      ariaLabel="Velikost Polybiova čtverce"
      onChange={handleSizeChange}
    />
  {/snippet}

  {#snippet input()}
    <div class="polybius-keypad">
      <Chassis columns={activeConfig.sizeNum + 1} keyHeight={letterKeyHeight}>
        <div class="header-row">
          <div class="grid-filler" aria-hidden="true"></div>
          {#each axis as c (c)}
            <Keycap
              size="s"
              label={getCoordLabel(c)}
              ariaLabel="Sloupec {getCoordLabel(c)}"
              selected={selectedCol === c}
              onPress={() => handleCoordSelect('col', c)}
            />
          {/each}
        </div>

        {#each axis as r (r)}
          <Keycap
            size="s"
            label={getCoordLabel(r)}
            ariaLabel="Řádek {getCoordLabel(r)}"
            selected={selectedRow === r}
            onPress={() => handleCoordSelect('row', r)}
          />
          {#each axis as c (c)}
            {@const char = effectiveLetters[(r - 1) * activeConfig.sizeNum + (c - 1)] ?? ''}
            {#if char.trim()}
              <Keycap
                label={char}
                ariaLabel="Písmeno {char}"
                related={selectedRow === r || selectedCol === c}
                onPress={() => appendField(r, c)}
              />
            {:else}
              <div class="grid-filler" aria-hidden="true"></div>
            {/if}
          {/each}
        {/each}
      </Chassis>

      <KeypadBottomRow
        clearDisabled={fields.length === 0 && !hasSelection}
        backspaceDisabled={fields.length === 0 && !hasSelection}
        clearLabel="Vymazat text podržením"
        hasActiveSelection={hasSelection}
        cancelTitle="Zrušit výběr řádku nebo sloupce"
        onClear={handleClearAll}
        onBackspace={handleBackspace}
      >
        {#snippet middle()}
          <SpaceCommitButton onSpace={handleSpace} />
        {/snippet}
      </KeypadBottomRow>
    </div>
  {/snippet}
</ModuleShell>

{#if isOmissionModalOpen}
  <PolybiusOmissionModal
    open={isOmissionModalOpen}
    alphabetName={currentLayout.name}
    allLetters={currentLayout.letters}
    targetCapacity={activeConfig.capacity}
    initialOmitted={omittedLetters}
    onConfirm={handleSaveOmitted}
    onClose={() => (isOmissionModalOpen = false)}
  />
{/if}

<style>
  .polybius-keypad {
    display: flex;
    flex-direction: column;
    gap: var(--zone-input-gap);
    width: 100%;
    user-select: none;
    -webkit-user-select: none;
  }

  .header-row {
    display: contents;
    --key-height: var(--control-min-height);
  }

  .grid-filler {
    height: 100%;
    background-color: var(--color-surface-2);
    opacity: 0.35;
    pointer-events: none;
  }
</style>
