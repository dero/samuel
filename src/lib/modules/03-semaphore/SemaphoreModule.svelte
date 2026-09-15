<script lang="ts">
  import { onDestroy } from 'svelte';
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import SemaphoreReference from './SemaphoreReference.svelte';
  import SlideToAction from '../../components/ui/SlideToAction.svelte';
  import BackspaceButton from '../../components/ui/BackspaceButton.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import DominantButton from '../../components/ui/DominantButton.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
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
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import { localSettingsService } from '../../services/localSettingsService';

  const modSettings = localSettingsService.forModule('semaphore');

  let inputLetters = $state<string>(modSettings.getString('input', ''));
  let mirrorX = $state<boolean>(modSettings.getBoolean('mirror', false));
  let directNumbers = $state<boolean>(modSettings.getBoolean('direct_nums', false));
  let autoInsert = $state<boolean>(modSettings.getBoolean('auto_insert', true));

  // State: 0, 1, or 2 active direction indices (0..7)
  let activeDirs = $state<number[]>([]);
  let committedFade = $state<boolean>(false);
  let fadeTimeout: ReturnType<typeof setTimeout> | null = null;

  // DOM elements
  let wheelContainerEl = $state<HTMLDivElement | null>(null);

  // Drag interaction state
  let isPointerDown = false;
  let lastInteractedDir: number | null = null;

  // Persistence effect
  $effect(() => {
    modSettings.setString('input', inputLetters);
    modSettings.setBoolean('mirror', mirrorX);
    modSettings.setBoolean('direct_nums', directNumbers);
    modSettings.setBoolean('auto_insert', autoInsert);
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

  function triggerHaptic(type: 'tap' | 'commit' | 'clear' = 'tap') {
    if (type === 'tap') settings.vibrate(15);
    else if (type === 'commit') settings.vibrate([15, 30, 15]);
    else if (type === 'clear') settings.vibrate(25);
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
    if (!currentChar || committedFade) return;
    inputLetters += currentChar;
    triggerHaptic('commit');
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
    }
  }

  function handleClearAll() {
    clearFadeTimer();
    inputLetters = '';
    activeDirs = [];
    triggerHaptic('clear');
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
    }
  }

  onDestroy(() => {
    clearFadeTimer();
  });

  // Geometric circle calculation (center = 50%, radius = 38.5%)
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

<ModuleShell onReset={handleReset} onPaste={handlePaste}>
  {#snippet output()}
    <TranslationCard text={inputLetters} />
  {/snippet}

  {#snippet input()}
    <div class="keypad-zone">
      <!-- 8-directional Circular Dial -->
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

            <!-- 8 Circular Targets -->
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

      <!-- Utility Row: Slide to Clear and Smart Backspace -->
      <div class="keypad-utility-row">
        <SlideToAction
          disabled={!inputLetters && activeDirs.length === 0}
          onAction={handleClearAll}
          label="Vymazat"
          ariaLabel="Vymazat celý text tažením"
        />

        <BackspaceButton
          disabled={!inputLetters && activeDirs.length === 0}
          hasActiveSelection={activeDirs.length > 0}
          cancelLabel="Zrušit ramena"
          cancelTitle="Zrušit výběr ramen"
          onAction={handleBackspace}
        />
      </div>

      <!-- Dominant Row: Mezera & Vložit znak (standard 0.85fr 1.15fr) -->
      <div class="keypad-dominant-2col">
        <DominantButton
          symbol="␣"
          name="Mezera"
          variant="secondary"
          title="Vložit mezeru"
          onClick={handleSpace}
        />

        <DominantButton
          symbol={currentChar || '↵'}
          name={currentChar ? `Vložit „${currentChar}“` : activeDirs.length === 1 ? 'Zvolte 2. rameno' : 'Vložit znak'}
          ready={!!currentChar && !committedFade}
          disabled={!currentChar || committedFade}
          title="Vložit znak do textu"
          onClick={commitChar}
        />
      </div>
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <OptionRow
      label="Okamžité zadávání (bez potvrzování)"
      hint="Znak se automaticky vloží ihned po navolení 2 ramen (tahem i klepnutím)."
      checked={autoInsert}
      onChange={(v) => (autoInsert = v)}
    />
    <OptionRow
      label="Režim čísel (1–9, 0 místo písmen)"
      hint="Dekóduje znaky A–I, K jako číslice 1–9, 0."
      checked={directNumbers}
      onChange={(v) => (directNumbers = v)}
    />
    <OptionRow
      label="Zrcadlení (Pohled vysílajícího)"
      hint="Zrcadlí horizontální směr ramen (vlevo ↔ vpravo)."
      checked={mirrorX}
      onChange={(v) => (mirrorX = v)}
    />
  {/snippet}

  {#snippet reference()}
    <SemaphoreReference />
  {/snippet}
</ModuleShell>

<style>
  /* Keypad Zone */
  .keypad-zone {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    width: 100%;
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
    margin-bottom: var(--space-md);
  }

  .semaphore-wheel-card {
    position: relative;
    width: 100%;
    background: transparent;
    border: none;
    box-shadow: none;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(4px, 1vh, 10px) var(--space-sm);
  }

  /* Strict 1:1 square dial ensures exact circle */
  .dial-square {
    position: relative;
    width: clamp(240px, 37vh, 330px);
    height: clamp(240px, 37vh, 330px);
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
    fill: #000000;
    stroke: var(--color-border-subtle);
    stroke-width: 1.5;
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
    0% { opacity: 1; }
    25% { opacity: 1; }
    100% { opacity: 0; }
  }

  /* 8 Direction Circular Buttons */
  .wheel-dir-btn {
    position: absolute;
    transform: translate(-50%, -50%);
    width: clamp(52px, 7.8vh, 64px);
    height: clamp(52px, 7.8vh, 64px);
    border-radius: var(--radius-full);
    background-color: #000000;
    border: 2px solid var(--color-border-subtle);
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.1s ease, border-color 0.1s ease, transform 0.08s ease, box-shadow 0.1s ease;
    box-sizing: border-box;
    z-index: 2;
    padding: 0;
  }

  .wheel-dir-btn:active {
    transform: translate(-50%, -50%) scale(0.92);
  }

  .dir-hint {
    font-family: var(--font-condensed);
    font-size: clamp(20px, 3vh, 26px);
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
    box-shadow: var(--glow-accent-strong);
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
      background-color: #000000;
      border-color: var(--color-border-subtle);
      box-shadow: 0 0 0 rgba(0, 210, 255, 0);
    }
  }
</style>
