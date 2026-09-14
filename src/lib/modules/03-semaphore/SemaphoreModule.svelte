<script lang="ts">
  import { tick } from 'svelte';
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import SemaphoreReference from './SemaphoreReference.svelte';
  import SlideToAction from '../../components/ui/SlideToAction.svelte';
  import {
    SEMAPHORE_DIRECTIONS,
    type SemaphoreEntry
  } from './semaphoreData';
  import {
    decodePair,
    getCharForEntry,
    normalizeSemaphoreInput,
    type SemaphoreDecodeOptions
  } from './semaphoreSolver';
  import { copyToClipboard } from '../../utils/clipboard';
  import { toast } from '../../state/toast.svelte';
  import { STORAGE_KEYS } from '../../constants';
  import { Backspace, Copy } from 'phosphor-svelte';

  // Persistence keys
  const STORAGE_KEY_INPUT = `${STORAGE_KEYS.SETTINGS}_semaphore_input`;
  const STORAGE_KEY_MIRROR = `${STORAGE_KEYS.SETTINGS}_semaphore_mirror`;
  const STORAGE_KEY_NUMS = `${STORAGE_KEYS.SETTINGS}_semaphore_direct_nums`;
  const STORAGE_KEY_AUTO = `${STORAGE_KEYS.SETTINGS}_semaphore_auto_insert`;

  let inputLetters = $state<string>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_INPUT) || '' : ''
  );

  // Settings
  let mirrorX = $state<boolean>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_MIRROR) === 'true' : false
  );
  let directNumbers = $state<boolean>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_NUMS) === 'true' : false
  );
  let autoInsert = $state<boolean>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_AUTO) !== 'false' : true
  );

  // State: 0, 1, or 2 active direction indices (0..7)
  let activeDirs = $state<number[]>([]);
  let committedFade = $state<boolean>(false);
  let fadeTimeout: ReturnType<typeof setTimeout> | null = null;

  // DOM elements
  let resultEl = $state<HTMLDivElement | null>(null);
  let wheelContainerEl = $state<HTMLDivElement | null>(null);

  // Drag interaction state
  let isPointerDown = false;
  let lastInteractedDir: number | null = null;
  let backspaceTimer: ReturnType<typeof setInterval> | null = null;
  let backspaceStartTimer: ReturnType<typeof setTimeout> | null = null;

  // Persistence effects
  $effect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_INPUT, inputLetters);
    }
  });
  $effect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_MIRROR, String(mirrorX));
    }
  });
  $effect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_NUMS, String(directNumbers));
    }
  });
  $effect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_AUTO, String(autoInsert));
    }
  });

  // Current options
  let decodeOptions = $derived<SemaphoreDecodeOptions>({
    mirrorX,
    directNumbers
  });

  // Decoded character for currently selected pair of directions
  let currentEntry = $derived<SemaphoreEntry | null>(
    activeDirs.length === 2 ? decodePair(activeDirs[0], activeDirs[1], decodeOptions) : null
  );

  let currentChar = $derived<string>(
    currentEntry ? getCharForEntry(currentEntry, decodeOptions) : ''
  );

  // Counters
  let charCount = $derived(inputLetters.replace(/\s/g, '').length);
  let wordCount = $derived(
    inputLetters.trim() ? inputLetters.trim().split(/\s+/).length : 0
  );

  function triggerHaptic(type: 'tap' | 'commit' | 'clear' = 'tap') {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (type === 'tap') navigator.vibrate(10);
      else if (type === 'commit') navigator.vibrate([15, 30, 15]);
      else if (type === 'clear') navigator.vibrate(25);
    }
  }

  function autoScrollResult() {
    tick().then(() => {
      if (resultEl) {
        resultEl.scrollTop = resultEl.scrollHeight;
      }
    });
  }

  function clearFadeTimer() {
    if (fadeTimeout) {
      clearTimeout(fadeTimeout);
      fadeTimeout = null;
    }
    committedFade = false;
  }

  // Direction toggle / drag logic with auto-insert and fade-out animation
  function handleDirTouch(dirIdx: number, fromDrag: boolean = false) {
    if (fromDrag && dirIdx === lastInteractedDir) return;
    lastInteractedDir = dirIdx;

    // If user was viewing fade-out of previous committed letter, immediately clear it for new touch
    if (committedFade) {
      clearFadeTimer();
      activeDirs = [];
    }

    if (activeDirs.includes(dirIdx)) {
      // Toggle off if tapping same direction
      if (!fromDrag) {
        activeDirs = activeDirs.filter((d) => d !== dirIdx);
        triggerHaptic('tap');
      }
    } else {
      if (activeDirs.length === 0) {
        activeDirs = [dirIdx];
        triggerHaptic('tap');
      } else if (activeDirs.length === 1) {
        const firstDir = activeDirs[0];
        if (autoInsert) {
          // Instant decode and commit on 2nd arm, with visual fade-out of the complete sign
          const entry = decodePair(firstDir, dirIdx, decodeOptions);
          if (entry) {
            const charToInsert = getCharForEntry(entry, decodeOptions);
            inputLetters += charToInsert;
            triggerHaptic('commit');
            activeDirs = [firstDir, dirIdx];
            committedFade = true;
            if (fadeTimeout) clearTimeout(fadeTimeout);
            fadeTimeout = setTimeout(() => {
              activeDirs = [];
              committedFade = false;
            }, 380);
            autoScrollResult();
          } else {
            // Unrecognized pair - keep both selected
            activeDirs = [firstDir, dirIdx];
            triggerHaptic('tap');
          }
        } else {
          activeDirs = [firstDir, dirIdx];
          triggerHaptic('tap');
        }
      } else {
        // Already had 2 directions, start fresh with new direction
        activeDirs = [dirIdx];
        triggerHaptic('tap');
      }
    }
  }

  function getDirFromPoint(clientX: number, clientY: number): number | null {
    if (typeof document === 'undefined') return null;
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    const btn = el.closest('[data-dir]');
    if (!btn) return null;
    const dirStr = btn.getAttribute('data-dir');
    if (dirStr === null) return null;
    const dir = parseInt(dirStr, 10);
    return isNaN(dir) ? null : dir;
  }

  function handlePointerDown(e: PointerEvent) {
    isPointerDown = true;
    lastInteractedDir = null;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const dir = getDirFromPoint(e.clientX, e.clientY);
    if (dir !== null) {
      handleDirTouch(dir, false);
    }
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isPointerDown) return;
    const dir = getDirFromPoint(e.clientX, e.clientY);
    if (dir !== null && dir !== lastInteractedDir) {
      handleDirTouch(dir, true);
    }
  }

  function handlePointerUp(e: PointerEvent) {
    isPointerDown = false;
    lastInteractedDir = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }

  function handlePointerCancel(e: PointerEvent) {
    isPointerDown = false;
    lastInteractedDir = null;
  }

  function commitChar() {
    if (!currentChar) return;
    inputLetters += currentChar;
    triggerHaptic('commit');
    autoScrollResult();
    committedFade = true;
    if (fadeTimeout) clearTimeout(fadeTimeout);
    fadeTimeout = setTimeout(() => {
      activeDirs = [];
      committedFade = false;
    }, 380);
  }

  function handleSpace() {
    clearFadeTimer();
    if (currentChar) {
      inputLetters += currentChar + ' ';
    } else {
      inputLetters += ' ';
    }
    activeDirs = [];
    triggerHaptic('tap');
    autoScrollResult();
  }

  function handleBackspace() {
    clearFadeTimer();
    if (activeDirs.length > 0) {
      // Cancel active arm selection without touching text
      activeDirs = [];
      triggerHaptic('tap');
    } else if (inputLetters.length > 0) {
      inputLetters = inputLetters.slice(0, -1);
      triggerHaptic('tap');
      autoScrollResult();
    }
  }

  function startBackspaceRepeat() {
    handleBackspace();
    backspaceStartTimer = setTimeout(() => {
      backspaceTimer = setInterval(() => {
        if (inputLetters.length > 0 || activeDirs.length > 0) {
          handleBackspace();
        } else {
          stopBackspaceRepeat();
        }
      }, 75);
    }, 400);
  }

  function stopBackspaceRepeat() {
    if (backspaceStartTimer) {
      clearTimeout(backspaceStartTimer);
      backspaceStartTimer = null;
    }
    if (backspaceTimer) {
      clearInterval(backspaceTimer);
      backspaceTimer = null;
    }
  }

  function handleClearAll() {
    clearFadeTimer();
    inputLetters = '';
    activeDirs = [];
    triggerHaptic('clear');
  }

  async function handleCopy() {
    if (!inputLetters.trim()) return;
    await copyToClipboard(inputLetters);
  }

  function handleReset() {
    handleClearAll();
  }

  function handlePaste(text: string) {
    clearFadeTimer();
    const normalized = normalizeSemaphoreInput(text, decodeOptions);
    if (normalized) {
      inputLetters += (inputLetters.length > 0 ? ' ' : '') + normalized;
      toast.show('Text vložen ze schránky', 'success');
      autoScrollResult();
    }
  }

  // Geometric circle calculation (center = 50%, radius = 38.5%)
  // In a strictly 1:1 aspect-ratio container, this forms a true circle.
  const RADIUS_PERCENT = 38.5;
  const WHEEL_DIRS = SEMAPHORE_DIRECTIONS.map((dir) => {
    const left = +(50 + RADIUS_PERCENT * dir.dx).toFixed(2);
    const top = +(50 + RADIUS_PERCENT * dir.dy).toFixed(2);
    return {
      ...dir,
      left,
      top
    };
  });

  function getPotentialChar(firstDir: number, secondDir: number): string {
    const entry = decodePair(firstDir, secondDir, decodeOptions);
    if (!entry || entry.char === 'CANCEL') return '';
    return getCharForEntry(entry, decodeOptions);
  }
</script>

<ModuleShell
  onReset={handleReset}
  onPaste={handlePaste}
>
  {#snippet output()}
    <div class="output-container">
      <!-- Decoded Text Card (1-tap copy, flex: 1 taking all remaining space) -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="result-card"
        class:is-clickable={inputLetters.trim().length > 0}
        onclick={handleCopy}
        title="Klepnutím zkopírujete do schránky"
      >
        <div class="result-header">
          <span class="result-label">PŘEKLAD</span>
          <div class="result-badges">
            {#if charCount > 0}
              <span class="badge">{charCount} {charCount === 1 ? 'znak' : charCount < 5 ? 'znaky' : 'znaků'}</span>
              <span class="badge">{wordCount} {wordCount === 1 ? 'slovo' : wordCount < 5 ? 'slova' : 'slov'}</span>
            {/if}
            {#if inputLetters.trim().length > 0}
              <span class="copy-hint"><Copy size={13} weight="bold" /> Kopírovat</span>
            {/if}
          </div>
        </div>

        <div
          bind:this={resultEl}
          class="result-text"
          class:empty={!inputLetters.trim()}
        >
          {inputLetters || 'Zde se zobrazí přeložený text...'}
        </div>
      </div>
    </div>
  {/snippet}

  {#snippet input()}
    <div class="keypad-zone">
      <!-- 8-directional Circular Dial (100% width aligned with action rows) -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        bind:this={wheelContainerEl}
        class="semaphore-wheel-container"
        role="group"
        aria-label="Kruhový volič semaforu"
        onpointerdown={handlePointerDown}
        onpointermove={handlePointerMove}
        onpointerup={handlePointerUp}
        onpointercancel={handlePointerCancel}
      >
        <div class="semaphore-wheel-card">
          <!-- Strict 1:1 square dial to ensure 100% geometric circle (generously sized) -->
          <div class="dial-square">
            <!-- Dial SVG active beams -->
            <svg class="wheel-svg" viewBox="0 0 100 100" aria-hidden="true">
              <!-- Center pivot dot -->
              <circle cx="50" cy="50" r="3.5" class="svg-center-dot" />

              <!-- Active beams from center to selected arms -->
              {#each activeDirs as dirIdx}
                {@const dir = WHEEL_DIRS[dirIdx]}
                <line
                  x1="50"
                  y1="50"
                  x2={dir.left}
                  y2={dir.top}
                  class="svg-beam-active"
                  class:is-fading={committedFade}
                />
              {/each}
            </svg>

            <!-- 8 Circular Targets (shows subtle gray potential letter when 1st arm is selected) -->
            {#each WHEEL_DIRS as dir}
              {@const hintChar = activeDirs.length === 1 && !committedFade && dir.index !== activeDirs[0]
                ? getPotentialChar(activeDirs[0], dir.index)
                : ''}
              <button
                type="button"
                data-dir={dir.index}
                class="wheel-dir-btn"
                class:is-active={activeDirs.includes(dir.index)}
                class:is-fading={committedFade && activeDirs.includes(dir.index)}
                class:has-hint={!!hintChar}
                style="left: {dir.left}%; top: {dir.top}%;"
                aria-label="{dir.label} ({dir.shortLabel})"
              >
                {#if hintChar}
                  <span class="dir-hint">{hintChar}</span>
                {/if}
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- Utility Row: Slide to Clear and Smart Backspace (height: 42px) -->
      <div class="keypad-utility-row">
        <SlideToAction
          disabled={!inputLetters && activeDirs.length === 0}
          onAction={handleClearAll}
          label="Vymazat"
          ariaLabel="Vymazat celý text tažením"
        />

        <button
          class="utility-btn backspace-btn"
          class:has-active={activeDirs.length > 0}
          disabled={!inputLetters && activeDirs.length === 0}
          onpointerdown={startBackspaceRepeat}
          onpointerup={stopBackspaceRepeat}
          onpointerleave={stopBackspaceRepeat}
          title={activeDirs.length > 0 ? 'Zrušit výběr ramen' : 'Smazat poslední znak'}
        >
          <span class="btn-icon"><Backspace size={18} weight="duotone" /></span>
          <span class="btn-label">{activeDirs.length > 0 ? 'Zrušit ramena' : 'Backspace'}</span>
        </button>
      </div>

      <!-- Dominant Row: Mezera & Vložit znak (Morse-height: clamp(62px, 10vh, 84px)) -->
      <div class="keypad-dominant">
        <button
          class="dominant-btn space-btn"
          onclick={handleSpace}
          title="Vložit mezeru"
        >
          <span class="btn-symbol">␣</span>
          <span class="btn-name">Mezera</span>
        </button>

        <button
          class="dominant-btn insert-btn"
          class:ready={!!currentChar}
          disabled={!currentChar}
          onclick={commitChar}
          title="Vložit znak do textu"
        >
          <span class="btn-symbol">
            {#if currentChar}
              {currentChar}
            {:else}
              ↵
            {/if}
          </span>
          <span class="btn-name">
            {#if currentChar}
              Vložit „{currentChar}“
            {:else if activeDirs.length === 1}
              Zvolte 2. rameno
            {:else}
              Vložit znak
            {/if}
          </span>
        </button>
      </div>
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <div class="menu-option">
      <label class="checkbox-label">
        <input type="checkbox" bind:checked={autoInsert} />
        <span>Okamžité zadávání (bez potvrzování)</span>
      </label>
      <span class="option-hint">Znak se automaticky vloží ihned po navolení 2 ramen (tahem i klepnutím).</span>
    </div>

    <div class="menu-option">
      <label class="checkbox-label">
        <input type="checkbox" bind:checked={directNumbers} />
        <span>Režim čísel (1–9, 0 místo písmen)</span>
      </label>
      <span class="option-hint">Dekóduje znaky A–I, K jako číslice 1–9, 0.</span>
    </div>

    <div class="menu-option">
      <label class="checkbox-label">
        <input type="checkbox" bind:checked={mirrorX} />
        <span>Zrcadlení (Pohled vysílajícího)</span>
      </label>
      <span class="option-hint">Zrcadlí horizontální směr ramen (vlevo ↔ vpravo).</span>
    </div>
  {/snippet}

  {#snippet reference()}
    <SemaphoreReference />
  {/snippet}
</ModuleShell>

<style>
  /* Container fills the output zone */
  .output-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    flex: 1;
    min-height: 0;
    position: relative;
  }

  /* Result Card - expands dynamically to fill remaining height */
  .result-card {
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    min-height: 84px;
    overflow: hidden;
    transition: border-color 0.15s, background-color 0.15s;
    user-select: text;
    box-sizing: border-box;
  }

  .result-card.is-clickable {
    cursor: pointer;
  }

  .result-card.is-clickable:active {
    background-color: var(--color-surface-active);
    border-color: var(--color-border-focus);
  }

  .result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .result-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-text-secondary);
    letter-spacing: 0.8px;
  }

  .result-badges {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .badge {
    font-size: 11px;
    color: var(--color-text-muted);
    background-color: var(--color-surface-2);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
  }

  .copy-hint {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-accent-primary);
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .result-text {
    font-family: var(--font-mono);
    font-size: clamp(18px, 2.7vh, 24px);
    font-weight: 700;
    color: #ffffff;
    line-height: 1.35;
    overflow-y: auto;
    word-break: break-word;
    flex: 1;
  }

  .result-text.empty {
    color: var(--color-text-muted);
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 400;
  }

  /* Keypad Zone - takes natural height of wheel and action rows */
  .keypad-zone {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px 12px 8px 12px;
    flex-shrink: 0;
  }

  /* Semaphore Circular Dial Container - 100% width aligned */
  .semaphore-wheel-container {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .semaphore-wheel-card {
    position: relative;
    width: 100%;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5);
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(10px, 1.8vh, 16px) 8px;
  }

  /* Strict 1:1 square dial ensures exact circle without elliptical distortion (generous size) */
  .dial-square {
    position: relative;
    width: clamp(260px, 40vh, 350px);
    height: clamp(260px, 40vh, 350px);
    max-width: calc(100vw - 32px);
    max-height: calc(100vw - 32px);
    aspect-ratio: 1 / 1;
    flex-shrink: 0;
  }

  /* SVG layer for beams */
  .wheel-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .svg-center-dot {
    fill: rgba(255, 255, 255, 0.45);
  }

  .svg-beam-active {
    stroke: var(--color-accent-primary);
    stroke-width: 4.5;
    stroke-linecap: round;
    filter: drop-shadow(0 0 8px rgba(0, 210, 255, 0.9));
  }

  .svg-beam-active.is-fading {
    animation: beamFadeOut 0.38s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }

  @keyframes beamFadeOut {
    0% {
      opacity: 1;
    }
    25% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  /* 8 Direction Clean Circular Buttons */
  .wheel-dir-btn {
    position: absolute;
    transform: translate(-50%, -50%);
    width: clamp(54px, 8vh, 65px);
    height: clamp(54px, 8vh, 65px);
    border-radius: 50%;
    background-color: var(--color-surface-1);
    border: 2.5px solid var(--color-border-subtle);
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.1s, border-color 0.1s, transform 0.08s, box-shadow 0.1s;
    box-sizing: border-box;
    z-index: 2;
    padding: 0;
  }

  .wheel-dir-btn:active {
    transform: translate(-50%, -50%) scale(0.92);
  }

  .dir-hint {
    font-family: var(--font-condensed);
    font-size: clamp(20px, 3.2vh, 27px);
    font-weight: 800;
    color: rgba(255, 255, 255, 0.42);
    line-height: 1;
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
    animation: hintPopIn 0.12s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes hintPopIn {
    from {
      opacity: 0;
      transform: scale(0.65);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .wheel-dir-btn.is-active {
    background-color: var(--color-accent-primary);
    border-color: #ffffff;
    box-shadow: 0 0 22px rgba(0, 210, 255, 0.95);
  }

  .wheel-dir-btn.is-active.is-fading {
    animation: buttonFadeOut 0.38s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }

  @keyframes buttonFadeOut {
    0% {
      background-color: var(--color-accent-primary);
      border-color: #ffffff;
      box-shadow: 0 0 24px rgba(0, 210, 255, 1);
    }
    25% {
      background-color: var(--color-accent-primary);
      border-color: #ffffff;
      box-shadow: 0 0 20px rgba(0, 210, 255, 0.9);
    }
    100% {
      background-color: var(--color-surface-1);
      border-color: var(--color-border-subtle);
      box-shadow: 0 0 0 rgba(0, 210, 255, 0);
    }
  }

  /* Keypad Utility Row */
  .keypad-utility-row {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 8px;
    width: 100%;
    align-items: center;
    flex-shrink: 0;
  }

  .utility-btn {
    height: 42px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    transition: background-color 0.12s, border-color 0.12s, transform 0.08s;
    box-sizing: border-box;
    padding: 0 12px;
  }

  .utility-btn:active:not(:disabled) {
    background-color: var(--color-surface-active);
    transform: scale(0.97);
  }

  .utility-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .backspace-btn {
    color: var(--color-text-secondary);
  }

  .backspace-btn.has-active {
    color: var(--color-accent-warning);
    border-color: rgba(245, 158, 11, 0.4);
    background-color: rgba(245, 158, 11, 0.08);
  }

  .btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .btn-label {
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
  }

  /* Dominant Action Row (Morse-sized: clamp(62px, 10vh, 84px)) */
  .keypad-dominant {
    display: grid;
    grid-template-columns: 0.85fr 1.15fr;
    gap: 8px;
    width: 100%;
    flex-shrink: 0;
  }

  .dominant-btn {
    height: clamp(62px, 10vh, 84px);
    border-radius: var(--radius-lg);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    user-select: none;
    -webkit-user-select: none;
    cursor: pointer;
    box-sizing: border-box;
    border: 1px solid var(--color-border-subtle);
    background-color: var(--color-surface-1);
    transition: background-color 0.12s, border-color 0.12s, transform 0.08s, box-shadow 0.12s;
  }

  .dominant-btn:active:not(:disabled) {
    transform: scale(0.96);
  }

  .dominant-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .space-btn {
    background-color: var(--color-surface-2);
    border-color: var(--color-border-subtle);
  }

  .space-btn:active {
    background-color: var(--color-surface-active);
  }

  .space-btn .btn-symbol {
    font-size: clamp(20px, 3vh, 26px);
    line-height: 1;
    color: var(--color-text-secondary);
  }

  .space-btn .btn-name {
    font-size: clamp(12px, 1.8vh, 14px);
    font-weight: 700;
    color: var(--color-text-secondary);
    letter-spacing: 0.5px;
  }

  .insert-btn {
    background-color: var(--color-surface-2);
    border-color: var(--color-border-subtle);
    color: var(--color-text-muted);
  }

  .insert-btn.ready {
    background: linear-gradient(135deg, rgba(0, 210, 255, 0.22), rgba(0, 160, 255, 0.15));
    border-color: var(--color-accent-primary);
    color: #ffffff;
    box-shadow: 0 0 16px rgba(0, 210, 255, 0.35);
  }

  .insert-btn.ready:active {
    background: linear-gradient(135deg, rgba(0, 210, 255, 0.35), rgba(0, 160, 255, 0.25));
    box-shadow: 0 0 24px rgba(0, 210, 255, 0.6);
  }

  .insert-btn .btn-symbol {
    font-family: var(--font-condensed);
    font-size: clamp(24px, 3.8vh, 32px);
    font-weight: 900;
    line-height: 1;
    color: inherit;
  }

  .insert-btn.ready .btn-symbol {
    color: var(--color-accent-primary);
  }

  .insert-btn .btn-name {
    font-size: clamp(12px, 1.8vh, 14px);
    font-weight: 700;
    letter-spacing: 0.5px;
    color: inherit;
  }

  /* Menu options */
  .menu-option {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 0;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    cursor: pointer;
  }

  .checkbox-label input[type='checkbox'] {
    width: 18px;
    height: 18px;
    accent-color: var(--color-accent-primary);
    cursor: pointer;
  }

  .option-hint {
    font-size: 12px;
    color: var(--color-text-muted);
    padding-left: 28px;
  }
</style>
