<script lang="ts">
  import { tick } from 'svelte';
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import BrailleReference from './BrailleReference.svelte';
  import SlideToAction from '../../components/ui/SlideToAction.svelte';
  import {
    dotsToMask
  } from './brailleData';
  import {
    decodeSingleMask,
    normalizeBrailleInput
  } from './brailleSolver';
  import { settings } from '../../state/settings.svelte';
  import { copyToClipboard } from '../../utils/clipboard';
  import { toast } from '../../state/toast.svelte';
  import { STORAGE_KEYS } from '../../constants';
  import { Backspace, Copy } from 'phosphor-svelte';

  // Persistence keys
  const STORAGE_KEY_TEXT = `${STORAGE_KEYS.SETTINGS}_braille_text`;
  const STORAGE_KEY_CZECH = `${STORAGE_KEYS.SETTINGS}_braille_czech`;
  const STORAGE_KEY_DIRECT_NUMS = `${STORAGE_KEYS.SETTINGS}_braille_direct_nums`;

  let inputLetters = $state<string>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_TEXT) || '' : ''
  );
  let czechDiacritics = $state<boolean>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_CZECH) !== 'false' : true
  );
  let directNumbers = $state<boolean>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_DIRECT_NUMS) === 'true' : false
  );

  // Active cell being edited: array of dot numbers [1..6]
  let activeDots = $state<number[]>([]);

  // Derived decoding & metadata
  let currentMask = $derived(dotsToMask(activeDots));
  let currentCharInfo = $derived(
    decodeSingleMask(currentMask, { czechDiacritics, directNumbers })
  );

  let charCount = $derived(inputLetters.replace(/\s+/g, '').length);
  let wordCount = $derived(inputLetters.trim() ? inputLetters.trim().split(/\s+/).length : 0);

  let resultEl = $state<HTMLDivElement | null>(null);

  // Persistence
  $effect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_TEXT, inputLetters);
      localStorage.setItem(STORAGE_KEY_CZECH, String(czechDiacritics));
      localStorage.setItem(STORAGE_KEY_DIRECT_NUMS, String(directNumbers));
    }
  });

  async function autoScrollResult() {
    await tick();
    if (resultEl) {
      resultEl.scrollTop = resultEl.scrollHeight;
    }
  }

  // --- Pointer / Drag-to-Draw Handling on 2x3 Matrix ---
  let isPointerDown = false;
  let strokeActivatedDots = new Set<number>();
  let initialDotWasActive = false;
  let matrixContainerEl = $state<HTMLElement | null>(null);

  function getDotFromPoint(clientX: number, clientY: number): number | null {
    if (!matrixContainerEl) return null;
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    if (!el) return null;
    const dotBtn = el.closest<HTMLElement>('[data-dot]');
    if (dotBtn && dotBtn.dataset.dot) {
      const d = Number(dotBtn.dataset.dot);
      if (d >= 1 && d <= 6) return d;
    }
    return null;
  }

  function handlePointerDown(e: PointerEvent) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const dot = getDotFromPoint(e.clientX, e.clientY);
    if (!dot) return;

    isPointerDown = true;
    strokeActivatedDots = new Set([dot]);
    initialDotWasActive = activeDots.includes(dot);

    if (!initialDotWasActive) {
      settings.vibrate(20);
      activeDots = [...activeDots, dot].sort((a, b) => a - b);
    }

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isPointerDown) return;

    const dot = getDotFromPoint(e.clientX, e.clientY);
    if (!dot) return;

    if (!strokeActivatedDots.has(dot)) {
      strokeActivatedDots.add(dot);
      if (!activeDots.includes(dot)) {
        settings.vibrate(16);
        activeDots = [...activeDots, dot].sort((a, b) => a - b);
      }
    }
  }

  function handlePointerUp(e: PointerEvent) {
    if (!isPointerDown) return;
    isPointerDown = false;

    // Single tap on an already active dot -> toggles it OFF
    if (strokeActivatedDots.size === 1 && initialDotWasActive) {
      const dot = Array.from(strokeActivatedDots)[0];
      settings.vibrate(20);
      activeDots = activeDots.filter((d) => d !== dot);
    }

    strokeActivatedDots.clear();

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }

  function handlePointerCancel(e: PointerEvent) {
    isPointerDown = false;
    strokeActivatedDots.clear();
  }

  // --- Keypad Actions ---
  function commitChar() {
    if (activeDots.length === 0) return;

    settings.vibrate(30);
    const info = currentCharInfo;
    inputLetters += info.char;
    activeDots = [];
    autoScrollResult();
  }

  function handleSpace() {
    settings.vibrate(25);
    // If dots are selected, commit them first then add space
    if (activeDots.length > 0) {
      inputLetters += currentCharInfo.char;
      activeDots = [];
    }
    inputLetters += ' ';
    autoScrollResult();
  }

  function handleBackspace() {
    settings.vibrate(25);
    // 1. If dots are currently selected, backspace clears only the cell dots
    if (activeDots.length > 0) {
      activeDots = [];
      return;
    }

    // 2. If cell is empty, delete last character from text
    if (inputLetters.length > 0) {
      inputLetters = inputLetters.slice(0, -1);
      autoScrollResult();
    }
  }

  function handleClearAll() {
    settings.vibrate(35);
    inputLetters = '';
    activeDots = [];
  }

  async function handleCopy() {
    if (!inputLetters.trim()) return;
    await copyToClipboard(inputLetters);
  }

  function handleReset() {
    handleClearAll();
  }

  function handlePaste(text: string) {
    const normalized = normalizeBrailleInput(text, { czechDiacritics, directNumbers });
    if (normalized) {
      inputLetters += (inputLetters.length > 0 ? ' ' : '') + normalized;
      toast.show('Text vložen ze schránky', 'success');
      autoScrollResult();
    }
  }
</script>

<ModuleShell
  onReset={handleReset}
  onPaste={handlePaste}
>
  {#snippet output()}
    <div class="output-container">
      <!-- Decoded Text Card (1-tap copy, max 3 lines) -->
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
      <!-- 2x3 Interactive Matrix with Drag-to-Draw & Tap -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        bind:this={matrixContainerEl}
        class="braille-matrix-container"
        role="group"
        aria-label="Matice Braillových bodů"
        onpointerdown={handlePointerDown}
        onpointermove={handlePointerMove}
        onpointerup={handlePointerUp}
        onpointercancel={handlePointerCancel}
      >
        <div class="braille-matrix">
          <!-- Left Column: Dots 1, 2, 3 -->
          <div class="matrix-col">
            {#each [1, 2, 3] as dot}
              <button
                type="button"
                data-dot={dot}
                class="matrix-dot-btn"
                class:is-active={activeDots.includes(dot)}
                aria-label="Bod {dot}"
              >
                <span class="dot-num">{dot}</span>
              </button>
            {/each}
          </div>

          <!-- Right Column: Dots 4, 5, 6 -->
          <div class="matrix-col">
            {#each [4, 5, 6] as dot}
              <button
                type="button"
                data-dot={dot}
                class="matrix-dot-btn"
                class:is-active={activeDots.includes(dot)}
                aria-label="Bod {dot}"
              >
                <span class="dot-num">{dot}</span>
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- Utility Row: Slide to Clear and Smart Backspace -->
      <div class="keypad-utility-row">
        <SlideToAction
          disabled={!inputLetters && activeDots.length === 0}
          onAction={handleClearAll}
          label="Vymazat"
          ariaLabel="Vymazat celý text tažením"
        />

        <button
          class="utility-btn backspace-btn"
          class:has-dots={activeDots.length > 0}
          disabled={!inputLetters && activeDots.length === 0}
          onclick={handleBackspace}
          title={activeDots.length > 0 ? 'Zrušit výběr bodů' : 'Smazat poslední znak'}
        >
          <span class="btn-icon"><Backspace size={18} weight="duotone" /></span>
          <span class="btn-label">{activeDots.length > 0 ? 'Zrušit body' : 'Backspace'}</span>
        </button>
      </div>

      <!-- Dominant Row: Mezera & Vložit znak (Morse-sized: clamp(62px, 10vh, 84px)) -->
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
          class:ready={activeDots.length > 0}
          disabled={activeDots.length === 0}
          onclick={commitChar}
          title="Vložit znak do textu"
        >
          <span class="btn-symbol">
            {#if activeDots.length > 0}
              {currentCharInfo.char}
            {:else}
              ↵
            {/if}
          </span>
          <span class="btn-name">
            {activeDots.length > 0 ? `Vložit „${currentCharInfo.char}“` : 'Vložit znak'}
          </span>
        </button>
      </div>
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <div class="menu-option">
      <label class="checkbox-label">
        <input type="checkbox" bind:checked={czechDiacritics} />
        <span class="label-text">Česká diakritika (body 2,4,5,6 = Ř, W = 1,2,3,5,6)</span>
      </label>
    </div>
    <div class="menu-option">
      <label class="checkbox-label">
        <input type="checkbox" bind:checked={directNumbers} />
        <span class="label-text">Přímý režim čísel (A–J jako 1–0 bez prefixu)</span>
      </label>
    </div>
  {/snippet}

  {#snippet reference()}
    <BrailleReference />
  {/snippet}
</ModuleShell>

<style>
  .output-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    flex: 1;
    min-height: 0;
    position: relative;
  }

  /* Result Card - expands to fill all available vertical space */
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

  /* Keypad Zone - takes natural height of matrix and action rows */
  .keypad-zone {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px 12px 8px 12px;
    flex-shrink: 0;
  }

  /* 2x3 Matrix - expands to 100% width for perfect alignment with other rows */
  .braille-matrix-container {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .braille-matrix {
    width: 100%;
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: clamp(20px, 3.6vh, 36px) clamp(24px, 8vw, 48px);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5);
    box-sizing: border-box;
  }

  .matrix-col {
    display: flex;
    flex-direction: column;
    gap: clamp(24px, 3.8vh, 38px);
    align-items: center;
  }

  .matrix-dot-btn {
    width: clamp(68px, 10.8vh, 88px);
    height: clamp(68px, 10.8vh, 88px);
    border-radius: 50%;
    background-color: var(--color-surface-1);
    border: 2.5px solid var(--color-border-subtle);
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    cursor: pointer;
    transition: background-color 0.1s, border-color 0.1s, transform 0.08s, box-shadow 0.1s;
    box-sizing: border-box;
  }

  .matrix-dot-btn:active {
    transform: scale(0.92);
  }

  .matrix-dot-btn.is-active {
    background-color: var(--color-accent-primary);
    border-color: #ffffff;
    box-shadow: 0 0 20px rgba(0, 210, 255, 0.8);
  }

  .dot-num {
    font-family: var(--font-mono);
    font-size: clamp(24px, 3.8vh, 32px);
    font-weight: 900;
    color: var(--color-text-secondary);
    pointer-events: none;
    line-height: 1;
  }

  .matrix-dot-btn.is-active .dot-num {
    color: #000000;
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
    padding: 0 12px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 600;
    line-height: 1;
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background-color 0.12s, border-color 0.12s, transform 0.08s;
  }

  .utility-btn:active:not(:disabled) {
    background-color: var(--color-surface-active);
    transform: scale(0.98);
  }

  .utility-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .utility-btn.backspace-btn.has-dots {
    color: var(--color-accent-warning);
    border-color: rgba(245, 158, 11, 0.4);
  }

  .btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .btn-label {
    display: inline-flex;
    align-items: center;
    letter-spacing: 0.2px;
  }

  /* Keypad Dominant Row: Mezera & Vložit - sized identically to Morse (clamp 62px - 84px) */
  .keypad-dominant {
    display: grid;
    grid-template-columns: 0.85fr 1.35fr;
    gap: 8px;
    width: 100%;
    flex-shrink: 0;
  }

  .dominant-btn {
    height: clamp(62px, 10vh, 84px);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    transition: background-color 0.1s, border-color 0.1s, transform 0.06s;
    user-select: none;
    -webkit-user-select: none;
  }

  .dominant-btn:active:not(:disabled) {
    background-color: var(--color-surface-active);
    border-color: var(--color-border-focus);
    transform: scale(0.97);
  }

  .dominant-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .dominant-btn.insert-btn.ready {
    background-color: rgba(0, 210, 255, 0.16);
    border-color: var(--color-accent-primary);
  }

  .dominant-btn.insert-btn.ready .btn-symbol {
    color: var(--color-accent-primary);
  }

  .dominant-btn.space-btn .btn-symbol {
    color: var(--color-text-secondary);
  }

  .btn-symbol {
    font-family: var(--font-mono);
    font-size: clamp(24px, 4.2vh, 36px);
    font-weight: 900;
    line-height: 1;
    color: #ffffff;
  }

  .btn-name {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-text-secondary);
    letter-spacing: 0.4px;
    white-space: nowrap;
    text-transform: uppercase;
  }

  .insert-btn.ready .btn-name {
    color: var(--color-text-primary);
  }

  /* Menu options */
  .menu-option {
    padding: 6px 0;
  }

  .checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
  }

  .checkbox-label input[type='checkbox'] {
    width: 18px;
    height: 18px;
    margin-top: 2px;
    accent-color: var(--color-accent-primary);
  }

  .label-text {
    font-size: 14px;
    color: var(--color-text-primary);
    line-height: 1.4;
  }
</style>
