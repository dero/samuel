<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { CrossType } from './crossData';
  import { fieldToChar, smallIndexToField } from './crossSolver';
  import { settings } from '../../state/settings.svelte';

  interface Props {
    crossType: CrossType;
    letters: string[];
    selectedAxis1: number | null;
    selectedAxis2: number | null;
    selectedAxis3: number | null;
    onFieldSelect: (field: string) => void;
  }

  let {
    crossType,
    letters,
    selectedAxis1,
    selectedAxis2,
    selectedAxis3,
    onFieldSelect
  }: Props = $props();

  const smallPolishLetters = $derived.by(() => {
    if (letters.length >= 26) {
      return letters.slice(0, 26);
    }
    const padded = [...letters];
    while (padded.length < 26) {
      padded.push(' ');
    }
    return padded;
  });

  let containerEl = $state<HTMLElement | null>(null);
  let activeField = $state<string | null>(null);
  let pigpenClearTimeout: ReturnType<typeof setTimeout> | null = null;

  function clearPigpenTimeout() {
    if (pigpenClearTimeout) {
      clearTimeout(pigpenClearTimeout);
      pigpenClearTimeout = null;
    }
  }

  function triggerEnclosureAnimation(target: HTMLElement | SVGElement) {
    const cell = target.closest(
      '.polish-cell, .pigpen-cell'
    ) as HTMLElement | SVGElement | null;
    if (!cell) return;

    const keyframes = cell instanceof SVGElement
      ? [
          { filter: 'none' },
          { filter: 'drop-shadow(0 0 6px var(--color-accent-primary-glow))', offset: 0.35 },
          { filter: 'none' }
        ]
      : [
          { borderColor: 'var(--color-text-secondary)', filter: 'none' },
          { borderColor: 'var(--color-accent-primary)', filter: 'drop-shadow(0 0 6px var(--color-accent-primary-glow))', offset: 0.35 },
          { borderColor: 'var(--color-text-secondary)', filter: 'none' }
        ];

    cell.animate(keyframes, {
      duration: 400,
      easing: 'ease-in-out'
    });
  }

  export function flashCoordinate(a1: number, a2: number, a3: number = 1) {
    if (!containerEl) return;
    if (crossType === 'large-polish') {
      const cell = containerEl.querySelector(`.polish-cell.r-${a1}.c-${a2}`) as HTMLElement | null;
      if (cell) {
        triggerEnclosureAnimation(cell);
      }
      const btn = containerEl.querySelector(`.polish-cell.r-${a1}.c-${a2} [data-pos="${a3}"]`) as HTMLElement | null;
      if (btn) {
        btn.animate(
          [
            { backgroundColor: 'var(--color-accent-primary)', color: 'var(--color-text-inverse)', transform: 'scale(1.22)', boxShadow: '0 0 16px var(--color-accent-primary-glow)' },
            { backgroundColor: 'transparent', color: 'var(--color-text-primary)', transform: 'scale(1)', boxShadow: 'none' }
          ],
          { duration: 520, easing: 'ease-out' }
        );
      }
    }
  }

  function handleLetterPointerDown(e: PointerEvent, field: string) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (!fieldToChar(crossType, field, letters)) return; // blank cell of a short alphabet
    e.preventDefault();
    settings.vibrate(18);
    activeField = field;
    clearPigpenTimeout();
    pigpenClearTimeout = setTimeout(() => {
      activeField = null;
    }, 140);
    triggerEnclosureAnimation(e.currentTarget as HTMLElement | SVGElement);
    onFieldSelect(field);
  }

  function handleLetterPointerUp() {
    activeField = null;
    clearPigpenTimeout();
  }

  function handleLetterKeyDown(e: KeyboardEvent, field: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!fieldToChar(crossType, field, letters)) return;
      settings.vibrate(18);
      onFieldSelect(field);
    }
  }

  function isLetterHighlighted(a1: number, a2: number, a3: number): boolean {
    if (selectedAxis3 === null || selectedAxis3 !== a3) return false;
    if (selectedAxis1 !== null && selectedAxis1 !== a1) return false;
    if (selectedAxis2 !== null && selectedAxis2 !== a2) return false;
    return true;
  }

  onDestroy(() => {
    clearPigpenTimeout();
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={containerEl}
  class="interactive-cross-container"
  oncontextmenu={(e) => e.preventDefault()}
>
  <!-- Velký polský kříž (9 nezávislých chlívků se specifickými ohrádkami a mezerami) -->
  <div class="polish-grid-3x3" class:is-hidden={crossType !== 'large-polish'}>
    {#each [1, 2, 3] as r}
      {#each [1, 2, 3] as c}
        {@const cellHighlighted =
          (selectedAxis1 === null || selectedAxis1 === r) &&
          (selectedAxis2 === null || selectedAxis2 === c) &&
          (selectedAxis1 !== null || selectedAxis2 !== null)}
        <div
          class="polish-cell r-{r} c-{c}"
          class:cell-active={cellHighlighted}
          data-row={r}
          data-col={c}
        >
          {#each [1, 2, 3] as p}
            {@const field = `${r}${c}${p}`}
            {@const char = fieldToChar('large-polish', field, letters) ?? ''}
            {@const isSelected = isLetterHighlighted(r, c, p)}
            {@const displaySymbol = char === ' ' ? '␣' : char}
            {#if char}
              <button
                type="button"
                data-pos={p}
                class="letter-btn"
                class:is-highlighted={isSelected}
                class:is-space-btn={char === ' '}
                onpointerdown={(e) => handleLetterPointerDown(e, field)}
              >
                <span class="char-symbol" class:is-space-symbol={char === ' '}>{displaySymbol}</span>
                <span class="dot-indicator">
                  {#if p === 1}
                    <span class="dot">•</span>
                  {:else if p === 2}
                    <span class="dot">••</span>
                  {:else if p === 3}
                    <span class="dot">•••</span>
                  {/if}
                </span>
              </button>
            {:else}
              <div class="letter-placeholder"></div>
            {/if}
          {/each}
        </div>
      {/each}
    {/each}
  </div>

  <!-- Pigpen (Malý polský kříž): Sjednocené SVG plátno pro 3×3 mřížky i 2×2 šikmé kříže -->
  <div class="pigpen-board-wrapper" class:is-hidden={crossType !== 'small-polish'}>
    <svg
      class="pigpen-board-svg"
      viewBox="0 0 312 266"
      role="group"
      aria-label="Pigpen šifrovací kříže"
      oncontextmenu={(e) => e.preventDefault()}
      onpointerup={handleLetterPointerUp}
      onpointercancel={handleLetterPointerUp}
      onpointerleave={handleLetterPointerUp}
    >
        <!-- 3x3 Mřížka Col 1 (A–I, bez tečky) -->
        {#each [0, 1, 2] as r}
          {#each [0, 1, 2] as c}
            {@const char = smallPolishLetters[r * 3 + c]}
            {@const field = smallIndexToField(r * 3 + c)}
            {@const x = 4 + c * 48}
            {@const y = 4 + r * 48}
            {@const cx = x + 24}
            {@const cy = y + 24}
            <g
              class="pigpen-cell"
              class:is-active={activeField === field}
              role="button"
              tabindex="0"
              aria-label={`Písmeno ${char}`}
              onpointerdown={(e) => handleLetterPointerDown(e, field)}
              onkeydown={(e) => handleLetterKeyDown(e, field)}
              oncontextmenu={(e) => e.preventDefault()}
            >
              <rect {x} {y} width="48" height="48" class="cell-hitarea" />
              <g class="cell-content" style="transform-origin: {cx}px {cy}px;">
                <text x={cx} y={cy} class="cell-char">{char}</text>
              </g>
            </g>
          {/each}
        {/each}

        <!-- 3x3 Mřížka Col 2 (J–R, s tečkou) -->
        {#each [0, 1, 2] as r}
          {#each [0, 1, 2] as c}
            {@const char = smallPolishLetters[9 + r * 3 + c]}
            {@const field = smallIndexToField(9 + r * 3 + c)}
            {@const x = 164 + c * 48}
            {@const y = 4 + r * 48}
            {@const cx = x + 24}
            {@const cy = y + 24}
            <g
              class="pigpen-cell"
              class:is-active={activeField === field}
              role="button"
              tabindex="0"
              aria-label={`Písmeno ${char}`}
              onpointerdown={(e) => handleLetterPointerDown(e, field)}
              onkeydown={(e) => handleLetterKeyDown(e, field)}
              oncontextmenu={(e) => e.preventDefault()}
            >
              <rect {x} {y} width="48" height="48" class="cell-hitarea" />
              <g class="cell-content" style="transform-origin: {cx}px {cy}px;">
                <text x={cx - 5.5} y={cy} class="cell-char">{char}</text>
                <circle cx={cx + 8.5} cy={cy} r="2.5" class="cell-dot" />
              </g>
            </g>
          {/each}
        {/each}

        <!-- 2x2 Šikmý kříž Col 1 (S–V, bez tečky) -->
        <g
          class="pigpen-cell"
          class:is-active={activeField === smallIndexToField(18)}
          role="button"
          tabindex="0"
          aria-label={`Písmeno ${smallPolishLetters[18]}`}
          onpointerdown={(e) => handleLetterPointerDown(e, smallIndexToField(18))}
          onkeydown={(e) => handleLetterKeyDown(e, smallIndexToField(18))}
          oncontextmenu={(e) => e.preventDefault()}
        >
          <polygon points="28,164 124,164 76,212" class="cell-hitarea" />
          <g class="cell-content" style="transform-origin: 76px 188px;">
            <text x="76" y="188" class="cell-char">{smallPolishLetters[18]}</text>
          </g>
        </g>

        <g
          class="pigpen-cell"
          class:is-active={activeField === smallIndexToField(19)}
          role="button"
          tabindex="0"
          aria-label={`Písmeno ${smallPolishLetters[19]}`}
          onpointerdown={(e) => handleLetterPointerDown(e, smallIndexToField(19))}
          onkeydown={(e) => handleLetterKeyDown(e, smallIndexToField(19))}
          oncontextmenu={(e) => e.preventDefault()}
        >
          <polygon points="28,164 76,212 28,260" class="cell-hitarea" />
          <g class="cell-content" style="transform-origin: 52px 212px;">
            <text x="52" y="212" class="cell-char">{smallPolishLetters[19]}</text>
          </g>
        </g>

        <g
          class="pigpen-cell"
          class:is-active={activeField === smallIndexToField(20)}
          role="button"
          tabindex="0"
          aria-label={`Písmeno ${smallPolishLetters[20]}`}
          onpointerdown={(e) => handleLetterPointerDown(e, smallIndexToField(20))}
          onkeydown={(e) => handleLetterKeyDown(e, smallIndexToField(20))}
          oncontextmenu={(e) => e.preventDefault()}
        >
          <polygon points="124,164 76,212 124,260" class="cell-hitarea" />
          <g class="cell-content" style="transform-origin: 100px 212px;">
            <text x="100" y="212" class="cell-char">{smallPolishLetters[20]}</text>
          </g>
        </g>

        <g
          class="pigpen-cell"
          class:is-active={activeField === smallIndexToField(21)}
          role="button"
          tabindex="0"
          aria-label={`Písmeno ${smallPolishLetters[21]}`}
          onpointerdown={(e) => handleLetterPointerDown(e, smallIndexToField(21))}
          onkeydown={(e) => handleLetterKeyDown(e, smallIndexToField(21))}
          oncontextmenu={(e) => e.preventDefault()}
        >
          <polygon points="28,260 76,212 124,260" class="cell-hitarea" />
          <g class="cell-content" style="transform-origin: 76px 236px;">
            <text x="76" y="236" class="cell-char">{smallPolishLetters[21]}</text>
          </g>
        </g>

        <!-- 2x2 Šikmý kříž Col 2 (W–Z, s tečkou) -->
        <g
          class="pigpen-cell"
          class:is-active={activeField === smallIndexToField(22)}
          role="button"
          tabindex="0"
          aria-label={`Písmeno ${smallPolishLetters[22]}`}
          onpointerdown={(e) => handleLetterPointerDown(e, smallIndexToField(22))}
          onkeydown={(e) => handleLetterKeyDown(e, smallIndexToField(22))}
          oncontextmenu={(e) => e.preventDefault()}
        >
          <polygon points="188,164 284,164 236,212" class="cell-hitarea" />
          <g class="cell-content" style="transform-origin: 236px 188px;">
            <text x="236" y="182" class="cell-char">{smallPolishLetters[22]}</text>
            <circle cx="236" cy="197" r="2.5" class="cell-dot" />
          </g>
        </g>

        <g
          class="pigpen-cell"
          class:is-active={activeField === smallIndexToField(23)}
          role="button"
          tabindex="0"
          aria-label={`Písmeno ${smallPolishLetters[23]}`}
          onpointerdown={(e) => handleLetterPointerDown(e, smallIndexToField(23))}
          onkeydown={(e) => handleLetterKeyDown(e, smallIndexToField(23))}
          oncontextmenu={(e) => e.preventDefault()}
        >
          <polygon points="188,164 236,212 188,260" class="cell-hitarea" />
          <g class="cell-content" style="transform-origin: 212px 212px;">
            <text x="206" y="212" class="cell-char">{smallPolishLetters[23]}</text>
            <circle cx="221" cy="212" r="2.5" class="cell-dot" />
          </g>
        </g>

        <g
          class="pigpen-cell"
          class:is-active={activeField === smallIndexToField(24)}
          role="button"
          tabindex="0"
          aria-label={`Písmeno ${smallPolishLetters[24]}`}
          onpointerdown={(e) => handleLetterPointerDown(e, smallIndexToField(24))}
          onkeydown={(e) => handleLetterKeyDown(e, smallIndexToField(24))}
          oncontextmenu={(e) => e.preventDefault()}
        >
          <polygon points="284,164 236,212 284,260" class="cell-hitarea" />
          <g class="cell-content" style="transform-origin: 260px 212px;">
            <circle cx="251" cy="212" r="2.5" class="cell-dot" />
            <text x="266" y="212" class="cell-char">{smallPolishLetters[24]}</text>
          </g>
        </g>

        <g
          class="pigpen-cell"
          class:is-active={activeField === smallIndexToField(25)}
          role="button"
          tabindex="0"
          aria-label={`Písmeno ${smallPolishLetters[25]}`}
          onpointerdown={(e) => handleLetterPointerDown(e, smallIndexToField(25))}
          onkeydown={(e) => handleLetterKeyDown(e, smallIndexToField(25))}
          oncontextmenu={(e) => e.preventDefault()}
        >
          <polygon points="188,260 236,212 284,260" class="cell-hitarea" />
          <g class="cell-content" style="transform-origin: 236px 236px;">
            <circle cx="236" cy="227" r="2.5" class="cell-dot" />
            <text x="236" y="242" class="cell-char">{smallPolishLetters[25]}</text>
          </g>
        </g>

        <!-- DĚLICÍ ČÁRY -->
        <line x1="52" y1="4" x2="52" y2="148" class="pigpen-line" />
        <line x1="100" y1="4" x2="100" y2="148" class="pigpen-line" />
        <line x1="4" y1="52" x2="148" y2="52" class="pigpen-line" />
        <line x1="4" y1="100" x2="148" y2="100" class="pigpen-line" />

        <line x1="212" y1="4" x2="212" y2="148" class="pigpen-line" />
        <line x1="260" y1="4" x2="260" y2="148" class="pigpen-line" />
        <line x1="164" y1="52" x2="308" y2="52" class="pigpen-line" />
        <line x1="164" y1="100" x2="308" y2="100" class="pigpen-line" />

        <line x1="28" y1="164" x2="124" y2="260" class="pigpen-line" />
        <line x1="124" y1="164" x2="28" y2="260" class="pigpen-line" />

        <line x1="188" y1="164" x2="284" y2="260" class="pigpen-line" />
        <line x1="284" y1="164" x2="188" y2="260" class="pigpen-line" />
      </svg>
    </div>
</div>

<style>
  .interactive-cross-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    touch-action: none;
  }

  .is-hidden {
    display: none !important;
  }

  /* --- Velký polský kříž 3x3: 9 samostatných chlívků s mezerami --- */
  .polish-grid-3x3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 46px);
    gap: 3px;
    width: 100%;
    background: transparent;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    touch-action: none;
  }

  .polish-cell {
    position: relative;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    align-items: center;
    justify-items: center;
    background: transparent;
    padding: 2px 3px;
    height: 100%;
    box-sizing: border-box;
    border-radius: 0;
    transition: background-color 0.12s ease;
  }

  .polish-cell.r-1.c-1 { border-right: 3px solid var(--color-text-secondary); border-bottom: 3px solid var(--color-text-secondary); }
  .polish-cell.r-1.c-2 { border-left: 3px solid var(--color-text-secondary); border-right: 3px solid var(--color-text-secondary); border-bottom: 3px solid var(--color-text-secondary); }
  .polish-cell.r-1.c-3 { border-left: 3px solid var(--color-text-secondary); border-bottom: 3px solid var(--color-text-secondary); }

  .polish-cell.r-2.c-1 { border-top: 3px solid var(--color-text-secondary); border-bottom: 3px solid var(--color-text-secondary); border-right: 3px solid var(--color-text-secondary); }
  .polish-cell.r-2.c-2 { border: 3px solid var(--color-text-secondary); }
  .polish-cell.r-2.c-3 { border-top: 3px solid var(--color-text-secondary); border-bottom: 3px solid var(--color-text-secondary); border-left: 3px solid var(--color-text-secondary); }

  .polish-cell.r-3.c-1 { border-top: 3px solid var(--color-text-secondary); border-right: 3px solid var(--color-text-secondary); }
  .polish-cell.r-3.c-2 { border-top: 3px solid var(--color-text-secondary); border-left: 3px solid var(--color-text-secondary); border-right: 3px solid var(--color-text-secondary); }
  .polish-cell.r-3.c-3 { border-top: 3px solid var(--color-text-secondary); border-left: 3px solid var(--color-text-secondary); }

  .polish-cell.cell-active {
    background-color: var(--color-accent-primary-subtle);
  }

  .letter-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: transparent;
    border: none;
    border-radius: var(--radius-xs);
    color: var(--color-text-primary);
    cursor: pointer;
    touch-action: none;
    padding: 1px 0;
    transition: background-color 0.08s ease, transform 0.08s ease;
  }

  .letter-btn:active {
    background-color: var(--color-accent-primary-subtle);
    transform: scale(0.92);
  }

  .letter-btn.is-highlighted {
    background-color: var(--color-accent-primary-subtle);
    border: 1px solid var(--color-accent-primary);
    color: var(--color-text-primary);
    font-weight: 800;
    border-radius: var(--radius-xs);
  }

  .letter-btn.is-highlighted .dot {
    color: var(--color-accent-primary);
  }

  .char-symbol {
    font-size: var(--text-base);
    font-weight: 700;
    font-family: var(--font-mono);
    line-height: 1;
  }

  .char-symbol.is-space-symbol {
    color: var(--color-text-secondary);
  }

  .dot-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 8px;
    margin-top: 1px;
  }

  .dot {
    font-size: var(--text-sm);
    font-weight: 900;
    letter-spacing: -1px;
    line-height: 1;
    color: var(--color-text-secondary);
  }

  .letter-placeholder {
    width: 100%;
    height: 100%;
  }

  /* --- Pigpen (Sjednocené SVG plátno) --- */
  .pigpen-board-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    touch-action: none;
  }

  .pigpen-board-svg {
    width: 100%;
    max-width: 320px;
    height: auto;
    display: block;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }

  .pigpen-cell {
    cursor: pointer;
    outline: none;
    -webkit-tap-highlight-color: transparent;
  }

  .cell-hitarea {
    fill: rgba(0, 0, 0, 0.001);
    pointer-events: all;
    transition: fill 0.08s ease;
  }

  .pigpen-cell:active .cell-hitarea,
  .pigpen-cell.is-active .cell-hitarea {
    fill: var(--color-accent-primary-subtle);
  }

  .cell-content {
    transition: transform 0.08s ease;
    pointer-events: none;
  }

  .pigpen-cell:active .cell-content,
  .pigpen-cell.is-active .cell-content {
    transform: scale(0.92);
  }

  .cell-char {
    font-size: var(--text-base);
    font-weight: 700;
    font-family: var(--font-mono);
    fill: var(--color-text-primary);
    text-anchor: middle;
    dominant-baseline: central;
    pointer-events: none;
  }

  .cell-dot {
    fill: var(--color-text-primary);
    pointer-events: none;
  }

  .pigpen-line {
    stroke: var(--color-text-secondary);
    stroke-width: 2.5px;
    stroke-linecap: round;
    pointer-events: none;
  }
</style>
