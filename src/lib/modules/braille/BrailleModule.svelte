<script lang="ts">
  import { onDestroy } from 'svelte';
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import BrailleReference from './BrailleReference.svelte';
  import KeypadBottomRow from '../../components/ui/KeypadBottomRow.svelte';
  import SpaceCommitButton from '../../components/ui/SpaceCommitButton.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import MenuGroup from '../../components/ui/MenuGroup.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import InterlinearText, { type InterlinearToken } from '../../components/ui/InterlinearText.svelte';
  import {
    brailleFieldsToText,
    decodeBrailleFields,
    dotsToField,
    type DecodedBrailleField
  } from './brailleSolver';
  import { parseNotation, serializeNotation } from '../../utils/notation';
  import { settings } from '../../state/settings.svelte';
  import { createModuleState } from '../../state/moduleState.svelte';

  const { state: modState, reset: resetState } = createModuleState('braille', {
    fields: [] as string[],
    czech: true,
    direct_nums: false,
    auto_insert: false
  });

  // Active cell being edited: array of dot numbers [1..6]
  let activeDots = $state<number[]>([]);
  let committedFade = $state<boolean>(false);
  let fadeTimeout: ReturnType<typeof setTimeout> | null = null;

  const decodeOptions = $derived({
    czechDiacritics: modState.czech,
    directNumbers: modState.direct_nums
  });

  const decoded = $derived(decodeBrailleFields(modState.fields, decodeOptions));
  const plainText = $derived(brailleFieldsToText(decoded));

  // The cell still being entered, read in context: after the number prefix it is a digit
  const pendingField = $derived(
    activeDots.length > 0 && !committedFade ? dotsToField(activeDots) : null
  );
  const pendingDecoded = $derived(
    pendingField !== null
      ? decodeBrailleFields([...modState.fields, pendingField], decodeOptions).at(-1)!
      : null
  );

  function toToken({ field, char, kind }: DecodedBrailleField): InterlinearToken {
    if (kind === 'space') return { primary: '␣', isSpace: true };
    if (kind === 'invalid') {
      return { primary: char, secondary: field, isError: true, errorText: `Neznámé body „${field}“` };
    }
    return { primary: char, secondary: field, className: kind === 'prefix' ? 'token-space' : undefined };
  }

  const tokens = $derived(decoded.map(toToken));
  const pendingToken = $derived<InterlinearToken | null>(
    pendingDecoded
      ? {
          primary: pendingDecoded.char,
          secondary: pendingDecoded.field,
          isPending: true,
          isError: pendingDecoded.kind === 'invalid'
        }
      : null
  );

  const hasContent = $derived(modState.fields.length > 0 || activeDots.length > 0);

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

  /** Writes the active cell to the notation and lets its dots fade out. */
  function commitPending() {
    if (pendingField === null) return;
    appendField(pendingField);
    committedFade = true;
    if (fadeTimeout) clearTimeout(fadeTimeout);
    fadeTimeout = setTimeout(() => {
      activeDots = [];
      committedFade = false;
    }, 380);
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
    e.preventDefault();

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

    if (modState.auto_insert && hadInteractedDots && pendingDecoded) {
      if (pendingDecoded.kind !== 'invalid') {
        settings.vibrate([15, 30, 15]);
        commitPending();
      } else {
        // Unrecognized mask - keep selected
        settings.vibrate(20);
      }
    }
  }

  function handlePointerCancel() {
    isPointerDown = false;
    strokeActivatedDots.clear();
  }

  // --- Keypad Actions ---
  function handleSpace() {
    clearFadeTimer();
    activeDots = [];
    appendField('');
  }

  function handleBackspace() {
    const hadPending = pendingField !== null;
    clearFadeTimer();
    activeDots = [];
    if (!hadPending) modState.fields = modState.fields.slice(0, -1);
  }

  function handleClearAll() {
    clearFadeTimer();
    modState.fields = [];
    activeDots = [];
  }

  function handleReset() {
    clearFadeTimer();
    activeDots = [];
    resetState();
  }

  onDestroy(() => {
    clearFadeTimer();
  });
</script>

<ModuleShell
  onReset={handleReset}
  podklad={{
    kind: 'text',
    required: false,
    empty: modState.fields.length === 0,
    title: 'Zápis',
    description: 'Čísla bodů znaku: čárka dělí znaky, prázdné pole je mezera.',
    example: '1,125,135,245,,12',
    placeholder: 'Např. 1,125,135,245,,12',
    autocapitalize: 'none',
    value: serializeNotation(modState.fields),
    onSave: (val) => {
      // A half-entered cell belongs to the notation that was just replaced
      clearFadeTimer();
      activeDots = [];
      modState.fields = parseNotation(val);
    }
  }}
  bar={{
    empty: !hasContent,
    hint: 'Body zadávejte klepnutím nebo tahem.',
    charCount: plainText.replace(/\s/g, '').length + (pendingToken ? 1 : 0)
  }}
>
  {#snippet output()}
    <TranslationCard text={plainText} {hasContent}>
      {#snippet children()}
        <InterlinearText {tokens} {pendingToken} scalePrimaryBy="primary" />
      {/snippet}
    </TranslationCard>
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

      <KeypadBottomRow
        clearDisabled={!hasContent}
        backspaceDisabled={!hasContent}
        clearLabel="Vymazat celý zápis podržením"
        hasActiveSelection={pendingField !== null}
        cancelTitle="Zrušit výběr bodů"
        onClear={handleClearAll}
        onBackspace={handleBackspace}
      >
        {#snippet middle()}
          <SpaceCommitButton
            pendingChar={pendingDecoded?.char ?? ''}
            onSpace={handleSpace}
            onCommit={commitPending}
          />
        {/snippet}
      </KeypadBottomRow>
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <MenuGroup title="Zadávání">
      <OptionRow
        label="Okamžité vkládání"
        hint="Znak se vloží hned po dokončení tahu, bez potvrzení."
        checked={modState.auto_insert}
        onChange={(v) => (modState.auto_insert = v)}
      />
    </MenuGroup>
    <MenuGroup title="Čtení">
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
    </MenuGroup>
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
    box-sizing: border-box;
  }

  .matrix-col {
    display: flex;
    flex-direction: column;
    gap: 18px;
    align-items: center;
  }

  .matrix-dot-btn {
    --dot-sunken-shadow:
      inset 0 4px 8px rgba(0, 0, 0, 0.95),
      inset 0 1.5px 3px rgba(0, 0, 0, 0.9),
      inset 0 -1.5px 1px rgba(255, 255, 255, 0.08);
    container-type: size;
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
    box-shadow: var(--dot-sunken-shadow);
    transition: background-color 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease;
    box-sizing: border-box;
  }

  .matrix-dot-btn:active {
    transform: scale(0.96);
  }

  .matrix-dot-btn.is-active {
    background-color: var(--color-accent-primary);
    border-color: var(--color-text-primary);
    box-shadow:
      0 0 20px var(--color-accent-primary-glow),
      inset 0 0 8px rgba(255, 255, 255, 0.6);
  }

  .matrix-dot-btn.is-active.is-fading {
    animation: dotFadeOut 0.38s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }

  @keyframes dotFadeOut {
    0%, 25% {
      background-color: var(--color-accent-primary);
      border-color: var(--color-text-primary);
      box-shadow: 0 0 24px var(--color-accent-primary);
    }
    100% {
      background-color: var(--color-surface-sunken);
      border-color: var(--color-border-sunken);
      box-shadow: var(--dot-sunken-shadow);
    }
  }

  .dot-num {
    font-family: var(--font-mono);
    font-size: min(var(--key-l), 60cqh);
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
    0%, 25% { color: var(--color-text-inverse); }
    100% { color: var(--color-text-secondary); }
  }
</style>
