<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import SlideToAction from '../../components/ui/SlideToAction.svelte';
  import BackspaceButton from '../../components/ui/BackspaceButton.svelte';
  import DominantButton from '../../components/ui/DominantButton.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import AlphabetSelect from '../../components/ui/AlphabetSelect.svelte';
  import AdaptiveNumpad from './AdaptiveNumpad.svelte';
  import RomanNumpad from './RomanNumpad.svelte';
  import AlphabetGrid from './AlphabetGrid.svelte';
  import FlowModeModal from './FlowModeModal.svelte';
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
  import { ArrowsLeftRight, CaretDown } from 'phosphor-svelte';

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
    <TranslationCard text={decodedText} />
  {/snippet}

  {#snippet input()}
    <div class="keypad-zone">
      <!-- 1. Flow Mode Bar: VSTUP ➔ VÝSTUP (integrovaný živý stav převodu) -->
      <div class="flow-bar">
        <!-- Vstupní tlačítko -->
        <button
          type="button"
          class="flow-btn"
          class:has-live-val={(isSourceNumber || isSourceRoman) && buffer.length > 0}
          class:is-error={isSourceInputError}
          onclick={() => {
            settings.vibrate(20);
            activeModalType = 'source';
          }}
          aria-label="Nastavit vstupní soustavu"
        >
          <span class="flow-btn-tag">Z:</span>
          {#if (isSourceNumber || isSourceRoman) && buffer.length > 0}
            <span class="flow-val-live font-mono">
              {buffer}
            </span>
            {#if isSourceNumber && isTargetChar && autoEnter}
              <span class="flow-progress">({buffer.length}/{requiredLength})</span>
            {/if}
          {:else if isSourceChar && lastCharInput}
            <span class="flow-char-badge is-valid">{lastCharInput}</span>
          {:else}
            <span class="flow-btn-val">{sourceShort}</span>
          {/if}
          <span class="flow-caret"><CaretDown size={14} weight="bold" /></span>
        </button>

        <!-- Prohodit vstup a výstup -->
        <button
          type="button"
          class="flow-swap-btn"
          onclick={handleSwapFlow}
          title="Prohodit vstup a výstup"
          aria-label="Prohodit vstup a výstup"
        >
          <ArrowsLeftRight size={18} weight="bold" />
        </button>

        <!-- Výstupní tlačítko -->
        <button
          type="button"
          class="flow-btn"
          class:has-live-val={((isSourceNumber || isSourceRoman) && buffer.length > 0) || (isSourceChar && !!lastCharOutputStr)}
          class:is-error={(isSourceNumber || isSourceRoman) && ((isTargetChar && (decodeCharResult.status === 'out_of_range' || decodeCharResult.status === 'invalid_digit')) || (isTargetRoman && !decodeRomanResult.result && !!decodeRomanResult.error))}
          onclick={() => {
            settings.vibrate(20);
            activeModalType = 'target';
          }}
          aria-label="Nastavit cílovou soustavu"
        >
          <span class="flow-btn-tag">DO:</span>
          {#if (isSourceNumber || isSourceRoman) && isTargetChar && buffer.length > 0}
            {#if decodeCharResult.status === 'valid'}
              <span class="flow-char-badge is-valid">{decodeCharResult.character}</span>
            {:else if decodeCharResult.status === 'out_of_range' || decodeCharResult.status === 'invalid_digit'}
              <span class="flow-char-badge is-error" title={decodeCharResult.errorText}>Mimo</span>
            {:else}
              <span class="flow-char-badge is-empty">—</span>
            {/if}
          {:else if (isSourceNumber || isSourceRoman) && isTargetNumber && buffer.length > 0}
            <span class="flow-val-live font-mono font-accent">
              {decodeNumResult.result || '—'}
            </span>
          {:else if (isSourceNumber || isSourceRoman) && isTargetRoman && buffer.length > 0}
            {#if decodeRomanResult.result}
              <span class="flow-val-live font-mono font-accent">
                {decodeRomanResult.result}
              </span>
            {:else}
              <span class="flow-char-badge is-error" title={decodeRomanResult.error}>Mimo</span>
            {/if}
          {:else if isSourceChar && (isTargetNumber || isTargetRoman) && lastCharOutputStr}
            <span class="flow-val-live font-mono font-accent">
              {lastCharOutputStr}
            </span>
          {:else}
            <span class="flow-btn-val">{targetShort}</span>
          {/if}
          <span class="flow-caret"><CaretDown size={14} weight="bold" /></span>
        </button>
      </div>

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
          onDigit={handleDigit}
        />
      {:else}
        <AlphabetGrid
          letters={currentLetters}
          onLetter={handleLetter}
        />
      {/if}

      <!-- 3. Keypad Utility Row -->
      <div class="keypad-utility-row">
        <SlideToAction
          disabled={!decodedText && !buffer}
          onAction={handleClearAll}
          label="Smazat vše"
        />
        <BackspaceButton
          disabled={!decodedText && !buffer}
          onAction={handleBackspace}
        />
      </div>

      <!-- 4. Dominant Button Row -->
      <div class="keypad-dominant-2col">
        <DominantButton
          symbol="␣"
          name="Mezera"
          variant="secondary"
          onClick={handleSpace}
        />
        <DominantButton
          symbol={enterButtonSymbol}
          name={enterButtonName}
          ready={isEnterButtonEnabled}
          disabled={!isEnterButtonEnabled}
          variant={isAutoEnterActive ? 'secondary' : 'accent'}
          onClick={handleCommit}
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
  /* Keypad Zone */
  .keypad-zone {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    width: 100%;
  }

  /* Flow Bar (VSTUP ➔ VÝSTUP) */
  .flow-bar {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: var(--space-xs);
    width: 100%;
    margin-bottom: 2px;
  }

  .flow-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    height: 38px;
    padding: 0 var(--space-sm);
    cursor: pointer;
    overflow: hidden;
    white-space: nowrap;
    transition: background-color 0.12s ease, border-color 0.12s ease;
  }

  .flow-btn:active {
    background-color: var(--color-surface-active);
    border-color: var(--color-accent-primary);
  }

  .flow-btn.has-live-val {
    border-color: var(--color-border-medium);
  }

  .flow-btn.is-error {
    border-color: var(--color-accent-danger);
    background-color: rgba(255, 68, 68, 0.08);
  }

  .flow-btn-tag {
    font-size: 10px;
    font-weight: 700;
    color: var(--color-text-secondary);
    text-transform: uppercase;
  }

  .flow-btn-val {
    font-family: var(--font-mono, monospace);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-accent-primary);
  }

  .flow-val-live {
    font-family: var(--font-mono, monospace);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text-primary);
    max-width: 90px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .font-accent {
    color: var(--color-accent-primary);
  }

  .flow-progress {
    font-size: 10px;
    font-family: var(--font-mono, monospace);
    color: var(--color-text-secondary);
  }

  .flow-char-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 20px;
    padding: 0 5px;
    border-radius: var(--radius-sm);
    font-family: var(--font-mono, monospace);
    font-size: var(--text-xs);
    font-weight: 800;
    line-height: 1;
  }

  .flow-char-badge.is-valid {
    background-color: var(--color-accent-primary);
    color: #000;
    box-shadow: 0 0 6px rgba(0, 210, 255, 0.4);
  }

  .flow-char-badge.is-error {
    background-color: var(--color-accent-danger);
    color: #fff;
    font-size: 10px;
  }

  .flow-char-badge.is-empty {
    background-color: var(--color-surface-3);
    color: var(--color-text-muted);
  }

  .flow-caret {
    color: var(--color-text-muted);
    margin-left: auto;
    display: flex;
    align-items: center;
  }

  .flow-swap-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: var(--radius-md);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: background-color 0.12s ease, color 0.12s ease, transform 0.1s ease;
  }

  .flow-swap-btn:active {
    background-color: var(--color-surface-active);
    color: var(--color-accent-primary);
    transform: scale(0.92);
  }

  .keypad-utility-row {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: var(--space-sm);
    height: var(--utility-row-height);
    margin-top: 2px;
  }

  .keypad-dominant-2col {
    display: grid;
    grid-template-columns: 0.85fr 1.15fr;
    gap: var(--space-sm);
  }

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
