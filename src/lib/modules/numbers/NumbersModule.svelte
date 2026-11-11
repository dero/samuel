<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import type { ModuleBarConfig } from '../../components/layout/ModuleBar.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import KeypadBottomRow from '../../components/ui/KeypadBottomRow.svelte';
  import SpaceCommitButton from '../../components/ui/SpaceCommitButton.svelte';
  import MenuGroup from '../../components/ui/MenuGroup.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import AlphabetSelect from '../../components/ui/AlphabetSelect.svelte';
  import AlphabetGrid from '../../components/ui/AlphabetGrid.svelte';
  import InterlinearText, { type InterlinearToken } from '../../components/ui/InterlinearText.svelte';
  import AdaptiveNumpad from './AdaptiveNumpad.svelte';
  import RomanNumpad from './RomanNumpad.svelte';
  import FlowModeModal from './FlowModeModal.svelte';
  import FlowBar from './FlowBar.svelte';
  import NumbersReference from './NumbersReference.svelte';
  import { type FlowMode, getFlowModeShort } from './numbersData';
  import {
    calculateRequiredLength,
    convertCharToNumber,
    decodeToken,
    notationToTokens,
    swapTokens,
    tokensToNotation
  } from './numbersSolver';
  import { alphabet } from '../../state/alphabet.svelte';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import { localSettingsService } from '../../services/localSettingsService';
  import { launcher } from '../../state/launcher.svelte';
  import { untrack } from 'svelte';

  const modSettings = localSettingsService.forModule('numbers');

  function parseStoredFlowMode(key: string, fallback: FlowMode): FlowMode {
    const raw = modSettings.getString(key, '');
    if (raw === 'char') return 'char';
    if (raw === 'roman') return 'roman';
    if (raw === 'roman_loose') return 'roman_loose';
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= 2 && n <= 16) return n;
    return fallback;
  }

  // Non-destructive token storage: sequence of entered values / spaces
  let rawTokens = $state<string[]>(modSettings.getJSON<string[]>('raw_tokens', []));
  let buffer = $state<string>(modSettings.getString('buffer', ''));
  let sourceMode = $state<FlowMode>(parseStoredFlowMode('source_mode', 10));
  let targetMode = $state<FlowMode>(parseStoredFlowMode('target_mode', 'char'));
  let zeroBased = $state<boolean>(modSettings.getBoolean('zero_based', false));
  let asciiMode = $state<boolean>(modSettings.getBoolean('ascii_mode', false));
  let autoEnter = $state<boolean>(modSettings.getBoolean('auto_enter', true));
  let showRomanEasterEgg = $state<boolean>(modSettings.getBoolean('show_roman_easter_egg', true));
  let alphabetId = $state<string>(modSettings.getString('alphabet_id', 'english-26'));

  let activeModalType = $state<'source' | 'target' | null>(null);

  // Persistence (plainTextOutput is defined below and synchronized to 'text')
  $effect(() => {
    modSettings.setJSON('raw_tokens', rawTokens);
    modSettings.setString('buffer', buffer);
    modSettings.setString('source_mode', sourceMode.toString());
    modSettings.setString('target_mode', targetMode.toString());
    modSettings.setBoolean('zero_based', zeroBased);
    modSettings.setBoolean('ascii_mode', asciiMode);
    modSettings.setBoolean('auto_enter', autoEnter);
    modSettings.setBoolean('show_roman_easter_egg', showRomanEasterEgg);
    modSettings.setString('alphabet_id', alphabetId);
  });

  const currentLayout = $derived(
    alphabet.getLayout(alphabetId) ?? alphabet.layouts[0]
  );
  const currentLetters = $derived(currentLayout.letters);

  const isSourceChar = $derived(sourceMode === 'char');
  const isTargetChar = $derived(targetMode === 'char');
  const isSourceRomanCanonical = $derived(sourceMode === 'roman');
  const isSourceRoman = $derived(sourceMode === 'roman' || sourceMode === 'roman_loose');
  const isSourceNumber = $derived(typeof sourceMode === 'number');
  const isTargetNumber = $derived(typeof targetMode === 'number');

  const sourceBase = $derived<number>(typeof sourceMode === 'number' ? sourceMode : 10);

  const sourceShort = $derived(getFlowModeShort(sourceMode));
  const targetShort = $derived(getFlowModeShort(targetMode));

  // Required block length for auto-enter when converting Number -> Char
  const requiredLength = $derived(
    calculateRequiredLength(sourceBase, currentLetters.length, zeroBased, asciiMode)
  );
  const isAutoEnterActive = $derived(isSourceNumber && isTargetChar && autoEnter);

  const tokenOptions = $derived({ zeroBased, asciiMode, letters: currentLetters });

  const isEmpty = $derived(rawTokens.length === 0 && !buffer);

  // Fields in the source system are the data; letters are recomputed from them
  const notation = $derived(tokensToNotation(rawTokens, buffer));

  const interlinearTokens = $derived<InterlinearToken[]>(
    rawTokens.map((tok) => decodeToken(tok, sourceMode, targetMode, tokenOptions))
  );

  const pendingInterlinearToken = $derived<InterlinearToken | null>(
    buffer ? decodeToken(buffer, sourceMode, targetMode, tokenOptions, true) : null
  );

  const plainTextOutput = $derived.by(() => {
    let result = '';
    for (let i = 0; i < interlinearTokens.length; i++) {
      const tok = interlinearTokens[i];
      if (tok.isSpace) {
        result += ' ';
      } else {
        if (isTargetNumber && result.length > 0 && !result.endsWith(' ')) {
          result += ' ';
        }
        result += tok.primary;
      }
    }
    return result;
  });

  $effect(() => {
    modSettings.setString('text', plainTextOutput);
  });

  const tokenMaxDigitInfo = $derived.by(() => {
    let maxVal = -1;
    let maxChar = '';
    for (const tok of rawTokens) {
      if (tok === ' ') continue;
      for (const ch of tok.toUpperCase()) {
        let val = -1;
        if (ch >= '0' && ch <= '9') {
          val = ch.charCodeAt(0) - 48;
        } else if (ch >= 'A' && ch <= 'F') {
          val = ch.charCodeAt(0) - 65 + 10;
        }
        if (val > maxVal) {
          maxVal = val;
          maxChar = ch;
        }
      }
    }
    if (maxVal === -1) {
      return { minBase: 2, maxChar: '' };
    }
    return { minBase: Math.max(2, maxVal + 1), maxChar };
  });

  const sourceTokenType = $derived.by<'number' | 'roman' | 'char' | 'none'>(() => {
    if (rawTokens.length === 0) return 'none';
    const nonSpaces = rawTokens.filter((t) => t !== ' ');
    if (nonSpaces.length === 0) return 'none';
    if (isSourceNumber) return 'number';
    if (isSourceRoman) return 'roman';
    if (isSourceChar) return 'char';
    return 'number';
  });

  const isNonStandardAlphabet = $derived(!['english-26', 'english-ch-27'].includes(alphabetId));

  const notationExample = $derived.by(() => {
    if (isSourceChar) return 'A,H,O,J';
    if (isSourceRoman) return 'XIV,VII,,III';
    return ['A', 'H']
      .map((char) => convertCharToNumber(char, sourceBase, currentLetters, zeroBased, asciiMode))
      .join(',');
  });

  const notationDescription = $derived.by(() => {
    if (isSourceChar) return 'Znaky abecedy oddělené čárkou, prázdné pole je mezera.';
    if (isSourceRoman) return 'Římská čísla oddělená čárkou, prázdné pole je mezera.';
    return `Čísla v soustavě ${sourceBase} oddělená čárkou, prázdné pole je mezera.`;
  });

  const invalidCount = $derived(interlinearTokens.filter((tok) => tok.isError).length);
  const outputCount = $derived(
    interlinearTokens.filter((tok) => !tok.isSpace).length + (buffer ? 1 : 0)
  );

  const bar = $derived.by<ModuleBarConfig>(() => {
    let status: string | undefined;
    if (buffer && isAutoEnterActive) {
      status = `Blok ${buffer.length}/${requiredLength}`;
    } else if (!isTargetChar) {
      const n = outputCount;
      status = n === 1 ? '1 číslo' : n >= 2 && n <= 4 ? `${n} čísla` : `${n} čísel`;
    }

    let warning: string | null = null;
    // Part of a block is not out of range yet, it is only unfinished
    const isBlockUnfinished = isAutoEnterActive && buffer.length < requiredLength;
    if (pendingInterlinearToken?.isError && !isBlockUnfinished) {
      warning = pendingInterlinearToken.errorText ?? null;
    } else if (invalidCount > 0) {
      warning = `Neplatné části zápisu: ${invalidCount}`;
    }

    return {
      empty: isEmpty,
      hint: isSourceChar ? 'Zvolte soustavy a klepejte písmena.' : 'Zvolte soustavy a zadejte číslo.',
      status,
      charCount: outputCount,
      warning
    };
  });


  // Enter button is enabled whenever there is a valid non-error pending token to commit
  const isEnterButtonEnabled = $derived(
    !isSourceChar && !!pendingInterlinearToken && !pendingInterlinearToken.isError
  );

  const enterButtonSymbol = $derived(
    isEnterButtonEnabled ? pendingInterlinearToken!.primary : '↵'
  );

  // Launcher shortcuts (Binárka, Trojkovka) hand over a preset flow; zero-based stays as set in the menu
  $effect(() => {
    const preset = launcher.takePreset('numbers');
    if (!preset || !('source' in preset)) return;
    untrack(() => {
      if (sourceMode === preset.source && targetMode === preset.target) return;
      if (rawTokens.length > 0 || buffer) {
        rawTokens = [];
        buffer = '';
        toast.show('Nový převod, vstup vymazán', { type: 'info' });
      }
      sourceMode = preset.source;
      targetMode = preset.target;
    });
  });

  // Actions
  function handleSwapFlow() {
    settings.vibrate(25);
    const swapped = swapTokens(rawTokens, sourceMode, targetMode, tokenOptions);
    if (!swapped) {
      toast.show('Prohození brání čárka', 'warning');
      return;
    }
    rawTokens = swapped;
    [sourceMode, targetMode] = [targetMode, sourceMode];
    buffer = '';
  }

  function handleDigit(digit: string) {
    const nextBuffer = buffer + digit;

    if (isAutoEnterActive && nextBuffer.length > requiredLength) return;

    if (
      isAutoEnterActive &&
      nextBuffer.length === requiredLength &&
      !decodeToken(nextBuffer, sourceMode, targetMode, tokenOptions).isError
    ) {
      rawTokens = [...rawTokens, nextBuffer];
      buffer = '';
      return;
    }

    buffer = nextBuffer;
  }

  function handleLetter(char: string) {
    rawTokens = [...rawTokens, char];
  }

  function handleCommit() {
    if (!isEnterButtonEnabled || !buffer) return;
    rawTokens = [...rawTokens, buffer];
    buffer = '';
  }

  function handleSpace() {
    if (rawTokens.length > 0 && rawTokens.at(-1) !== ' ') {
      rawTokens = [...rawTokens, ' '];
    }
  }

  function handleBackspace() {
    if (buffer) {
      buffer = buffer.slice(0, -1);
      return;
    }
    const lastToken = rawTokens.at(-1);
    if (lastToken === undefined) return;
    rawTokens = rawTokens.slice(0, -1);
    // A typo in the last digit of a block must not cost the whole block
    if (lastToken !== ' ' && !isSourceChar) buffer = lastToken.slice(0, -1);
  }

  function handleClearAll() {
    buffer = '';
    rawTokens = [];
  }

  // Data and Menu options back to defaults; the source and target systems are the variant and stay
  function handleReset() {
    handleClearAll();
    zeroBased = false;
    asciiMode = false;
    autoEnter = true;
    showRomanEasterEgg = true;
    alphabetId = 'english-26';
  }

  function handleNotationEdit(text: string) {
    const parsed = notationToTokens(text, isAutoEnterActive ? requiredLength : 0);
    rawTokens = parsed.tokens;
    buffer = parsed.buffer;
  }
</script>

<ModuleShell
  hasWarning={isNonStandardAlphabet}
  onReset={handleReset}
  podklad={{
    kind: 'text',
    required: false,
    empty: isEmpty,
    title: 'Zápis',
    description: notationDescription,
    example: notationExample,
    placeholder: `Např. ${notationExample}`,
    autocapitalize: isSourceChar || isSourceRoman || sourceBase > 10 ? 'characters' : 'none',
    value: notation,
    onSave: handleNotationEdit
  }}
  {bar}
>
  {#snippet output()}
    <TranslationCard
      text={plainTextOutput}
      pendingText={pendingInterlinearToken?.primary ?? ''}
      hasContent={!isEmpty}
    >
      {#snippet children()}
        <InterlinearText
          tokens={interlinearTokens}
          pendingToken={pendingInterlinearToken}
          scalePrimaryBy="primary"
        />
      {/snippet}
    </TranslationCard>
  {/snippet}

  {#snippet variants()}
    <FlowBar
      {sourceShort}
      {targetShort}
      onOpenSourceModal={() => {
        settings.vibrate(20);
        activeModalType = 'source';
      }}
      onOpenTargetModal={() => {
        settings.vibrate(20);
        activeModalType = 'target';
      }}
      onSwapFlow={handleSwapFlow}
    />
  {/snippet}

  {#snippet input()}
    <div class="keypad-zone">
      {#if isSourceNumber}
        <AdaptiveNumpad base={sourceBase} onDigit={handleDigit} />
      {:else if isSourceRoman}
        <RomanNumpad
          {buffer}
          canonicalOnly={isSourceRomanCanonical}
          showEasterEgg={showRomanEasterEgg}
          onDigit={handleDigit}
        />
      {:else}
        <AlphabetGrid letters={currentLetters} onLetter={handleLetter} />
      {/if}

      <KeypadBottomRow
        clearDisabled={isEmpty}
        backspaceDisabled={isEmpty}
        clearLabel="Vymazat text podržením"
        onClear={handleClearAll}
        onBackspace={handleBackspace}
      >
        {#snippet middle()}
          <SpaceCommitButton
            pendingChar={buffer ? enterButtonSymbol : ''}
            commitDisabled={!isEnterButtonEnabled}
            onSpace={handleSpace}
            onCommit={handleCommit}
          />
        {/snippet}
      </KeypadBottomRow>
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <MenuGroup title="Abeceda">
      <AlphabetSelect
        value={alphabetId}
        defaultId="english-26"
        standardIds={['english-26', 'english-ch-27']}
        onChange={(newId) => (alphabetId = newId)}
      />
    </MenuGroup>

    <MenuGroup title="Kódování">
      <OptionRow
        label="Indexovat od nuly"
        hint="A=0, B=1 místo A=1, B=2."
        type="switch"
        checked={zeroBased}
        disabled={asciiMode}
        onChange={(v) => (zeroBased = v)}
      />
      <OptionRow
        label="Režim ASCII"
        hint="Kódy podle ASCII, 65 = A."
        type="switch"
        checked={asciiMode}
        onChange={(v) => (asciiMode = v)}
      />
    </MenuGroup>

    <MenuGroup title="Automatické vkládání">
      <OptionRow
        label="Číslo ➔ znak"
        hint="Znak se vloží po zadání celého bloku, např. 5 bitů."
        type="switch"
        checked={autoEnter}
        onChange={(v) => (autoEnter = v)}
      />
    </MenuGroup>

    <MenuGroup title="Vzhled">
      <OptionRow
        label="Římská dekorace"
        hint="SPQR v rohu římské klávesnice."
        type="switch"
        checked={showRomanEasterEgg}
        onChange={(v) => (showRomanEasterEgg = v)}
      />
    </MenuGroup>
  {/snippet}

  {#snippet reference()}
    <NumbersReference letters={currentLetters} />
  {/snippet}
</ModuleShell>

<FlowModeModal
  open={activeModalType !== null}
  modeType={activeModalType ?? 'source'}
  title={activeModalType === 'source' ? 'Vstup' : 'Výstup'}
  activeMode={activeModalType === 'source' ? sourceMode : targetMode}
  alphabetName={currentLayout.name}
  minSourceBase={tokenMaxDigitInfo.minBase}
  maxDigitChar={tokenMaxDigitInfo.maxChar}
  hasTokens={rawTokens.length > 0}
  sourceTokenType={sourceTokenType}
  onSelect={(mode) => {
    if (activeModalType === 'source') {
      sourceMode = mode;
      buffer = '';
    } else if (activeModalType === 'target') {
      targetMode = mode;
      buffer = '';
    }
  }}
  onClose={() => (activeModalType = null)}
/>

<style>
  .keypad-zone {
    display: flex;
    flex-direction: column;
    gap: var(--zone-input-gap);
    width: 100%;
  }
</style>
