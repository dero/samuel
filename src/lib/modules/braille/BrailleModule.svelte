<script lang="ts">
  import { onDestroy } from 'svelte';
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import BrailleReference from './BrailleReference.svelte';
  import HoldToAction from '../../components/ui/HoldToAction.svelte';
  import SpaceCommitButton from '../../components/ui/SpaceCommitButton.svelte';
  import BackspaceButton from '../../components/ui/BackspaceButton.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import { dotsToMask } from './brailleData';
  import { decodeSingleMask, normalizeBrailleInput } from './brailleSolver';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import { createModuleState } from '../../state/moduleState.svelte';

  const { state: modState, reset: resetState } = createModuleState('braille', {
    text: '',
    czech: true,
    direct_nums: false,
    auto_insert: false
  });

  // Active cell being edited: array of dot numbers [1..6]
  let activeDots = $state<number[]>([]);
  let committedFade = $state<boolean>(false);
  let fadeTimeout: ReturnType<typeof setTimeout> | null = null;

  // Derived decoding & metadata
  let currentMask = $derived(dotsToMask(activeDots));
  let currentCharInfo = $derived(
    decodeSingleMask(currentMask, { czechDiacritics: modState.czech, directNumbers: modState.direct_nums })
  );

  function clearFadeTimer() {
    if (fadeTimeout) {
      clearTimeout(fadeTimeout);
      fadeTimeout = null;
    }
    committedFade = false;
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

    if (committedFade) {
      clearFadeTimer();
      activeDots = [];
    }

    isPointerDown = true;
    strokeActivatedDots = new Set();
    initialDotWasActive = false;

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const dot = getDotFromPoint(e.clientX, e.clientY);
    if (dot) {
      strokeActivatedDots.add(dot);
      initialDotWasActive = activeDots.includes(dot);

      if (!initialDotWasActive) {
        settings.vibrate(20);
        activeDots = [...activeDots, dot].sort((a, b) => a - b);
      }
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

    // Single tap on an already active dot -> toggles it OFF (when manual)
    if (!modState.auto_insert && strokeActivatedDots.size === 1 && initialDotWasActive) {
      const dot = Array.from(strokeActivatedDots)[0];
      settings.vibrate(20);
      activeDots = activeDots.filter((d) => d !== dot);
    }

    const hadInteractedDots = strokeActivatedDots.size > 0;
    strokeActivatedDots.clear();

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (modState.auto_insert && hadInteractedDots && activeDots.length > 0) {
      const info = currentCharInfo;
      if (info.isValid) {
        modState.text += info.char;
        settings.vibrate([15, 30, 15]);
        committedFade = true;
        if (fadeTimeout) clearTimeout(fadeTimeout);
        fadeTimeout = setTimeout(() => {
          activeDots = [];
          committedFade = false;
        }, 380);
      } else {
        // Unrecognized mask - keep selected
        settings.vibrate(20);
      }
    }
  }

  function handlePointerCancel(e: PointerEvent) {
    isPointerDown = false;
    strokeActivatedDots.clear();
  }

  // --- Keypad Actions ---
  function commitChar() {
    if (committedFade || activeDots.length === 0) return;

    const info = currentCharInfo;
    modState.text += info.char;
    committedFade = true;
    if (fadeTimeout) clearTimeout(fadeTimeout);
    fadeTimeout = setTimeout(() => {
      activeDots = [];
      committedFade = false;
    }, 380);
  }

  function handleSpace() {
    const wasFading = committedFade;
    clearFadeTimer();
    // If dots are selected and not fading, commit them first then add space
    if (!wasFading && activeDots.length > 0) {
      modState.text += currentCharInfo.char;
    }
    activeDots = [];
    modState.text += ' ';
  }

  function handleBackspace() {
    const wasFading = committedFade;
    clearFadeTimer();
    // 1. If dots are currently selected and not fading, backspace clears only the cell dots
    if (!wasFading && activeDots.length > 0) {
      activeDots = [];
      return;
    }

    // 2. Otherwise (or if fading), delete last character from text
    activeDots = [];
    if (modState.text.length > 0) {
      modState.text = modState.text.slice(0, -1);
    }
  }

  function handleClearAll() {
    clearFadeTimer();
    modState.text = '';
    activeDots = [];
  }

  function handleReset() {
    handleClearAll();
  }

  const brailleEmptyHint = 'Body zadávejte klepnutím nebo tahem.';

  onDestroy(() => {
    clearFadeTimer();
  });
</script>

<ModuleShell onReset={handleReset}>
  {#snippet output()}
    <TranslationCard
      text={modState.text}
      emptyHint={brailleEmptyHint}
    />
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
                class:is-fading={committedFade && activeDots.includes(dot)}
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
                class:is-fading={committedFade && activeDots.includes(dot)}
                aria-label="Bod {dot}"
              >
                <span class="dot-num">{dot}</span>
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- Utility Row: Slide to Clear, Space/Commit and Smart Backspace (1fr 1.3fr 1fr) -->
      <div class="keypad-utility-row-3col">
        <HoldToAction
          disabled={!modState.text && activeDots.length === 0}
          onAction={handleClearAll}
          ariaLabel="Vymazat celý text podržením"
        />

        <SpaceCommitButton
          pendingChar={activeDots.length > 0 && !committedFade ? (currentCharInfo.char || '↵') : ''}
          onSpace={handleSpace}
          onCommit={commitChar}
        />

        <BackspaceButton
          disabled={!modState.text && activeDots.length === 0}
          hasActiveSelection={activeDots.length > 0 && !committedFade}
          cancelLabel="Zrušit body"
          cancelTitle="Zrušit výběr bodů"
          onAction={handleBackspace}
        />
      </div>
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <OptionRow
      label="Okamžité vkládání"
      hint="Znak se vloží hned po dokončení tahu, bez potvrzení."
      checked={modState.auto_insert}
      onChange={(v) => (modState.auto_insert = v)}
    />
    <OptionRow
      label="Česká diakritika"
      hint="Body 2456 = Ř, W = 12356."
      checked={modState.czech}
      onChange={(v) => (modState.czech = v)}
    />
    <OptionRow
      label="Čísla bez prefixu"
      hint="A–J čte jako 1–0."
      checked={modState.direct_nums}
      onChange={(v) => (modState.direct_nums = v)}
    />
  {/snippet}

  {#snippet reference()}
    <BrailleReference />
  {/snippet}
</ModuleShell>

<style>
  /* Keypad Zone */
  .keypad-zone {
    display: flex;
    flex-direction: column;
    gap: var(--zone-input-gap);
    width: 100%;
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
    padding: 10px clamp(20px, 7vw, 44px);
    background: transparent;
    border: none;
    box-shadow: none;
    box-sizing: border-box;
  }

  .matrix-col {
    display: flex;
    flex-direction: column;
    gap: 18px;
    align-items: center;
  }

  .matrix-dot-btn {
    width: 68px;
    height: 68px;
    border-radius: var(--radius-full);
    background-color: var(--color-surface-sunken);
    border: 1.5px solid var(--color-border-sunken);
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    cursor: pointer;
    box-shadow: 
      inset 0 4px 8px rgba(0, 0, 0, 0.95),
      inset 0 1.5px 3px rgba(0, 0, 0, 0.9),
      inset 0 -1.5px 1px rgba(255, 255, 255, 0.08);
    transition: background-color 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease;
    box-sizing: border-box;
  }

  .matrix-dot-btn:active {
    transform: scale(0.96);
  }

  .matrix-dot-btn.is-active {
    background-color: var(--color-accent-primary);
    border-color: #ffffff;
    box-shadow: 
      0 0 20px var(--color-accent-primary-glow),
      inset 0 0 8px rgba(255, 255, 255, 0.6);
  }

  .matrix-dot-btn.is-active.is-fading {
    animation: dotFadeOut 0.38s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }

  @keyframes dotFadeOut {
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
      background-color: var(--color-surface-sunken);
      border-color: var(--color-border-sunken);
      box-shadow: 
        inset 0 4px 8px rgba(0, 0, 0, 0.95),
        inset 0 1.5px 3px rgba(0, 0, 0, 0.9),
        inset 0 -1.5px 1px rgba(255, 255, 255, 0.08);
    }
  }

  .dot-num {
    font-family: var(--font-mono);
    font-size: 26px;
    font-weight: 900;
    color: var(--color-text-secondary);
    pointer-events: none;
    line-height: 1;
  }

  .matrix-dot-btn.is-active .dot-num {
    color: var(--color-text-inverse);
  }

  .matrix-dot-btn.is-active.is-fading .dot-num {
    animation: dotNumFadeOut 0.38s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }

  @keyframes dotNumFadeOut {
    0% { color: var(--color-text-inverse); }
    25% { color: var(--color-text-inverse); }
    100% { color: var(--color-text-secondary); }
  }
</style>
