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
  import {
    BASE_CONFIGS,
    type FlowMode,
    getFlowModeLabel,
    getFlowModeShort
  } from './numbersData';
  import {
    decodeBuffer,
    parseRoman,
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

  let decodedText = $state<string>(modSettings.getString('text', ''));
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

  // Persistence
  $effect(() => {
    modSettings.setString('text', decodedText);
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

  // Buffer capping when auto-enter is active
  $effect(() => {
    if (isSourceNumber && isTargetChar && autoEnter && buffer.length > requiredLength) {
      buffer = buffer.slice(0, requiredLength);
    }
  });

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

  const currentChar = $derived<string | null>(
    decodeCharResult.status === 'valid' ? decodeCharResult.character : null
  );

  const isNonStandardAlphabet = $derived(!['english-26', 'english-ch-27'].includes(alphabetId));

  $effect(() => {
    navigation.setMenuWarning(isNonStandardAlphabet);
    return () => {
      navigation.setMenuWarning(false);
    };
  });

  // State Machine for Enter / Auto-Enter
  // Mode 1: ZNAK -> COKOLI: auto-enter forced ON, Enter disabled
  // Mode 2: CISLO/ROMAN -> CISLO/ROMAN: auto-enter forced OFF, Enter enabled
  // Mode 3: CISLO -> ZNAK: auto-enter per setting. If ON: Enter disabled (Auto badge). If OFF: Enter enabled.
  // Mode 4: ROMAN -> ZNAK: Enter enabled (variable length)
  const isAutoEnterActive = $derived.by(() => {
    if (isSourceChar) return true;
    if (isSourceRoman) return false;
    if (isSourceNumber && isTargetChar) return autoEnter;
    return false;
  });

  const isEnterButtonEnabled = $derived.by(() => {
    if (isSourceChar) return false; // instant commit
    if (isTargetChar) {
      if (isSourceNumber && autoEnter) return false; // disabled when Auto-Enter is on
      return !!currentChar;
    }
    if (isTargetNumber) {
      return !!decodeNumResult.result;
    }
    if (isTargetRoman) {
      return !!decodeRomanResult.result;
    }
    return false;
  });

  const enterButtonSymbol = $derived.by(() => {
    if (isSourceChar) return '⚡';
    if (isTargetChar) {
      if (isSourceNumber && autoEnter) return '⚡';
      return currentChar || '↵';
    }
    if (isTargetNumber) {
      return decodeNumResult.result || '↵';
    }
    if (isTargetRoman) {
      return decodeRomanResult.result || '↵';
    }
    return '↵';
  });

  const enterButtonName = $derived.by(() => {
    if (isSourceChar) return 'Okamžitě';
    if (isTargetChar) {
      if (isSourceNumber && autoEnter) return 'Auto-Enter';
      return currentChar ? `Vložit „${currentChar}“` : 'Vložit';
    }
    if (isTargetNumber) {
      return decodeNumResult.result ? `Vložit ${decodeNumResult.result}` : 'Vložit';
    }
    if (isTargetRoman) {
      return decodeRomanResult.result ? `Vložit ${decodeRomanResult.result}` : 'Vložit';
    }
    return 'Vložit';
  });

  // Actions
  function handleSwapFlow() {
    settings.vibrate(25);
    const prevSource = sourceMode;
    const prevTarget = targetMode;
    sourceMode = prevTarget;
    targetMode = prevSource;
    buffer = '';
  }

  function handleDigit(digit: string) {
    // If auto-enter is active for Number -> Char, cap at requiredLength
    if (isSourceNumber && isTargetChar && autoEnter && buffer.length >= requiredLength) {
      settings.vibrate(40);
      return;
    }

    buffer += digit;

    // Check auto-enter condition for Number -> Char
    if (isSourceNumber && isTargetChar && autoEnter && buffer.length >= requiredLength) {
      if (currentChar) {
        settings.vibrate(30);
        decodedText += currentChar;
        buffer = '';
      } else if (decodeCharResult.status === 'out_of_range') {
        settings.vibrate(50);
        toast.show(decodeCharResult.errorText || 'Číslo je mimo rozsah abecedy', 'warning');
      }
    }
  }

  function handleLetter(char: string) {
    settings.vibrate(20);
    lastCharInput = char;

    if (isTargetChar) {
      // Char -> Char (identity)
      decodedText += char;
    } else if (isTargetNumber) {
      // Char -> Number (convert to target base)
      const numStr = convertCharToNumber(char, targetBase, currentLetters, zeroBased, asciiMode);
      if (numStr !== null) {
        lastCharOutputStr = numStr;
        decodedText += (decodedText ? ' ' : '') + numStr;
      }
    } else if (isTargetRoman) {
      // Char -> Roman
      const romanStr = convertCharToRoman(char, currentLetters, zeroBased, asciiMode);
      if (romanStr !== null) {
        lastCharOutputStr = romanStr;
        decodedText += (decodedText ? ' ' : '') + romanStr;
      }
    }
  }

  function handleCommit() {
    if (!isEnterButtonEnabled) return;
    settings.vibrate(25);

    if (isTargetChar && currentChar) {
      decodedText += currentChar;
      buffer = '';
    } else if (isTargetNumber && decodeNumResult.result) {
      decodedText += (decodedText ? ' ' : '') + decodeNumResult.result;
      buffer = '';
    } else if (isTargetRoman && decodeRomanResult.result) {
      decodedText += (decodedText ? ' ' : '') + decodeRomanResult.result;
      buffer = '';
    }
  }

  function handleSpace() {
    settings.vibrate(20);

    if (isSourceNumber || isSourceRoman) {
      if (isTargetChar) {
        if (currentChar) {
          decodedText += currentChar + ' ';
          buffer = '';
        } else {
          decodedText += ' ';
        }
      } else if (isTargetNumber) {
        if (decodeNumResult.result) {
          decodedText += (decodedText ? ' ' : '') + decodeNumResult.result + ' ';
          buffer = '';
        } else {
          decodedText += ' ';
        }
      } else if (isTargetRoman) {
        if (decodeRomanResult.result) {
          decodedText += (decodedText ? ' ' : '') + decodeRomanResult.result + ' ';
          buffer = '';
        } else {
          decodedText += ' ';
        }
      }
    } else if (isSourceChar) {
      if (isTargetNumber || isTargetRoman) {
        decodedText += ' / ';
      } else {
        decodedText += ' ';
      }
    }
  }

  function handleBackspace() {
    settings.vibrate(25);
    if (buffer.length > 0) {
      buffer = buffer.slice(0, -1);
    } else if (decodedText.length > 0) {
      decodedText = decodedText.slice(0, -1);
    }
  }

  function handleClearAll() {
    settings.vibrate(35);
    buffer = '';
    decodedText = '';
    lastCharInput = '';
    lastCharOutputStr = '';
  }

  function handlePaste(pasted: string) {
    decodedText += pasted;
  }
</script>

<ModuleShell
  hasAlphabet={true}
  onReset={handleClearAll}
  onPaste={handlePaste}
>
  {#snippet output()}
    <TranslationCard
      text={decodedText}
      emptyHint="Soustavy a režimy volí lišta níže."
    />
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
          disabled={!decodedText && !buffer}
          onAction={handleClearAll}
          ariaLabel="Vymazat text tažením"
        />
        <SpaceCommitButton
          pendingChar={!isAutoEnterActive && isEnterButtonEnabled ? (enterButtonSymbol !== '↵' ? enterButtonSymbol : '↵') : ''}
          onSpace={handleSpace}
          onCommit={handleCommit}
        />
        <BackspaceButton
          disabled={!decodedText && !buffer}
          onAction={handleBackspace}
        />
      </div>
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <div class="menu-group">
      <div class="menu-group-title">Aktivní abeceda</div>
      <AlphabetSelect
        value={alphabetId}
        defaultId="english-26"
        standardIds={['english-26', 'english-ch-27']}
        onChange={(newId) => (alphabetId = newId)}
      />
    </div>

    <div class="menu-group">
      <div class="menu-group-title">Indexování a kódování</div>
      <OptionRow
        label="Indexování od nuly (0-based)"
        hint="Standardně 1-based (A=1, B=2). Při zapnutí A=0, B=1."
        type="switch"
        checked={zeroBased}
        disabled={asciiMode}
        onChange={(v) => (zeroBased = v)}
      />
      <OptionRow
        label="Režim ASCII"
        hint="Převádí přímo dle standardní ASCII tabulky (DEC 65 = A, HEX 41 = A)."
        type="switch"
        checked={asciiMode}
        onChange={(v) => (asciiMode = v)}
      />
    </div>

    <div class="menu-group">
      <div class="menu-group-title">Automatické vkládání (Auto-Enter)</div>
      <OptionRow
        label="Automatické vkládání pro Číslo ➔ Znak"
        hint="Při převodu čísel na znaky automaticky potvrdí písmeno po dosažení plné délky bloku (např. 5 bitů u binárky)."
        type="switch"
        checked={autoEnter}
        onChange={(v) => (autoEnter = v)}
      />
    </div>

    <div class="menu-group">
      <div class="menu-group-title">Vzhled a chování</div>
      <OptionRow
        label="Zobrazovat římskou dekoraci"
        hint="Zobrazí v prázdném rohu římské klávesnice symbol SPQR."
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
  title={activeModalType === 'source' ? 'Zvolte vstupní režim (Z)' : 'Zvolte výstupní režim (DO)'}
  activeMode={activeModalType === 'source' ? sourceMode : targetMode}
  alphabetName={currentLayout.name}
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
