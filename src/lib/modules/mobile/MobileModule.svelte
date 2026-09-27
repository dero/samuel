<script lang="ts">
  import { onDestroy } from 'svelte';
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import SlideToAction from '../../components/ui/SlideToAction.svelte';
  import SpaceCommitButton from '../../components/ui/SpaceCommitButton.svelte';
  import BackspaceButton from '../../components/ui/BackspaceButton.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import MobileReference from './MobileReference.svelte';
  import { PHONE_GRID, getPhoneKeyLetters } from './mobileData';
  import { getFallbackT9Word } from './t9Data';
  import { t9Service } from './t9Service';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import { versionService } from '../../services/versionService.svelte';
  import { navigation } from '../../state/navigation.svelte';
  import { Warning } from 'phosphor-svelte';
  import { createModuleState } from '../../state/moduleState.svelte';

  const { state: modState, reset: resetModState } = createModuleState('mobile', {
    text: '',
    phoneMode: 'multitap' as 'multitap' | 't9'
  });

  const phoneModeOptions: SegmentOption<'multitap' | 't9'>[] = [
    { id: 'multitap', label: 'SMS' },
    { id: 't9', label: 'T9 Predikce' }
  ];

  // Multi-tap state
  let pendingKey = $state<string | null>(null);
  let pendingTapIndex = $state<number>(0);
  let pendingChar = $state<string>('');
  let commitTimer: ReturnType<typeof setTimeout> | null = null;

  // T9 state
  let t9Digits = $state<string>('');
  let t9Candidates = $state<string[]>([]);
  let t9CandidateIndex = $state<number>(0);
  let isT9Loading = $state<boolean>(false);
  let t9ReqCounter = 0;

  // Long press timer
  let activePhonePressKey: string | null = null;
  let isPhoneLongPressTriggered = false;
  let phonePressTimer: ReturnType<typeof setTimeout> | null = null;

  function clearCommitTimer() {
    if (commitTimer) {
      clearTimeout(commitTimer);
      commitTimer = null;
    }
  }

  function clearPhonePressTimer() {
    if (phonePressTimer) {
      clearTimeout(phonePressTimer);
      phonePressTimer = null;
    }
  }

  function commitPendingChar() {
    if (pendingChar) {
      modState.text += pendingChar;
      pendingKey = null;
      pendingTapIndex = 0;
      pendingChar = '';
    }
    clearCommitTimer();
  }

  function handleMultiTap(keyId: string) {
    const letters = getPhoneKeyLetters(keyId);
    if (!letters || letters.length === 0) return;

    if (pendingKey === keyId) {
      pendingTapIndex = (pendingTapIndex + 1) % letters.length;
      pendingChar = letters[pendingTapIndex];
    } else {
      commitPendingChar();
      pendingKey = keyId;
      pendingTapIndex = 0;
      pendingChar = letters[0];
    }

    clearCommitTimer();
    commitTimer = setTimeout(() => {
      commitPendingChar();
    }, 1100);
  }

  async function fetchT9Candidates(digits: string) {
    if (!digits) {
      t9Candidates = [];
      t9CandidateIndex = 0;
      return;
    }

    const currentReq = ++t9ReqCounter;
    isT9Loading = true;

    try {
      const result = await t9Service.query(digits, 6);
      if (currentReq === t9ReqCounter) {
        if (result.candidates.length > 0) {
          t9Candidates = result.candidates;
        } else {
          t9Candidates = [getFallbackT9Word(digits)];
        }
        t9CandidateIndex = 0;
      }
    } catch {
      if (currentReq === t9ReqCounter) {
        t9Candidates = [getFallbackT9Word(digits)];
        t9CandidateIndex = 0;
      }
    } finally {
      if (currentReq === t9ReqCounter) {
        isT9Loading = false;
      }
    }
  }

  function commitT9Word(word: string, addSpace: boolean = true) {
    if (word) {
      modState.text += (modState.text.length > 0 && !modState.text.endsWith(' ') ? ' ' : '') + word + (addSpace ? ' ' : '');
    }
    t9Digits = '';
    t9Candidates = [];
    t9CandidateIndex = 0;
  }

  function handleT9KeyTap(keyId: string) {
    if (keyId >= '2' && keyId <= '9') {
      t9Digits += keyId;
      fetchT9Candidates(t9Digits);
    } else if (keyId === '*') {
      if (t9Candidates.length > 1) {
        settings.vibrate(15);
        t9CandidateIndex = (t9CandidateIndex + 1) % t9Candidates.length;
      } else if (!t9Digits) {
        modState.text += '*';
      }
    } else if (keyId === '0') {
      if (t9Digits) {
        const word = t9Candidates[t9CandidateIndex] || getFallbackT9Word(t9Digits);
        commitT9Word(word, true);
      } else {
        modState.text += ' ';
      }
    } else if (keyId === '1') {
      if (t9Digits) {
        const word = t9Candidates[t9CandidateIndex] || getFallbackT9Word(t9Digits);
        commitT9Word(word, false);
      }
      modState.text += '.';
    } else if (keyId === '#') {
      if (t9Digits) {
        const word = t9Candidates[t9CandidateIndex] || getFallbackT9Word(t9Digits);
        commitT9Word(word, false);
      } else {
        modState.text += '#';
      }
    }
  }

  function handlePhonePointerDown(e: PointerEvent, keyId: string) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    clearPhonePressTimer();

    activePhonePressKey = keyId;
    isPhoneLongPressTriggered = false;

    phonePressTimer = setTimeout(() => {
      isPhoneLongPressTriggered = true;
      settings.vibrate([20, 35]);
      if (modState.phoneMode === 't9') {
        if (t9Digits) {
          const word = t9Candidates[t9CandidateIndex] || getFallbackT9Word(t9Digits);
          commitT9Word(word, false);
        }
        modState.text += keyId;
      } else {
        commitPendingChar();
        modState.text += keyId;
      }
    }, 420);
  }

  function handlePhonePointerUp(e: PointerEvent, keyId: string) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();

    const wasLongPress = isPhoneLongPressTriggered;
    clearPhonePressTimer();

    if (!wasLongPress && activePhonePressKey === keyId) {
      settings.vibrate(18);
      if (modState.phoneMode === 't9') {
        handleT9KeyTap(keyId);
      } else {
        handleMultiTap(keyId);
      }
    }

    activePhonePressKey = null;
    isPhoneLongPressTriggered = false;
  }

  function handlePhonePointerCancel() {
    clearPhonePressTimer();
    activePhonePressKey = null;
    isPhoneLongPressTriggered = false;
  }

  function handlePhoneModeChange(newMode: 'multitap' | 't9') {
    if (modState.phoneMode === newMode) return;
    settings.vibrate(25);
    if (modState.phoneMode === 'multitap' && pendingChar) {
      commitPendingChar();
    } else if (modState.phoneMode === 't9' && t9Digits) {
      const word = t9Candidates[t9CandidateIndex] || getFallbackT9Word(t9Digits);
      commitT9Word(word, false);
    }
    modState.phoneMode = newMode;
    if (newMode === 't9' && !versionService.state.isDbInstalled) {
      toast.show('T9 vyžaduje slovník – stáhněte ho v Nastavení', 'warning');
    }
  }

  function handleSpace() {
    if (modState.phoneMode === 't9' && t9Digits) {
      const word = t9Candidates[t9CandidateIndex] || getFallbackT9Word(t9Digits);
      commitT9Word(word, true);
    } else if (modState.phoneMode === 'multitap' && pendingChar) {
      commitPendingChar();
      modState.text += ' ';
    } else {
      modState.text += ' ';
    }
  }

  function handleBackspace() {
    if (modState.phoneMode === 't9') {
      if (t9Digits.length > 0) {
        t9Digits = t9Digits.slice(0, -1);
        fetchT9Candidates(t9Digits);
      } else if (modState.text.length > 0) {
        modState.text = modState.text.slice(0, -1);
      }
    } else {
      if (pendingChar) {
        clearCommitTimer();
        pendingKey = null;
        pendingTapIndex = 0;
        pendingChar = '';
      } else if (modState.text.length > 0) {
        modState.text = modState.text.slice(0, -1);
      }
    }
  }

  function handleClearAll() {
    clearCommitTimer();
    settings.vibrate(35);
    modState.text = '';
    pendingKey = null;
    pendingTapIndex = 0;
    pendingChar = '';
    t9Digits = '';
    t9Candidates = [];
    t9CandidateIndex = 0;
  }

  const activeT9Candidate = $derived<string>(
    modState.phoneMode === 't9' && t9Digits ? t9Candidates[t9CandidateIndex] || getFallbackT9Word(t9Digits) : ''
  );

  const pendingDisplay = $derived<string>(
    modState.phoneMode === 't9' ? (t9Digits ? activeT9Candidate : '') : pendingChar
  );

  onDestroy(() => {
    clearCommitTimer();
    clearPhonePressTimer();
    t9Service.terminate();
  });
</script>

<ModuleShell
  title="Mobil"
  onReset={() => {
    handleClearAll();
    resetModState();
  }}
  onPaste={(pasted) => (modState.text += pasted.toUpperCase())}
>
  {#snippet menuOptions()}
    <div class="menu-group">
      <div class="menu-group-title">Režim zadávání</div>
      <SegmentedControl
        options={phoneModeOptions}
        value={modState.phoneMode}
        ariaLabel="Režim klávesnice mobilu"
        onChange={handlePhoneModeChange}
      />
    </div>

    {#if modState.phoneMode === 't9' && !versionService.state.isDbInstalled}
      <div class="nonstandard-banner" role="alert">
        <div class="banner-top">
          <span class="banner-icon"><Warning size={20} weight="fill" /></span>
          <div class="banner-text">
            <span class="banner-title">Slovník pro T9 není stažen</span>
            <p class="banner-desc">
              Stáhněte ho v Nastavení (102 MB).
            </p>
          </div>
        </div>
        <button
          type="button"
          class="banner-reset-btn"
          onclick={() => {
            settings.vibrate(20);
            navigation.closeSubView();
            navigation.openModule('settings');
          }}
        >
          Přejít do Nastavení
        </button>
      </div>
    {/if}
  {/snippet}

  {#snippet reference()}
    <MobileReference />
  {/snippet}

  {#snippet output()}
    <TranslationCard
      text={modState.text}
      pendingText={pendingDisplay}
      emptyHint={modState.phoneMode === 't9'
        ? 'Jeden stisk na písmeno, slovo doplní slovník.'
        : 'Písmeno = počet stisků klávesy.'}
    />
  {/snippet}

  {#snippet input()}
    <div class="zone-input-flow">
      <!-- 1. Sub-Toolbar: Kontextoví kandidáti T9, nebo přepínač režimů -->
      <div class="subtoolbar-container">
        {#if modState.phoneMode === 't9' && t9Digits}
          <div class="t9-candidates-bar">
            {#each t9Candidates as cand, idx}
              <button
                type="button"
                class="t9-candidate-pill"
                class:is-active={idx === t9CandidateIndex}
                onclick={() => {
                  settings.vibrate(20);
                  commitT9Word(cand, true);
                }}
              >
                {cand}
              </button>
            {/each}
          </div>
        {:else}
          <SegmentedControl
            options={phoneModeOptions}
            value={modState.phoneMode}
            size="sm"
            ariaLabel="Režim zadávání"
            onChange={handlePhoneModeChange}
          />
        {/if}
      </div>

      <!-- 2. Vstupní šasi: Klávesnice 3×4 -->
      <div class="phone-keypad-grid-3x4">
        {#each PHONE_GRID as item}
          {@const keyLetters = getPhoneKeyLetters(item.keyId)}
          {@const isActiveKey = pendingKey === item.keyId}
          <button
            type="button"
            class="phone-key-btn"
            class:is-active-key={isActiveKey}
            onpointerdown={(e) => handlePhonePointerDown(e, item.keyId)}
            onpointerup={(e) => handlePhonePointerUp(e, item.keyId)}
            onpointercancel={handlePhonePointerCancel}
            onpointerleave={handlePhonePointerCancel}
            oncontextmenu={(e) => e.preventDefault()}
          >
            <span class="phone-key-num">{item.digit}</span>
            <div class="phone-key-sub">
              {#if item.keyId === '0'}
                <span class="phone-sub-char" class:is-active-char={isActiveKey && pendingTapIndex === 0}>␣</span>
                <span class="phone-sub-char" class:is-active-char={isActiveKey && pendingTapIndex === 1}>0</span>
              {:else if keyLetters.length > 0}
                {#each keyLetters as ch, idx}
                  <span class="phone-sub-char" class:is-active-char={isActiveKey && pendingTapIndex === idx}>
                    {ch}
                  </span>
                {/each}
              {/if}
            </div>
          </button>
        {/each}
      </div>

      <!-- 3. Utilitní trojblok: Clear | Space/Commit | Backspace -->
      <div class="keypad-utility-row-3col">
        <SlideToAction
          disabled={!modState.text && !pendingDisplay}
          onAction={handleClearAll}
          ariaLabel="Vymazat text podržením"
        />

        <SpaceCommitButton
          pendingChar={modState.phoneMode === 't9' && t9Digits ? activeT9Candidate : pendingChar}
          disabled={false}
          onSpace={handleSpace}
          onCommit={() => {
            if (modState.phoneMode === 't9' && t9Digits) {
              commitT9Word(activeT9Candidate, true);
            } else if (pendingChar) {
              commitPendingChar();
            }
          }}
        />

        <BackspaceButton
          disabled={!modState.text && !pendingDisplay}
          hasActiveSelection={!!pendingDisplay}
          onAction={handleBackspace}
        />
      </div>
    </div>
  {/snippet}
</ModuleShell>

<style>
  .t9-candidates-bar {
    display: flex;
    gap: var(--space-xs);
    overflow-x: auto;
    width: 100%;
    height: 100%;
    align-items: center;
    padding: 0 2px;
    box-sizing: border-box;
  }

  .t9-candidate-pill {
    flex-shrink: 0;
    height: 30px;
    padding: 0 var(--space-sm);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    font-weight: 600;
    font-family: var(--font-mono);
    cursor: pointer;
    box-sizing: border-box;
  }

  .t9-candidate-pill.is-active {
    background-color: var(--color-accent-primary);
    color: #000000;
    border-color: var(--color-accent-primary);
    font-weight: 800;
  }

  .phone-keypad-grid-3x4 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(4, 52px);
    gap: 2px;
    padding: 2px;
    width: 100%;
    box-sizing: border-box;
    touch-action: none;
    border-radius: var(--radius-sm);
    overflow: hidden;
    background-color: var(--color-bg-canvas);
    border: 1px solid var(--color-border-subtle);
  }

  .phone-key-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-2);
    border: none;
    border-radius: 2px;
    gap: 1px;
    padding: 3px 4px;
    box-sizing: border-box;
    cursor: pointer;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.10),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    transition: background-color 0.1s ease, color 0.1s ease, box-shadow 0.08s ease;
  }

  .phone-key-btn:active {
    transform: none;
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
  }

  .phone-key-btn.is-active-key {
    background-color: var(--color-surface-active);
    color: var(--color-accent-primary);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
  }

  .phone-key-num {
    font-size: 22px;
    font-weight: 800;
    font-family: var(--font-mono);
    color: var(--color-text-primary);
    line-height: 1;
    pointer-events: none;
  }

  .phone-key-btn.is-active-key .phone-key-num {
    color: var(--color-accent-primary);
  }

  .phone-key-sub {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    line-height: 1;
    pointer-events: none;
  }

  .phone-sub-char {
    font-size: 11px;
    font-weight: 600;
    font-family: var(--font-mono);
    color: var(--color-text-secondary);
    transition: all 0.08s ease;
  }

  .phone-sub-char.is-active-char {
    color: #000000;
    background-color: var(--color-accent-primary);
    font-weight: 800;
    padding: 1px 3px;
    border-radius: var(--radius-xs);
    transform: scale(1.15);
    box-shadow: 0 0 6px rgba(0, 210, 255, 0.8);
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

  .nonstandard-banner {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    background-color: rgba(245, 158, 11, 0.12);
    border: 1px solid var(--color-accent-warning);
    border-radius: var(--radius-sm);
    padding: var(--space-sm) var(--space-md);
    margin-bottom: var(--space-sm);
  }

  .banner-top {
    display: flex;
    align-items: flex-start;
    gap: var(--space-sm);
  }

  .banner-icon {
    color: var(--color-accent-warning);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    margin-top: 1px;
  }

  .banner-text {
    flex: 1;
    min-width: 0;
  }

  .banner-title {
    display: block;
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: 2px;
  }

  .banner-desc {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    margin: 0;
    line-height: 1.4;
  }

  .banner-reset-btn {
    align-self: flex-start;
    padding: var(--space-xs) var(--space-sm);
    background-color: var(--color-accent-warning);
    color: #000000;
    border: none;
    border-radius: var(--radius-xs);
    font-size: var(--text-xs);
    font-weight: 700;
    cursor: pointer;
  }
</style>
