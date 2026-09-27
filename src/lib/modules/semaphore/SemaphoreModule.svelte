<script lang="ts">
  import { onDestroy } from 'svelte';
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import SemaphoreReference from './SemaphoreReference.svelte';
  import SlideToAction from '../../components/ui/SlideToAction.svelte';
  import SpaceCommitButton from '../../components/ui/SpaceCommitButton.svelte';
  import BackspaceButton from '../../components/ui/BackspaceButton.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import NonStandardSettingsBanner from '../../components/ui/NonStandardSettingsBanner.svelte';
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
  import { createModuleState } from '../../state/moduleState.svelte';

  const { state: modState, reset: resetState } = createModuleState('semaphore', {
    input: '',
    mirror: false,
    direct_nums: false,
    auto_insert: true
  });

  // State: 0, 1, or 2 active direction indices (0..7)
  let activeDirs = $state<number[]>([]);
  let committedFade = $state<boolean>(false);
  let fadeTimeout: ReturnType<typeof setTimeout> | null = null;

  // DOM elements
  let wheelContainerEl = $state<HTMLDivElement | null>(null);

  // Drag interaction state
  let isPointerDown = false;
  let lastInteractedDir: number | null = null;

  // Current options
  let decodeOptions = $derived<SemaphoreDecodeOptions>({
    mirrorX: modState.mirror,
    directNumbers: modState.direct_nums
  });

  // Decoded character for currently selected pair of directions
  let currentEntry = $derived<SemaphoreEntry | null>(
    activeDirs.length === 2 ? decodePair(activeDirs[0], activeDirs[1], decodeOptions) : null
  );

  let currentChar = $derived<string>(
    currentEntry ? getCharForEntry(currentEntry, decodeOptions) : ''
  );

  const nonStandardCount = $derived(
    (modState.mirror ? 1 : 0) +
    (modState.direct_nums ? 1 : 0)
  );

  function resetSettingsToDefaults() {
    modState.mirror = false;
    modState.direct_nums = false;
    toast.show('Výchozí nastavení obnoveno', { type: 'success' });
  }

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
        if (modState.auto_insert) {
          // Instant decode and commit on 2nd arm, with visual fade-out of the complete sign
          const entry = decodePair(firstDir, dirIdx, decodeOptions);
          if (entry) {
            const charToInsert = getCharForEntry(entry, decodeOptions);
            modState.input += charToInsert;
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
    modState.input += currentChar;
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
      modState.input += currentChar + ' ';
    } else {
      modState.input += ' ';
    }
    activeDirs = [];
  }

  function handleBackspace() {
    clearFadeTimer();
    if (activeDirs.length > 0) {
      // Cancel active arm selection without touching text
      activeDirs = [];
    } else if (modState.input.length > 0) {
      modState.input = modState.input.slice(0, -1);
    }
  }

  function handleClearAll() {
    clearFadeTimer();
    modState.input = '';
    activeDirs = [];
  }

  function handleReset() {
    handleClearAll();
  }

  function handlePaste(text: string) {
    clearFadeTimer();
    const normalized = normalizeSemaphoreInput(text, decodeOptions);
    if (normalized) {
      modState.input += (modState.input.length > 0 ? ' ' : '') + normalized;
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

<ModuleShell
  hasWarning={nonStandardCount > 0}
  onReset={handleReset}
  onPaste={handlePaste}
>
  {#snippet output()}
    <TranslationCard
      text={modState.input}
      emptyHint="Zvolte 2 pozice nebo spojte tahem."
    />
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
              <defs>
                {#each WHEEL_DIRS as dir}
                  <linearGradient
                    id="beam-fade-{dir.index}"
                    gradientUnits="userSpaceOnUse"
                    x1={dir.left}
                    y1={dir.top}
                    x2="50"
                    y2="50"
                  >
                    <stop offset="0%" stop-color="var(--color-accent-primary)" stop-opacity="1" />
                    <stop offset="35%" stop-color="var(--color-accent-primary)" stop-opacity="0.8" />
                    <stop offset="75%" stop-color="var(--color-accent-primary)" stop-opacity="0" />
                  </linearGradient>
                {/each}
              </defs>

              <!-- If 1 arm selected: beam fades out towards center -->
              {#if activeDirs.length === 1}
                {@const dir0 = WHEEL_DIRS[activeDirs[0]]}
                <line
                  x1={dir0.left}
                  y1={dir0.top}
                  x2="50"
                  y2="50"
                  stroke="url(#beam-fade-{dir0.index})"
                  class="svg-beam-fade"
                  class:is-fading={committedFade}
                />
              <!-- If 2 arms selected: connected angular path with animated stroke -->
              {:else if activeDirs.length === 2}
                {@const dir0 = WHEEL_DIRS[activeDirs[0]]}
                {@const dir1 = WHEEL_DIRS[activeDirs[1]]}
                <path
                  d="M {dir0.left} {dir0.top} L 50 50 L {dir1.left} {dir1.top}"
                  class="svg-beam-active"
                  class:is-fading={committedFade}
                />
              {/if}
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

      <!-- Utility Row: Slide to Clear, Space/Commit and Smart Backspace (1fr 1.3fr 1fr) -->
      <div class="keypad-utility-row-3col">
        <SlideToAction
          disabled={!modState.input && activeDirs.length === 0}
          onAction={handleClearAll}
          ariaLabel="Vymazat celý text tažením"
        />

        <SpaceCommitButton
          pendingChar={currentChar}
          onSpace={handleSpace}
          onCommit={commitChar}
        />

        <BackspaceButton
          disabled={!modState.input && activeDirs.length === 0}
          hasActiveSelection={activeDirs.length > 0}
          cancelLabel="Zrušit ramena"
          cancelTitle="Zrušit výběr ramen"
          onAction={handleBackspace}
        />
      </div>
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <NonStandardSettingsBanner
      count={nonStandardCount}
      onResetDefaults={resetSettingsToDefaults}
    />

    <OptionRow
      label="Okamžité vkládání"
      hint="Znak se vloží hned po zvolení obou ramen."
      checked={modState.auto_insert}
      onChange={(v) => (modState.auto_insert = v)}
    />
    <OptionRow
      label="Režim čísel"
      hint="A–I, K čte jako 1–9, 0."
      checked={modState.direct_nums}
      isNonStandard={modState.direct_nums}
      onChange={(v) => (modState.direct_nums = v)}
    />
    <OptionRow
      label="Pohled vysílajícího"
      hint="Prohodí levou a pravou stranu."
      checked={modState.mirror}
      isNonStandard={modState.mirror}
      onChange={(v) => (modState.mirror = v)}
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
    gap: var(--zone-input-gap);
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
    padding: 6px 0;
  }

  /* Strict 1:1 square dial ensures exact circle */
  .dial-square {
    position: relative;
    width: 100%;
    max-width: min(100%, 360px);
    height: auto;
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

  .svg-beam-fade {
    stroke-width: 4.5;
    stroke-linecap: round;
    filter: drop-shadow(0 0 6px rgba(0, 210, 255, 0.6));
    animation: beamAppear 0.15s ease-out;
  }

  .svg-beam-active {
    fill: none;
    stroke: var(--color-accent-primary);
    stroke-width: 4.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    filter: drop-shadow(0 0 8px rgba(0, 210, 255, 0.9));
    animation: beamConnect 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .svg-beam-fade.is-fading,
  .svg-beam-active.is-fading {
    animation: beamFadeOut 0.38s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }

  @keyframes beamAppear {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes beamConnect {
    from {
      opacity: 0.4;
      stroke-dasharray: 120;
      stroke-dashoffset: 45;
    }
    to {
      opacity: 1;
      stroke-dasharray: 120;
      stroke-dashoffset: 0;
    }
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
    width: 60px;
    height: 60px;
    border-radius: var(--radius-full);
    background-color: var(--color-surface-sunken);
    border: 1.5px solid var(--color-border-sunken);
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 
      inset 0 3px 6px rgba(0, 0, 0, 0.95),
      inset 0 1.5px 3px rgba(0, 0, 0, 0.9),
      inset 0 -1.5px 1px rgba(255, 255, 255, 0.08);
    transition: background-color 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease;
    box-sizing: border-box;
    z-index: 2;
    padding: 0;
  }

  .wheel-dir-btn:active {
    transform: translate(-50%, -50%) scale(0.96);
  }

  .dir-hint {
    font-family: var(--font-condensed);
    font-size: 24px;
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
    box-shadow: 
      0 0 18px var(--color-accent-primary-glow),
      inset 0 0 6px rgba(255, 255, 255, 0.6);
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
      background-color: var(--color-surface-sunken);
      border-color: var(--color-border-sunken);
      box-shadow: 
        inset 0 3px 6px rgba(0, 0, 0, 0.95),
        inset 0 1.5px 3px rgba(0, 0, 0, 0.9),
        inset 0 -1.5px 1px rgba(255, 255, 255, 0.08);
    }
  }
</style>
