<script lang="ts">
  import { onDestroy } from 'svelte';
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import SemaphoreReference from './SemaphoreReference.svelte';
  import KeypadBottomRow from '../../components/ui/KeypadBottomRow.svelte';
  import SpaceCommitButton from '../../components/ui/SpaceCommitButton.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import MenuGroup from '../../components/ui/MenuGroup.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import InterlinearText, { type InterlinearToken } from '../../components/ui/InterlinearText.svelte';
  import {
    SEMAPHORE_DIRECTIONS,
    type SemaphoreEntry
  } from './semaphoreData';
  import {
    decodePair,
    decodeSemaphoreFields,
    directionToArm,
    dirsToField,
    previewSemaphoreEntry,
    type DecodedSemaphoreField,
    type SemaphoreDecodeOptions
  } from './semaphoreSolver';
  import { parseNotation, serializeNotation } from '../../utils/notation';
  import { settings } from '../../state/settings.svelte';
  import { createModuleState } from '../../state/moduleState.svelte';

  const { state: modState, reset: resetState } = createModuleState('semaphore', {
    fields: [] as string[],
    mirror: false,
    auto_insert: true
  });

  // State: 0, 1, or 2 active direction indices (0..7)
  let activeDirs = $state<number[]>([]);
  let committedFade = $state<boolean>(false);
  let fadeTimeout: ReturnType<typeof setTimeout> | null = null;

  // Drag interaction state
  let isPointerDown = false;
  let lastInteractedDir: number | null = null;

  // Current options
  let decodeOptions = $derived<SemaphoreDecodeOptions>({
    mirrorX: modState.mirror
  });

  const decoded = $derived(decodeSemaphoreFields(modState.fields, decodeOptions));

  // Decoded character for currently selected pair of directions
  let currentEntry = $derived<SemaphoreEntry | null>(
    activeDirs.length === 2 ? decodePair(activeDirs[0], activeDirs[1], decodeOptions) : null
  );

  let currentChar = $derived<string>(previewSemaphoreEntry(currentEntry, decoded.numMode));

  const isDrafting = $derived(activeDirs.length > 0 && !committedFade);

  function toToken({ field, symbol, kind, erased }: DecodedSemaphoreField): InterlinearToken {
    if (kind === 'space' && !erased) return { primary: symbol, isSpace: true };
    if (kind === 'invalid' && !erased) {
      return { primary: symbol, secondary: field, isError: true, errorText: `Neznámá dvojice „${field}“` };
    }
    const classes = [kind === 'control' ? 'token-space' : '', erased ? 'token-erased' : ''];
    return { primary: symbol, secondary: field, className: classes.join(' ').trim() || undefined };
  }

  const tokens = $derived(decoded.items.map(toToken));

  const pendingToken = $derived.by<InterlinearToken | null>(() => {
    if (!isDrafting) return null;
    if (activeDirs.length === 1) {
      return { primary: '…', secondary: String(directionToArm(activeDirs[0])), isPending: true };
    }
    return {
      primary: currentChar || '?',
      secondary: dirsToField(activeDirs[0], activeDirs[1]),
      isPending: true,
      isError: !currentEntry
    };
  });

  const hasContent = $derived(modState.fields.length > 0 || activeDirs.length > 0);

  function triggerHaptic(type: 'tap' | 'commit' = 'tap') {
    if (type === 'tap') settings.vibrate(15);
    else settings.vibrate([15, 30, 15]);
  }

  function clearFadeTimer() {
    if (fadeTimeout) {
      clearTimeout(fadeTimeout);
      fadeTimeout = null;
    }
    committedFade = false;
  }

  function appendField(field: string) {
    modState.fields = [...modState.fields, field];
  }

  /** Writes the two active arms to the notation and lets the sign fade out. */
  function commitPair(a: number, b: number) {
    appendField(dirsToField(a, b));
    activeDirs = [a, b];
    committedFade = true;
    if (fadeTimeout) clearTimeout(fadeTimeout);
    fadeTimeout = setTimeout(() => {
      activeDirs = [];
      committedFade = false;
    }, 380);
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
    } else if (activeDirs.length === 1) {
      const firstDir = activeDirs[0];
      if (modState.auto_insert && decodePair(firstDir, dirIdx, decodeOptions)) {
        // Instant decode and commit on 2nd arm, with visual fade-out of the complete sign
        commitPair(firstDir, dirIdx);
        triggerHaptic('commit');
      } else {
        activeDirs = [firstDir, dirIdx];
        triggerHaptic('tap');
      }
    } else {
      // Nothing selected yet, or already 2 directions: start fresh with the new one
      activeDirs = [dirIdx];
      triggerHaptic('tap');
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
    e.preventDefault();
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

  function handlePointerCancel() {
    isPointerDown = false;
    lastInteractedDir = null;
  }

  function commitChar() {
    if (!currentEntry || committedFade) return;
    commitPair(activeDirs[0], activeDirs[1]);
  }

  function handleSpace() {
    clearFadeTimer();
    activeDirs = [];
    appendField('');
  }

  function handleBackspace() {
    const hadDraft = isDrafting;
    clearFadeTimer();
    activeDirs = [];
    if (!hadDraft) modState.fields = modState.fields.slice(0, -1);
  }

  function handleClearAll() {
    clearFadeTimer();
    modState.fields = [];
    activeDirs = [];
  }

  function handleReset() {
    clearFadeTimer();
    activeDirs = [];
    resetState();
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
    return previewSemaphoreEntry(decodePair(firstDir, secondDir, decodeOptions), decoded.numMode);
  }
</script>

<ModuleShell
  hasWarning={modState.mirror}
  onReset={handleReset}
  podklad={{
    kind: 'text',
    required: false,
    empty: modState.fields.length === 0,
    title: 'Zápis',
    description: 'Dvojice ramen 1–8 od „dolů“ po směru hodin, čárka dělí znaky.',
    example: '12,23,34,57',
    placeholder: 'Např. 12,23,34,57',
    autocapitalize: 'none',
    value: serializeNotation(modState.fields),
    onSave: (val) => {
      // A half-entered sign belongs to the notation that was just replaced
      clearFadeTimer();
      activeDirs = [];
      modState.fields = parseNotation(val);
    }
  }}
  bar={{
    empty: !hasContent,
    hint: 'Zvolte 2 pozice nebo spojte tahem.',
    // The mirror is a non-standard setting: only the Menu dot shows it (DESIGN_SYSTEM §5)
    status: decoded.numMode ? 'Číslice, zpět signálem J' : undefined,
    charCount: decoded.text.replace(/\s/g, '').length + (pendingToken ? 1 : 0)
  }}
>
  {#snippet output()}
    <TranslationCard text={decoded.text} {hasContent}>
      {#snippet children()}
        <InterlinearText {tokens} {pendingToken} scalePrimaryBy="primary" />
      {/snippet}
    </TranslationCard>
  {/snippet}

  {#snippet input()}
    <div class="keypad-zone">
      <!-- 8-directional Circular Dial -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
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

      <KeypadBottomRow
        clearDisabled={!hasContent}
        backspaceDisabled={!hasContent}
        clearLabel="Vymazat celý zápis podržením"
        hasActiveSelection={isDrafting}
        cancelTitle="Zrušit výběr ramen"
        onClear={handleClearAll}
        onBackspace={handleBackspace}
      >
        {#snippet middle()}
          <SpaceCommitButton
            pendingChar={committedFade ? '' : currentChar}
            onSpace={handleSpace}
            onCommit={commitChar}
          />
        {/snippet}
      </KeypadBottomRow>
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <MenuGroup>
      <OptionRow
        label="Okamžité vkládání"
        hint="Znak se vloží hned po zvolení obou ramen."
        checked={modState.auto_insert}
        onChange={(v) => (modState.auto_insert = v)}
      />
      <OptionRow
        label="Pohled vysílajícího"
        hint="Prohodí levou a pravou stranu."
        checked={modState.mirror}
        isNonStandard={modState.mirror}
        onChange={(v) => (modState.mirror = v)}
      />
    </MenuGroup>
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

  /* A signal erased by a later Omyl stays in the notation, struck out */
  :global(.interlinear-cell.token-erased) {
    opacity: 0.45;
  }

  :global(.interlinear-cell.token-erased .cell-primary) {
    text-decoration: line-through;
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
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Strict 1:1 square dial ensures exact circle. The last term applies only on short
     screens, where the panel has already taken the output down to its minimum. */
  .dial-square {
    position: relative;
    width: min(
      100%,
      360px,
      calc(
        100dvh - var(--header-height) - var(--output-min-height) - var(--status-bar-height)
          - var(--zone-input-offset) - var(--zone-input-gap) - var(--utility-row-height)
          - var(--space-md) - env(safe-area-inset-bottom, 0px)
      )
    );
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
    filter: drop-shadow(0 0 6px var(--color-accent-primary-glow));
    animation: beamAppear 0.15s ease-out;
  }

  .svg-beam-active {
    fill: none;
    stroke: var(--color-accent-primary);
    stroke-width: 4.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    filter: drop-shadow(0 0 8px var(--color-accent-primary));
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
    --dir-sunken-shadow:
      inset 0 3px 6px rgba(0, 0, 0, 0.95),
      inset 0 1.5px 3px rgba(0, 0, 0, 0.9),
      inset 0 -1.5px 1px rgba(255, 255, 255, 0.08);
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
    box-shadow: var(--dir-sunken-shadow);
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
    font-size: var(--key-m);
    font-weight: 800;
    color: var(--color-text-muted);
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
    border-color: var(--color-text-primary);
    box-shadow:
      0 0 18px var(--color-accent-primary-glow),
      inset 0 0 6px rgba(255, 255, 255, 0.6);
  }

  .wheel-dir-btn.is-active.is-fading {
    animation: buttonFadeOut 0.38s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }

  @keyframes buttonFadeOut {
    0%, 25% {
      background-color: var(--color-accent-primary);
      border-color: var(--color-text-primary);
      box-shadow: 0 0 24px var(--color-accent-primary);
    }
    100% {
      background-color: var(--color-surface-sunken);
      border-color: var(--color-border-sunken);
      box-shadow: var(--dir-sunken-shadow);
    }
  }
</style>
