<script lang="ts">
  import { onDestroy } from 'svelte';
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import SlideToAction from '../../components/ui/SlideToAction.svelte';
  import SpaceButton from '../../components/ui/SpaceButton.svelte';
  import BackspaceButton from '../../components/ui/BackspaceButton.svelte';
  import RadioGroup, { type RadioOption } from '../../components/ui/RadioGroup.svelte';
  import InteractiveCross from './InteractiveCross.svelte';
  import CoordinateKeypad from './CoordinateKeypad.svelte';
  import CrossReference from './CrossReference.svelte';
  import PolybiusOmissionModal from './PolybiusOmissionModal.svelte';
  import {
    CROSS_TYPES,
    type CrossType,
    type CrossTypeConfig,
    type PolybiusSize,
    type PolybiusCoordLabel
  } from './crossData';
  import { coordinatesToChar, getPhoneKeyLetters } from './crossSolver';
  import { getFallbackT9Word } from './t9Solver';
  import { t9Service } from './t9Service';
  import { alphabet, type AlphabetLayout } from '../../state/alphabet.svelte';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import { localSettingsService } from '../../services/localSettingsService';
  import { navigation } from '../../state/navigation.svelte';
  import AlphabetSelect from '../../components/ui/AlphabetSelect.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import { Warning } from 'phosphor-svelte';

  const modSettings = localSettingsService.forModule('cross');

  let inputLetters = $state<string>(modSettings.getString('text', ''));
  let crossTypeId = $state<CrossType>(
    (modSettings.getString('type', 'large-polish') as CrossType) || 'large-polish'
  );
  let phoneInputMode = $state<'multitap' | 't9'>(
    (modSettings.getString('phoneMode', 'multitap') as 'multitap' | 't9') || 'multitap'
  );

  const phoneModeOptions: SegmentOption<'multitap' | 't9'>[] = [
    { id: 'multitap', label: 'Klasik' },
    { id: 't9', label: 'T9' }
  ];

  // Polybius configuration state
  let polybiusSize = $state<PolybiusSize>(
    (modSettings.getString('polybius:size', '5x5') as PolybiusSize) || '5x5'
  );
  let polybiusCoordLabels = $state<PolybiusCoordLabel>(
    (modSettings.getString('polybius:coordLabels', 'numbers') as PolybiusCoordLabel) || 'numbers'
  );

  const polybiusSizeOptions: SegmentOption<PolybiusSize>[] = [
    { id: '5x5', label: '5×5 (25)' },
    { id: '6x6', label: '6×6 (36)' }
  ];

  const polybiusCoordOptions = $derived<SegmentOption<PolybiusCoordLabel>[]>([
    { id: 'numbers', label: polybiusSize === '6x6' ? '1–6' : '1–5' },
    { id: 'letters', label: polybiusSize === '6x6' ? 'A–F' : 'A–E' }
  ]);

  const polybiusSizeNum = $derived<number>(polybiusSize === '6x6' ? 6 : 5);
  const polybiusCapacity = $derived<number>(polybiusSize === '6x6' ? 36 : 25);
  const polybiusIndices = $derived<number[]>(
    Array.from({ length: polybiusSizeNum }, (_, i) => i + 1)
  );

  // Per-tool alphabet configuration
  let toolAlphabetMap = $state<Record<string, string>>({
    'large-polish': modSettings.getString('alphabet:large-polish', 'english-ch-27'),
    'small-polish': modSettings.getString('alphabet:small-polish', 'english-26'),
    'polybius': modSettings.getString('alphabet:polybius', 'english-26')
  });

  function setToolAlphabet(toolId: string, alphabetId: string) {
    toolAlphabetMap = {
      ...toolAlphabetMap,
      [toolId]: alphabetId
    };
    modSettings.setString('alphabet:' + toolId, alphabetId);
  }

  // Coordinate keypad state (Polish crosses)
  let selectedAxis1 = $state<number | null>(null);
  let selectedAxis2 = $state<number | null>(null);
  let selectedAxis3 = $state<number | null>(null);

  // Multi-tap phone keypad state
  let pendingKey = $state<string | null>(null);
  let pendingTapIndex = $state<number>(0);
  let pendingChar = $state<string>('');
  let commitTimer: ReturnType<typeof setTimeout> | null = null;

  // T9 predictive mode state
  let t9Digits = $state<string>('');
  let t9Candidates = $state<string[]>([]);
  let t9CandidateIndex = $state<number>(0);
  let isT9Loading = $state<boolean>(false);
  let t9ReqCounter = 0;

  // Persistence
  $effect(() => {
    modSettings.setString('text', inputLetters);
    modSettings.setString('type', crossTypeId);
    modSettings.setString('phoneMode', phoneInputMode);
    modSettings.setString('polybius:size', polybiusSize);
    modSettings.setString('polybius:coordLabels', polybiusCoordLabels);
  });

  const activeConfig = $derived.by<CrossTypeConfig>(() => {
    const base = CROSS_TYPES.find((c) => c.id === crossTypeId) ?? CROSS_TYPES[0];
    if (crossTypeId === 'polybius') {
      return {
        ...base,
        capacity: polybiusCapacity,
        defaultAlphabetId: polybiusSize === '6x6' ? 'alphanumeric-36' : 'english-26',
        standardAlphabetIds:
          polybiusSize === '6x6'
            ? ['alphanumeric-36', 'english-26']
            : ['english-26', 'alphanumeric-36']
      };
    }
    return base;
  });

  const currentAlphabetId = $derived<string>(
    toolAlphabetMap[crossTypeId] ?? activeConfig.defaultAlphabetId ?? 'english-26'
  );

  const currentLayout = $derived<AlphabetLayout>(
    alphabet.getLayout(currentAlphabetId) ?? alphabet.layouts[0]
  );

  const defaultLayout = $derived<AlphabetLayout | undefined>(
    activeConfig.defaultAlphabetId ? alphabet.getLayout(activeConfig.defaultAlphabetId) : undefined
  );

  const isNonStandardAlphabet = $derived.by(() => {
    if (!activeConfig.hasAlphabet) return false;
    if (!activeConfig.standardAlphabetIds || activeConfig.standardAlphabetIds.length === 0) return false;
    return !activeConfig.standardAlphabetIds.includes(currentAlphabetId);
  });

  // Sync warning indicator with navigation header
  $effect(() => {
    navigation.setMenuWarning(isNonStandardAlphabet);
    return () => {
      navigation.setMenuWarning(false);
    };
  });

  // Polybius omitted letters storage key
  const omissionStorageKey = $derived(
    `polybius:omitted:${polybiusSize}:${currentAlphabetId}`
  );

  let isOmissionModalOpen = $state<boolean>(false);
  let omittedLetters = $state<string[]>([]);

  $effect(() => {
    if (crossTypeId !== 'polybius') return;
    const cap = polybiusCapacity;
    const rawLetters = currentLayout.letters;
    const key = omissionStorageKey;
    const stored = modSettings.getJSON<string[] | null>(key, null);

    if (stored !== null) {
      omittedLetters = stored;
    } else {
      // Ad-hoc pravidlo: pokud má abeceda přesně N+1 znaků a obsahuje Q, vynech Q
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
    if (omittedLetters.length === 0) return '(žádné)';
    if (omittedLetters.length <= 3) return omittedLetters.join(', ');
    return omittedLetters.slice(0, 3).join(', ') + '... (+' + (omittedLetters.length - 3) + ')';
  });

  function handleSaveOmitted(newOmitted: string[]) {
    omittedLetters = newOmitted;
    modSettings.setJSON(omissionStorageKey, newOmitted);
    isOmissionModalOpen = false;
    toast.show('Vynechaná písmena uložena', 'success');
  }

  function handlePolybiusSizeChange(newSize: PolybiusSize) {
    if (polybiusSize === newSize) return;
    settings.vibrate(25);
    polybiusSize = newSize;
    modSettings.setString('polybius:size', newSize);
    selectedAxis1 = null;
    selectedAxis2 = null;

    if (newSize === '6x6' && toolAlphabetMap['polybius'] === 'english-26') {
      setToolAlphabet('polybius', 'alphanumeric-36');
    } else if (newSize === '5x5' && toolAlphabetMap['polybius'] === 'alphanumeric-36') {
      setToolAlphabet('polybius', 'english-26');
    }
  }

  function handlePolybiusCoordChange(newMode: PolybiusCoordLabel) {
    if (polybiusCoordLabels === newMode) return;
    settings.vibrate(20);
    polybiusCoordLabels = newMode;
    modSettings.setString('polybius:coordLabels', newMode);
  }

  function handlePolybiusCoordSelect(axis: 1 | 2, val: number) {
    const nextA1 = axis === 1 ? (selectedAxis1 === val ? null : val) : selectedAxis1;
    const nextA2 = axis === 2 ? (selectedAxis2 === val ? null : val) : selectedAxis2;

    selectedAxis1 = nextA1;
    selectedAxis2 = nextA2;

    if (nextA1 !== null && nextA2 !== null) {
      const char = coordinatesToChar('polybius', nextA1, nextA2, null, activeLetters, polybiusSizeNum);
      if (char) {
        settings.vibrate(28);
        inputLetters += char;
        interactiveCrossComponent?.flashCoordinate(nextA1, nextA2);
        selectedAxis1 = null;
        selectedAxis2 = null;
      }
    }
  }

  // Resolves letters for current tool (sequential first X, padded with space if fewer)
  const activeLetters = $derived.by(() => {
    if (crossTypeId === 'polybius') {
      const cap = polybiusCapacity;
      const filtered = currentLayout.letters.filter((ch) => !omittedLetters.includes(ch));
      const sliced = filtered.slice(0, cap);
      if (sliced.length < cap) {
        const padded = [...sliced];
        while (padded.length < cap) {
          padded.push(' ');
        }
        return padded;
      }
      return sliced;
    }

    const cap = activeConfig.capacity;
    if (!cap) return currentLayout.letters;
    const sliced = currentLayout.letters.slice(0, cap);
    if (sliced.length < cap) {
      const padded = [...sliced];
      while (padded.length < cap) {
        padded.push(' ');
      }
      return padded;
    }
    return sliced;
  });

  const displayText = $derived.by(() => {
    if (crossTypeId === 'mobile-keypad') {
      if (phoneInputMode === 't9' && t9Digits) {
        const word = t9Candidates[t9CandidateIndex] || getFallbackT9Word(t9Digits);
        const prefix = inputLetters.length > 0 && !inputLetters.endsWith(' ') ? inputLetters + ' ' : inputLetters;
        return prefix + word;
      }
      if (phoneInputMode === 'multitap' && pendingChar) {
        return inputLetters + pendingChar;
      }
    }
    return inputLetters;
  });

  function clearCommitTimer() {
    if (commitTimer) {
      clearTimeout(commitTimer);
      commitTimer = null;
    }
  }

  function commitPendingChar() {
    clearCommitTimer();
    if (pendingChar) {
      inputLetters += pendingChar;
    }
    pendingKey = null;
    pendingTapIndex = 0;
    pendingChar = '';
  }

  function fetchT9Candidates(digits: string) {
    if (!digits) {
      t9Candidates = [];
      t9CandidateIndex = 0;
      isT9Loading = false;
      return;
    }
    const currentReq = ++t9ReqCounter;
    isT9Loading = true;
    t9Candidates = [];
    t9CandidateIndex = 0;
    t9Service.query(digits).then((res) => {
      if (currentReq === t9ReqCounter) {
        t9Candidates = res.candidates;
        t9CandidateIndex = 0;
        isT9Loading = false;
      }
    });
  }

  function commitT9Word(word: string, appendSpace: boolean = true) {
    const prefix = inputLetters.length > 0 && !inputLetters.endsWith(' ') ? inputLetters + ' ' : inputLetters;
    inputLetters = prefix + word + (appendSpace ? ' ' : '');
    t9Digits = '';
    t9Candidates = [];
    t9CandidateIndex = 0;
  }

  function handleSelectT9Candidate(word: string) {
    settings.vibrate(20);
    commitT9Word(word, true);
  }

  function handlePhoneKeyTap(keyId: string) {
    if (phoneInputMode === 't9') {
      handleT9KeyTap(keyId);
    } else {
      handleMultiTapKeyTap(keyId);
    }
  }

  function handleMultiTapKeyTap(keyId: string) {
    const keyLetters = getPhoneKeyLetters(keyId);
    if (keyLetters.length === 0) return;

    if (pendingKey === keyId) {
      clearCommitTimer();
      pendingTapIndex = (pendingTapIndex + 1) % keyLetters.length;
      pendingChar = keyLetters[pendingTapIndex];
      commitTimer = setTimeout(() => {
        commitPendingChar();
      }, 1000);
    } else {
      if (pendingChar) {
        commitPendingChar();
      }
      clearCommitTimer();
      pendingKey = keyId;
      pendingTapIndex = 0;
      pendingChar = keyLetters[0];
      commitTimer = setTimeout(() => {
        commitPendingChar();
      }, 1000);
    }
  }

  function handleT9KeyTap(keyId: string) {
    if (keyId >= '2' && keyId <= '9') {
      t9Digits += keyId;
      fetchT9Candidates(t9Digits);
    } else if (keyId === '*') {
      // Cycle candidate words or insert *
      if (t9Candidates.length > 1) {
        settings.vibrate(15);
        t9CandidateIndex = (t9CandidateIndex + 1) % t9Candidates.length;
      } else if (!t9Digits) {
        inputLetters += '*';
      }
    } else if (keyId === '0') {
      // Confirm candidate and add space
      if (t9Digits) {
        const word = t9Candidates[t9CandidateIndex] || getFallbackT9Word(t9Digits);
        commitT9Word(word, true);
      } else {
        inputLetters += ' ';
      }
    } else if (keyId === '1') {
      // Punctuation
      if (t9Digits) {
        const word = t9Candidates[t9CandidateIndex] || getFallbackT9Word(t9Digits);
        commitT9Word(word, false);
      }
      inputLetters += '.';
    } else if (keyId === '#') {
      // Confirm without space or insert #
      if (t9Digits) {
        const word = t9Candidates[t9CandidateIndex] || getFallbackT9Word(t9Digits);
        commitT9Word(word, false);
      } else {
        inputLetters += '#';
      }
    }
  }

  function handlePhoneKeyLongPress(keyId: string) {
    if (phoneInputMode === 't9') {
      if (t9Digits) {
        const word = t9Candidates[t9CandidateIndex] || getFallbackT9Word(t9Digits);
        commitT9Word(word, false);
      }
      inputLetters += keyId;
    } else {
      commitPendingChar();
      inputLetters += keyId;
    }
  }

  function handlePhoneModeChange(newMode: 'multitap' | 't9') {
    if (phoneInputMode === newMode) return;
    settings.vibrate(25);
    if (phoneInputMode === 'multitap' && pendingChar) {
      commitPendingChar();
    } else if (phoneInputMode === 't9' && t9Digits) {
      const word = t9Candidates[t9CandidateIndex] || getFallbackT9Word(t9Digits);
      commitT9Word(word, false);
    }
    phoneInputMode = newMode;
  }

  const polishSelectedChar = $derived.by(() => {
    if (crossTypeId === 'mobile-keypad') return null;
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

  const crossTypeOptions: RadioOption<CrossType>[] = CROSS_TYPES.map((c) => ({
    value: c.id,
    label: c.name,
    badge: c.shortName,
    description: c.description
  }));

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
    if (crossTypeId === 'mobile-keypad') {
      if (phoneInputMode === 't9') {
        if (t9Digits.length > 0) {
          t9Digits = t9Digits.slice(0, -1);
          fetchT9Candidates(t9Digits);
        } else if (inputLetters.length > 0) {
          inputLetters = inputLetters.slice(0, -1);
        }
      } else {
        if (pendingChar) {
          clearCommitTimer();
          pendingKey = null;
          pendingTapIndex = 0;
          pendingChar = '';
        } else if (inputLetters.length > 0) {
          inputLetters = inputLetters.slice(0, -1);
        }
      }
    } else {
      if (selectedAxis1 !== null || selectedAxis2 !== null || selectedAxis3 !== null) {
        selectedAxis1 = null;
        selectedAxis2 = null;
        selectedAxis3 = null;
      } else if (inputLetters.length > 0) {
        inputLetters = inputLetters.slice(0, -1);
      }
    }
  }

  function handleClearAll() {
    clearCommitTimer();
    settings.vibrate(35);
    inputLetters = '';
    pendingKey = null;
    pendingTapIndex = 0;
    pendingChar = '';
    t9Digits = '';
    t9Candidates = [];
    t9CandidateIndex = 0;
    selectedAxis1 = null;
    selectedAxis2 = null;
    selectedAxis3 = null;
  }

  function handleReset() {
    handleClearAll();
  }

  function handlePaste(text: string) {
    clearCommitTimer();
    if (text) {
      inputLetters += (inputLetters.length > 0 ? ' ' : '') + text.toUpperCase();
      toast.show('Text vložen ze schránky', 'success');
    }
  }

  function handleTypeChange(newType: CrossType) {
    clearCommitTimer();
    crossTypeId = newType;
    pendingKey = null;
    pendingTapIndex = 0;
    pendingChar = '';
    t9Digits = '';
    t9Candidates = [];
    t9CandidateIndex = 0;
    selectedAxis1 = null;
    selectedAxis2 = null;
    selectedAxis3 = null;
  }

  onDestroy(() => {
    clearCommitTimer();
    t9Service.terminate();
  });
</script>

<ModuleShell
  onReset={handleReset}
  onPaste={handlePaste}
>
  {#snippet menuOptions()}
    <div class="menu-group">
      <div class="menu-group-title">Šifrovací nástroj</div>
      <RadioGroup
        options={crossTypeOptions}
        value={crossTypeId}
        onChange={handleTypeChange}
      />
    </div>

    {#if activeConfig.hasAlphabet}
      <div class="menu-group">
        <div class="menu-group-title">Abeceda nástroje</div>

        {#if isNonStandardAlphabet}
          <div class="nonstandard-banner" role="alert">
            <div class="banner-top">
              <span class="banner-icon"><Warning size={20} weight="fill" /></span>
              <div class="banner-text">
                <span class="banner-title">Nestandardní abeceda</span>
                <p class="banner-desc">
                  Pro {activeConfig.name} je nastavena <strong>{currentLayout.name}</strong>. Běžně se používá <strong>{defaultLayout?.name ?? 'výchozí'}</strong>.
                </p>
              </div>
            </div>
            <button
              type="button"
              class="banner-reset-btn"
              onclick={() => {
                settings.vibrate(20);
                if (activeConfig.defaultAlphabetId) {
                  setToolAlphabet(crossTypeId, activeConfig.defaultAlphabetId);
                }
              }}
            >
              Obnovit výchozí ({defaultLayout?.name ?? ''})
            </button>
          </div>
        {/if}

        <AlphabetSelect
          value={currentAlphabetId}
          defaultId={activeConfig.defaultAlphabetId}
          standardIds={activeConfig.standardAlphabetIds}
          onChange={(newId) => {
            setToolAlphabet(crossTypeId, newId);
          }}
        />
      </div>
    {/if}

    {#if crossTypeId === 'polybius'}
      <div class="menu-group">
        <div class="menu-group-title">Velikost mřížky</div>
        <SegmentedControl
          options={polybiusSizeOptions}
          value={polybiusSize}
          ariaLabel="Velikost mřížky Polybiova čtverce"
          onChange={handlePolybiusSizeChange}
        />
      </div>

      <div class="menu-group">
        <div class="menu-group-title">Popisky os / souřadnic</div>
        <SegmentedControl
          options={polybiusCoordOptions}
          value={polybiusCoordLabels}
          ariaLabel="Popisky os Polybiova čtverce"
          onChange={handlePolybiusCoordChange}
        />
      </div>

      {#if currentLayout.letters.length > polybiusCapacity}
        <div class="menu-group">
          <div class="menu-group-title">Vynechaná písmena</div>
          <button
            type="button"
            class="menu-action-pill-btn"
            onclick={() => {
              settings.vibrate(20);
              isOmissionModalOpen = true;
            }}
          >
            <span class="btn-primary-text">Upravit vynechaná písmena</span>
            <span class="btn-subtext">{omittedPillText}</span>
          </button>
        </div>
      {/if}
    {/if}
  {/snippet}

  {#snippet output()}
    <TranslationCard text={displayText} />
  {/snippet}

  {#snippet input()}
    <div class="cross-module-content">
      <!-- Mobile Keypad Mode Switcher (Klasické vs T9) -->
      {#if crossTypeId === 'mobile-keypad'}
        <SegmentedControl
          options={phoneModeOptions}
          value={phoneInputMode}
          ariaLabel="Režim mobilní klávesnice"
          onChange={handlePhoneModeChange}
        />

        <!-- T9 Candidate Suggestion Bar -->
        {#if phoneInputMode === 't9'}
          <div class="t9-candidate-container" role="region" aria-label="Návrhy slov T9">
            <div class="t9-digits-badge" class:is-loading={isT9Loading} title="Zadané číslice">
              {#if isT9Loading}
                <span class="t9-digits-spinner"></span>
              {/if}
              <span>{t9Digits || 'T9'}</span>
            </div>
            <div class="t9-candidates-scroll">
              {#if isT9Loading}
                <div class="t9-loading-state">
                  <span class="t9-spinner"></span>
                  <span class="t9-loading-text">Hledám ve slovníku...</span>
                  <span class="t9-fallback-chip">{getFallbackT9Word(t9Digits)}</span>
                </div>
              {:else if t9Candidates.length > 0}
                {#each t9Candidates as candidate, idx}
                  <button
                    type="button"
                    class="t9-candidate-chip"
                    class:is-active={idx === t9CandidateIndex}
                    onclick={() => handleSelectT9Candidate(candidate)}
                  >
                    {candidate}
                  </button>
                {/each}
              {:else if t9Digits}
                <span class="t9-fallback-chip">{getFallbackT9Word(t9Digits)}</span>
                <span class="t9-no-match-text">(bez shody)</span>
              {:else}
                <span class="t9-hint-text">1 stisk na písmeno · (*) další slovo · (0) mezera</span>
              {/if}
            </div>
          </div>
        {/if}
      {/if}

      <!-- Center Zone: Interactive Cross or Mobile Keypad (100% width) -->
      <div class="visual-cross-container">
        <InteractiveCross
          bind:this={interactiveCrossComponent}
          crossType={crossTypeId}
          letters={activeLetters}
          {selectedAxis1}
          {selectedAxis2}
          {selectedAxis3}
          polybiusSize={polybiusSizeNum}
          {polybiusCoordLabels}
          pendingKey={phoneInputMode === 'multitap' ? pendingKey : null}
          pendingTapIndex={phoneInputMode === 'multitap' ? pendingTapIndex : 0}
          onLetterSelect={handleDirectLetterSelect}
          onCoordSelect={handlePolybiusCoordSelect}
          onPhoneKeyTap={handlePhoneKeyTap}
          onPhoneKeyLongPress={handlePhoneKeyLongPress}
        />
      </div>

      <!-- Lower Zone: Coordinate Keypad (Only for Large Polish Cross) -->
      {#if crossTypeId === 'large-polish'}
        <div class="keypad-section">
          <CoordinateKeypad
            config={activeConfig}
            letters={activeLetters}
            {selectedAxis1}
            {selectedAxis2}
            {selectedAxis3}
            onAxis1Change={(val) => (selectedAxis1 = val)}
            onAxis2Change={(val) => (selectedAxis2 = val)}
            onAxis3Change={(val) => (selectedAxis3 = val)}
            onCommitLetter={handleCommitFromKeypad}
          />
        </div>
      {/if}

      <!-- Utility Row: SlideToAction, SpaceButton & BackspaceButton (1.2fr 1fr 1fr) -->
      <div class="keypad-utility-row-3col">
        <SlideToAction
          disabled={!inputLetters && !pendingChar && !t9Digits && selectedAxis1 === null && selectedAxis2 === null && selectedAxis3 === null}
          onAction={handleClearAll}
          label="Vymazat"
          ariaLabel="Vymazat text tažením"
        />

        <SpaceButton
          onAction={handleSpace}
        />

        <BackspaceButton
          disabled={!inputLetters && !pendingChar && !t9Digits && selectedAxis1 === null && selectedAxis2 === null && selectedAxis3 === null}
          hasActiveSelection={!!pendingChar || !!t9Digits || selectedAxis1 !== null || selectedAxis2 !== null || selectedAxis3 !== null}
          cancelLabel={t9Digits ? 'Smazat číslici' : 'Zrušit výběr'}
          cancelTitle="Zrušit rozepsaný znak"
          onAction={handleBackspace}
        />
      </div>
    </div>
  {/snippet}

  {#snippet reference()}
    <CrossReference />
  {/snippet}
</ModuleShell>

<PolybiusOmissionModal
  open={isOmissionModalOpen}
  alphabetName={currentLayout.name}
  allLetters={currentLayout.letters}
  initialOmitted={omittedLetters}
  targetCapacity={polybiusCapacity}
  onConfirm={handleSaveOmitted}
  onClose={() => (isOmissionModalOpen = false)}
/>

<style>
  .cross-module-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    width: 100%;
    align-items: center;
  }



  .t9-candidate-container {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 38px;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    padding: 4px 8px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .t9-digits-badge {
    font-family: var(--font-mono, monospace);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-accent-primary);
    background: rgba(0, 210, 255, 0.1);
    border: 1px solid rgba(0, 210, 255, 0.25);
    border-radius: var(--radius-sm);
    padding: 2px 6px;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: all 0.12s ease;
  }

  .t9-digits-badge.is-loading {
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 8px rgba(0, 210, 255, 0.35);
  }

  .t9-digits-spinner {
    width: 8px;
    height: 8px;
    border: 1.5px solid rgba(0, 210, 255, 0.25);
    border-top-color: var(--color-accent-primary);
    border-radius: 50%;
    animation: t9-spin 0.6s linear infinite;
    display: inline-block;
  }

  .t9-candidates-scroll {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    flex: 1;
    min-width: 0;
  }

  .t9-candidates-scroll::-webkit-scrollbar {
    display: none;
  }

  .t9-candidate-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface-elevated);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: var(--text-xs);
    font-weight: 600;
    padding: 4px 8px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.12s ease;
    user-select: none;
    flex-shrink: 0;
  }

  .t9-candidate-chip:hover {
    border-color: var(--color-text-secondary);
  }

  .t9-candidate-chip.is-active {
    background: var(--color-accent-primary);
    color: var(--color-text-inverse);
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 10px rgba(0, 210, 255, 0.4);
    font-weight: 700;
  }

  .t9-fallback-chip {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-secondary);
    padding: 4px 6px;
    background: var(--color-surface-elevated);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
  }

  .t9-no-match-text {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    font-style: italic;
  }

  .t9-loading-state {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 4px;
    flex-shrink: 0;
  }

  .t9-spinner {
    width: 10px;
    height: 10px;
    border: 2px solid rgba(0, 210, 255, 0.2);
    border-top-color: var(--color-accent-primary);
    border-radius: 50%;
    animation: t9-spin 0.6s linear infinite;
  }

  .t9-loading-text {
    font-size: var(--text-xs);
    color: var(--color-accent-primary);
    font-weight: 600;
  }

  @keyframes t9-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes t9-pulse {
    from {
      opacity: 0.2;
    }
    to {
      opacity: 1;
    }
  }

  .t9-hint-text {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .visual-cross-container {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 2px 0;
    box-sizing: border-box;
  }

  .keypad-section {
    width: 100%;
  }



  /* Module menu options & warning banner */
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
    letter-spacing: 0.6px;
    color: var(--color-text-secondary);
  }

  .nonstandard-banner {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-md);
    background-color: var(--color-surface-2);
    border: 1px solid rgba(245, 158, 11, 0.4);
    border-radius: var(--radius-md);
    box-shadow: 0 0 16px rgba(245, 158, 11, 0.08);
    margin-bottom: var(--space-xs);
  }

  .banner-top {
    display: flex;
    align-items: flex-start;
    gap: var(--space-sm);
  }

  .banner-icon {
    color: var(--color-accent-warning);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .banner-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .banner-title {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-accent-warning);
    letter-spacing: 0.2px;
  }

  .banner-desc {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    line-height: 1.4;
    margin: 0;
  }

  .banner-desc strong {
    color: var(--color-text-primary);
  }

  .banner-reset-btn {
    min-height: var(--tap-min-size);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 var(--space-md);
    background-color: var(--color-accent-warning-subtle);
    border: 1px solid rgba(245, 158, 11, 0.4);
    border-radius: var(--radius-sm);
    color: var(--color-accent-warning);
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.12s ease, border-color 0.12s ease;
    user-select: none;
    -webkit-user-select: none;
  }

  .banner-reset-btn:active {
    background-color: rgba(245, 158, 11, 0.25);
  }


  .menu-action-pill-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 10px 12px;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: var(--text-sm);
    cursor: pointer;
    text-align: left;
  }

  .menu-action-pill-btn:active {
    background: var(--color-surface-3);
  }

  .menu-action-pill-btn .btn-subtext {
    font-family: var(--font-mono);
    font-weight: 700;
    color: var(--color-accent-primary);
    font-size: var(--text-xs);
  }
</style>
