<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import SlideToAction from '../../components/ui/SlideToAction.svelte';
  import SpaceCommitButton from '../../components/ui/SpaceCommitButton.svelte';
  import BackspaceButton from '../../components/ui/BackspaceButton.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import AlphabetSelect from '../../components/ui/AlphabetSelect.svelte';
  import AdaptiveNumpad from './AdaptiveNumpad.svelte';
  import RomanNumpad from './RomanNumpad.svelte';
  import AlphabetGrid from '../../components/ui/AlphabetGrid.svelte';
  import FlowModeModal from './FlowModeModal.svelte';
  import FlowBar from './FlowBar.svelte';
  import NumbersReference from './NumbersReference.svelte';
  import InterlinearText, { type InterlinearToken } from '../../components/ui/InterlinearText.svelte';
  import {
    BASE_CONFIGS,
    type FlowMode,
    getFlowModeLabel,
    getFlowModeShort
  } from './numbersData';
  import {
    decodeBuffer,
    parseRoman,
    formatRoman,
    convertCharToNumber,
    convertCharToRoman,
    convertNumberToNumber,
    convertNumberToRoman,
    convertRomanToNumber,
    convertRomanToRoman,
    calculateRequiredLength,
    type DecodeResult
  } from './numbersSolver';
  import { alphabet } from '../../state/alphabet.svelte';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import { navigation } from '../../state/navigation.svelte';
  import { localSettingsService } from '../../services/localSettingsService';

  const modSettings = localSettingsService.forModule('numbers');

  // Persistence helpers for FlowMode
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

  let lastCharInput = $state<string>('');
  let lastCharOutputStr = $state<string>('');

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

  // Mode predicates
  const isSourceChar = $derived(sourceMode === 'char');
  const isTargetChar = $derived(targetMode === 'char');
  const isSourceRomanCanonical = $derived(sourceMode === 'roman');
  const isSourceRomanLoose = $derived(sourceMode === 'roman_loose');
  const isSourceRoman = $derived(sourceMode === 'roman' || sourceMode === 'roman_loose');
  const isTargetRomanCanonical = $derived(targetMode === 'roman');
  const isTargetRomanLoose = $derived(targetMode === 'roman_loose');
  const isTargetRoman = $derived(targetMode === 'roman' || targetMode === 'roman_loose');
  const isSourceNumber = $derived(typeof sourceMode === 'number');
  const isTargetNumber = $derived(typeof targetMode === 'number');

  const sourceBase = $derived<number>(typeof sourceMode === 'number' ? sourceMode : 10);
  const targetBase = $derived<number>(typeof targetMode === 'number' ? targetMode : 10);

  const sourceShort = $derived(getFlowModeShort(sourceMode));
  const targetShort = $derived(getFlowModeShort(targetMode));

  // Required block length for auto-enter when converting Number -> Char
  const requiredLength = $derived(
    calculateRequiredLength(sourceBase, currentLetters.length, zeroBased, asciiMode)
  );

  // Source input validation status (e.g. invalid Roman or invalid base digit)
  const isSourceInputError = $derived.by(() => {
    if (!buffer) return false;
    if (isSourceRomanCanonical) {
      const parsed = parseRoman(buffer, true);
      return parsed.val === null;
    }
    if (isSourceRomanLoose) {
      const parsed = parseRoman(buffer, false);
      return parsed.val === null;
    }
    if (isSourceNumber) {
      const val = parseInt(buffer, sourceBase);
      return isNaN(val);
    }
    return false;
  });

  // Decode live buffer when target is Character
  const decodeCharResult = $derived<DecodeResult>(
    isSourceNumber || isSourceRoman
      ? decodeBuffer(buffer, {
          base: isSourceNumber ? sourceBase : undefined,
          isRoman: isSourceRoman,
          strictRoman: isSourceRomanCanonical,
          zeroBased,
          asciiMode,
          alphabetLetters: currentLetters
        })
      : { rawBuffer: '', numericValue: null, character: null, status: 'empty' }
  );

  // Decode live buffer when target is Number
  const decodeNumResult = $derived.by(() => {
    if (!isTargetNumber) return { val: null, result: null, error: undefined };
    if (isSourceNumber) return convertNumberToNumber(buffer, sourceBase, targetBase);
    if (isSourceRoman) return convertRomanToNumber(buffer, targetBase, isSourceRomanCanonical);
    return { val: null, result: null };
  });

  // Decode live buffer when target is Roman
  const decodeRomanResult = $derived.by(() => {
    if (!isTargetRoman) return { val: null, result: null, error: undefined };
    if (isSourceNumber) return convertNumberToRoman(buffer, sourceBase);
    if (isSourceRoman) return convertRomanToRoman(buffer, isSourceRomanCanonical);
    return { val: null, result: null };
  });

  function decodeOneToken(
    tok: string,
    sMode: FlowMode,
    tMode: FlowMode,
    isPending = false
  ): InterlinearToken {
    if (tok === ' ') {
      return { primary: ' ', secondary: '', isSpace: true, isPending };
    }

    const isSrcNum = typeof sMode === 'number';
    const isSrcRomanCan = sMode === 'roman';
    const isSrcRom = isSrcRomanCan || sMode === 'roman_loose';
    const isSrcCh = sMode === 'char';

    const isTgtNum = typeof tMode === 'number';
    const isTgtRom = tMode === 'roman' || tMode === 'roman_loose';
    const isTgtCh = tMode === 'char';

    const srcBase = isSrcNum ? (sMode as number) : 10;
    const tgtBase = isTgtNum ? (tMode as number) : 10;

    // 1. SOURCE IS NUMBER
    if (isSrcNum) {
      const val = parseInt(tok, srcBase);

      if (isNaN(val)) {
        return {
          primary: '?',
          secondary: tok,
          secondarySub: srcBase,
          isError: true,
          errorText: `Číslice „${tok}“ neplatí v soustavě ${srcBase}`,
          isPending
        };
      }

      if (isTgtCh) {
        const res = decodeBuffer(tok, {
          base: srcBase,
          zeroBased,
          asciiMode,
          alphabetLetters: currentLetters
        });
        if (res.status === 'valid' && res.character) {
          return {
            primary: res.character,
            secondary: tok,
            secondarySub: srcBase,
            isPending
          };
        }
        return {
          primary: '?',
          secondary: tok,
          secondarySub: srcBase,
          isError: true,
          errorText: res.errorText || 'Mimo rozsah abecedy',
          isPending
        };
      }

      if (isTgtNum) {
        const converted = val.toString(tgtBase).toUpperCase();
        return {
          primary: converted,
          primarySub: tgtBase,
          secondary: tok,
          secondarySub: srcBase,
          isPending
        };
      }

      if (isTgtRom) {
        const roman = formatRoman(val);
        if (roman) {
          return {
            primary: roman,
            secondary: tok,
            secondarySub: srcBase,
            isPending
          };
        }
        return {
          primary: '?',
          secondary: tok,
          secondarySub: srcBase,
          isError: true,
          errorText: 'Mimo rozsah římských čísel (1–3999)',
          isPending
        };
      }
    }

    // 2. SOURCE IS ROMAN
    if (isSrcRom) {
      const parsed = parseRoman(tok, isSrcRomanCan);
      if (parsed.val === null) {
        return {
          primary: '?',
          secondary: tok,
          isError: true,
          errorText: parsed.error || 'Neplatný římský zápis',
          isPending
        };
      }
      const val = parsed.val;

      if (isTgtCh) {
        const res = decodeBuffer(tok, {
          isRoman: true,
          strictRoman: isSrcRomanCan,
          zeroBased,
          asciiMode,
          alphabetLetters: currentLetters
        });
        if (res.status === 'valid' && res.character) {
          return { primary: res.character, secondary: tok, isPending };
        }
        return {
          primary: '?',
          secondary: tok,
          isError: true,
          errorText: res.errorText || 'Mimo rozsah abecedy',
          isPending
        };
      }

      if (isTgtNum) {
        return {
          primary: val.toString(tgtBase).toUpperCase(),
          primarySub: tgtBase,
          secondary: tok,
          isPending
        };
      }

      if (isTgtRom) {
        const canonical = formatRoman(val);
        return {
          primary: canonical || tok,
          secondary: tok,
          isPending
        };
      }
    }

    // 3. SOURCE IS CHAR
    if (isSrcCh) {
      if (isTgtCh) {
        return { primary: tok, secondary: '', isPending };
      }

      if (isTgtNum) {
        const numStr = convertCharToNumber(tok, tgtBase, currentLetters, zeroBased, asciiMode);
        if (numStr !== null) {
          return {
            primary: numStr,
            primarySub: tgtBase,
            secondary: tok,
            isPending
          };
        }
        return {
          primary: '?',
          secondary: tok,
          isError: true,
          errorText: 'Znak není v abecedě',
          isPending
        };
      }

      if (isTgtRom) {
        const roman = convertCharToRoman(tok, currentLetters, zeroBased, asciiMode);
        if (roman !== null) {
          return { primary: roman, secondary: tok, isPending };
        }
        return {
          primary: '?',
          secondary: tok,
          isError: true,
          errorText: 'Znak není v abecedě',
          isPending
        };
      }
    }

    return { primary: tok, secondary: '', isPending };
  }

  const interlinearTokens = $derived<InterlinearToken[]>(
    rawTokens.map((tok) => decodeOneToken(tok, sourceMode, targetMode, false))
  );

  const pendingInterlinearToken = $derived.by<InterlinearToken | null>(() => {
    if (!buffer) return null;
    return decodeOneToken(buffer, sourceMode, targetMode, true);
  });

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

  $effect(() => {
    navigation.setMenuWarning(isNonStandardAlphabet);
    return () => {
      navigation.setMenuWarning(false);
    };
  });

  // Enter button is enabled whenever there is a valid non-error pending token to commit
  const isEnterButtonEnabled = $derived(
    !isSourceChar && !!pendingInterlinearToken && !pendingInterlinearToken.isError
  );

  const enterButtonSymbol = $derived(
    isEnterButtonEnabled ? pendingInterlinearToken!.primary : '↵'
  );

  // Actions
  function handleSwapFlow() {
    settings.vibrate(25);
    const prevSource = sourceMode;
    const prevTarget = targetMode;

    if (rawTokens.length > 0) {
      const newRawTokens: string[] = [];
      let allValid = true;

      for (const tok of rawTokens) {
        if (tok === ' ') {
          newRawTokens.push(' ');
          continue;
        }
        const decoded = decodeOneToken(tok, prevSource, prevTarget, false);
        if (decoded.isError) {
          allValid = false;
          break;
        }
        newRawTokens.push(decoded.primary);
      }

      if (allValid) {
        rawTokens = newRawTokens;
      }
    }

    sourceMode = prevTarget;
    targetMode = prevSource;
    buffer = '';
  }

  function handleDigit(digit: string) {
    const nextBuffer = buffer + digit;

    // If auto-enter is active for Number -> Char, cap at requiredLength
    if (isSourceNumber && isTargetChar && autoEnter && nextBuffer.length > requiredLength) {
      settings.vibrate(40);
      return;
    }

    if (isSourceNumber && isTargetChar && autoEnter && nextBuffer.length >= requiredLength) {
      const decoded = decodeOneToken(nextBuffer, sourceMode, targetMode, false);
      if (!decoded.isError) {
        settings.vibrate(30);
        rawTokens = [...rawTokens, nextBuffer];
        buffer = '';
        return;
      } else {
        buffer = nextBuffer;
        settings.vibrate(50);
        toast.show(decoded.errorText || 'Číslo je mimo rozsah abecedy', 'warning');
        return;
      }
    }

    buffer = nextBuffer;
  }

  function handleLetter(char: string) {
    settings.vibrate(20);
    lastCharInput = char;
    const decoded = decodeOneToken(char, 'char', targetMode, false);
    lastCharOutputStr = decoded.primary;
    rawTokens = [...rawTokens, char];
  }

  function handleCommit() {
    if (!isEnterButtonEnabled || !buffer) return;
    settings.vibrate(25);
    rawTokens = [...rawTokens, buffer];
    buffer = '';
  }

  function handleSpace() {
    settings.vibrate(20);
    if (rawTokens.length > 0 && rawTokens.at(-1) !== ' ') {
      rawTokens = [...rawTokens, ' '];
    }
  }

  function handleBackspace() {
    settings.vibrate(25);
    if (buffer.length > 0) {
      buffer = buffer.slice(0, -1);
    } else if (rawTokens.length > 0) {
      const lastToken = rawTokens[rawTokens.length - 1];
      rawTokens = rawTokens.slice(0, -1);
      if (lastToken === ' ') {
        return;
      }
      if (isSourceNumber || isSourceRoman) {
        buffer = lastToken.slice(0, -1);
      } else if (isSourceChar) {
        const prevChar = rawTokens.filter((t) => t !== ' ').at(-1) || '';
        lastCharInput = prevChar;
        if (prevChar) {
          const decoded = decodeOneToken(prevChar, 'char', targetMode, false);
          lastCharOutputStr = decoded.primary;
        } else {
          lastCharOutputStr = '';
        }
      }
    }
  }

  function handleClearAll() {
    settings.vibrate(35);
    buffer = '';
    rawTokens = [];
    lastCharInput = '';
    lastCharOutputStr = '';
  }

  function handlePaste(pasted: string) {
    const trimmed = pasted.trim();
    if (!trimmed) return;

    if (isSourceNumber || isSourceRoman) {
      const parts = trimmed.split(/[\s,;]+/);
      const newTokens: string[] = [];
      for (const p of parts) {
        if (p) newTokens.push(p);
      }
      if (newTokens.length > 0) {
        settings.vibrate(25);
        rawTokens = [...rawTokens, ...newTokens];
        toast.show(`Vloženo ${newTokens.length} hodnot`, 'success');
      }
    } else {
      const newTokens: string[] = [];
      for (const ch of trimmed) {
        newTokens.push(ch);
      }
      if (newTokens.length > 0) {
        settings.vibrate(25);
        rawTokens = [...rawTokens, ...newTokens];
        toast.show(`Vloženo ${newTokens.length} znaků`, 'success');
      }
    }
  }
</script>

<ModuleShell
  hasAlphabet={true}
  onReset={handleClearAll}
  onPaste={handlePaste}
>
  {#snippet output()}
    <TranslationCard
      text={plainTextOutput}
      pendingText={pendingInterlinearToken?.primary ?? ''}
      hasContent={rawTokens.length > 0 || !!buffer}
      emptyHint="Soustavy a režimy volí lišta níže."
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

  {#snippet input()}
    <div class="zone-input-flow">
      <!-- 1. Flow Mode Bar: VSTUP ➔ VÝSTUP (integrovaný živý stav převodu) -->
      <FlowBar
        {isSourceNumber}
        {isSourceRoman}
        {isSourceChar}
        {isTargetNumber}
        {isTargetRoman}
        {isTargetChar}
        {buffer}
        {sourceShort}
        {targetShort}
        {requiredLength}
        {autoEnter}
        {lastCharInput}
        {lastCharOutputStr}
        {isSourceInputError}
        {decodeCharResult}
        {decodeNumResult}
        {decodeRomanResult}
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

      <!-- 2. Dynamic Input Keypad (Adaptive Numpad OR Roman Numpad OR Alphabet Grid) -->
      {#if isSourceNumber}
        <AdaptiveNumpad
          base={sourceBase}
          onDigit={handleDigit}
        />
      {:else if isSourceRoman}
        <RomanNumpad
          buffer={buffer}
          canonicalOnly={isSourceRomanCanonical}
          showEasterEgg={showRomanEasterEgg}
          onDigit={handleDigit}
        />
      {:else}
        <AlphabetGrid
          letters={currentLetters}
          onLetter={handleLetter}
        />
      {/if}

      <!-- 3. Keypad Utility Row: SlideToAction, Space/Commit and Backspace (1fr 1.3fr 1fr) -->
      <div class="keypad-utility-row-3col">
        <SlideToAction
          disabled={rawTokens.length === 0 && !buffer}
          onAction={handleClearAll}
          ariaLabel="Vymazat text tažením"
        />
        <SpaceCommitButton
          pendingChar={buffer ? enterButtonSymbol : ''}
          commitDisabled={!isEnterButtonEnabled}
          onSpace={handleSpace}
          onCommit={handleCommit}
        />
        <BackspaceButton
          disabled={rawTokens.length === 0 && !buffer}
          onAction={handleBackspace}
        />
      </div>
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <div class="menu-group">
      <div class="menu-group-title">Abeceda</div>
      <AlphabetSelect
        value={alphabetId}
        defaultId="english-26"
        standardIds={['english-26', 'english-ch-27']}
        onChange={(newId) => (alphabetId = newId)}
      />
    </div>

    <div class="menu-group">
      <div class="menu-group-title">Kódování</div>
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
    </div>

    <div class="menu-group">
      <div class="menu-group-title">Automatické vkládání</div>
      <OptionRow
        label="Číslo ➔ znak"
        hint="Znak se vloží po zadání celého bloku, např. 5 bitů."
        type="switch"
        checked={autoEnter}
        onChange={(v) => (autoEnter = v)}
      />
    </div>

    <div class="menu-group">
      <div class="menu-group-title">Vzhled</div>
      <OptionRow
        label="Římská dekorace"
        hint="SPQR v rohu římské klávesnice."
        type="switch"
        checked={showRomanEasterEgg}
        onChange={(v) => (showRomanEasterEgg = v)}
      />
    </div>
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
  /* Menu styling */
  .menu-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    margin-bottom: var(--space-md);
  }

  .menu-group-title {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--color-text-secondary);
    margin-bottom: 2px;
  }
</style>
