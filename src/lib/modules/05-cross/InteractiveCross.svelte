<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { CrossType } from './crossData';
  import { coordinatesToIndex, getPhoneKeyLetters } from './crossSolver';
  import { settings } from '../../state/settings.svelte';

  interface Props {
    crossType: CrossType;
    letters: string[];
    selectedAxis1: number | null;
    selectedAxis2: number | null;
    selectedAxis3: number | null;
    pendingKey?: string | null;
    pendingTapIndex?: number;
    onLetterSelect: (char: string) => void;
    onPhoneKeyTap?: (keyId: string) => void;
    onPhoneKeyLongPress?: (keyId: string) => void;
  }

  let {
    crossType,
    letters,
    selectedAxis1,
    selectedAxis2,
    selectedAxis3,
    pendingKey = null,
    pendingTapIndex = 0,
    onLetterSelect,
    onPhoneKeyTap,
    onPhoneKeyLongPress
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
  let activePhonePressKey: string | null = null;
  let isPhoneLongPressTriggered = false;
  let phonePressTimer: ReturnType<typeof setTimeout> | null = null;

  function clearPhonePressTimer() {
    if (phonePressTimer) {
      clearTimeout(phonePressTimer);
      phonePressTimer = null;
    }
  }

  function triggerEnclosureAnimation(target: HTMLElement) {
    const cell = target.closest(
      '.polish-cell, .mini-cell, .sp-cell, .sp-wedge, .phone-key-btn'
    ) as HTMLElement | null;
    if (!cell) return;

    cell.animate(
      [
        { borderColor: 'var(--color-text-secondary)', filter: 'none' },
        { borderColor: 'var(--color-accent-primary)', filter: 'drop-shadow(0 0 6px rgba(0, 210, 255, 0.6))', offset: 0.35 },
        { borderColor: 'var(--color-text-secondary)', filter: 'none' }
      ],
      {
        duration: 400,
        easing: 'ease-in-out'
      }
    );
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
            { backgroundColor: 'var(--color-accent-primary)', color: '#000000', transform: 'scale(1.22)', boxShadow: '0 0 16px rgba(0, 210, 255, 0.9)' },
            { backgroundColor: 'transparent', color: 'var(--color-text-primary)', transform: 'scale(1)', boxShadow: 'none' }
          ],
          { duration: 520, easing: 'ease-out' }
        );
      }
    } else if (crossType === 'small-polish') {
      const cell = containerEl.querySelector(`.small-polish-tables .table-block:nth-child(${a1}) .mini-cell.r-${a2}.c-${a3}`) as HTMLElement | null;
      if (cell) {
        triggerEnclosureAnimation(cell);
        const btn = cell.querySelector('button') as HTMLElement | null;
        if (btn) {
          btn.animate(
            [
              { backgroundColor: 'var(--color-accent-primary)', color: '#000000', transform: 'scale(1.22)', boxShadow: '0 0 16px rgba(0, 210, 255, 0.9)' },
              { backgroundColor: 'transparent', color: 'var(--color-text-primary)', transform: 'scale(1)', boxShadow: 'none' }
            ],
            { duration: 520, easing: 'ease-out' }
          );
        }
      }
    }
  }

  function handleLetterPointerDown(e: PointerEvent, char: string) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    settings.vibrate(18);
    triggerEnclosureAnimation(e.currentTarget as HTMLElement);
    onLetterSelect(char);
  }

  function handlePhonePointerDown(e: PointerEvent, keyId: string) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    clearPhonePressTimer();

    activePhonePressKey = keyId;
    isPhoneLongPressTriggered = false;

    const target = e.currentTarget as HTMLElement;

    phonePressTimer = setTimeout(() => {
      isPhoneLongPressTriggered = true;
      settings.vibrate([20, 35]);
      triggerEnclosureAnimation(target);
      onPhoneKeyLongPress?.(keyId);
    }, 420);
  }

  function handlePhonePointerUp(e: PointerEvent, keyId: string) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();

    const wasLongPress = isPhoneLongPressTriggered;
    clearPhonePressTimer();

    if (!wasLongPress && activePhonePressKey === keyId) {
      settings.vibrate(18);
      triggerEnclosureAnimation(e.currentTarget as HTMLElement);
      onPhoneKeyTap?.(keyId);
    }

    activePhonePressKey = null;
    isPhoneLongPressTriggered = false;
  }

  function handlePhonePointerCancel(e: PointerEvent) {
    clearPhonePressTimer();
    activePhonePressKey = null;
    isPhoneLongPressTriggered = false;
  }

  function isLetterHighlighted(a1: number, a2: number, a3: number): boolean {
    if (crossType === 'large-polish') {
      // In large polish cross, only highlight specific letter pills when axis3 (position/dot) is active
      // or when all 3 axes match. Rows and columns are smoothly highlighted on cell level.
      if (selectedAxis3 !== null) {
        if (selectedAxis3 !== a3) return false;
        if (selectedAxis1 !== null && selectedAxis1 !== a1) return false;
        if (selectedAxis2 !== null && selectedAxis2 !== a2) return false;
        return true;
      }
      return false;
    }

    if (crossType === 'small-polish') {
      if (selectedAxis1 !== null && selectedAxis1 !== a1) return false;
      if (selectedAxis2 !== null && selectedAxis2 !== a2) return false;
      if (selectedAxis3 !== null && selectedAxis3 !== a3) return false;
      return selectedAxis1 !== null || selectedAxis2 !== null || selectedAxis3 !== null;
    }

    return false;
  }

  function getPolishChar(a1: number, a2: number, a3: number): string {
    const idx = coordinatesToIndex(crossType, a1, a2, a3);
    if (idx === null) return '';
    if (crossType === 'large-polish' && letters.length === 26 && idx === 26) {
      return ' ';
    }
    if (idx < 0 || idx >= letters.length) return '';
    return letters[idx] ?? '';
  }

  const PHONE_GRID_3X4 = [
    { digit: '1', keyId: '1' },
    { digit: '2', keyId: '2' },
    { digit: '3', keyId: '3' },
    { digit: '4', keyId: '4' },
    { digit: '5', keyId: '5' },
    { digit: '6', keyId: '6' },
    { digit: '7', keyId: '7' },
    { digit: '8', keyId: '8' },
    { digit: '9', keyId: '9' },
    { digit: '*', keyId: '*' },
    { digit: '0', keyId: '0' },
    { digit: '#', keyId: '#' }
  ];

  onDestroy(() => {
    clearPhonePressTimer();
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={containerEl}
  class="interactive-cross-container"
  oncontextmenu={(e) => e.preventDefault()}
>
  {#if crossType === 'large-polish'}
    <!-- Velký polský kříž (9 nezávislých chlívků se specifickými ohrádkami a mezerami) -->
    <div class="polish-grid-3x3">
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
              {@const char = getPolishChar(r, c, p)}
              {@const isSelected = isLetterHighlighted(r, c, p)}
              {@const displaySymbol = char === ' ' ? '␣' : char}
              {#if char}
                <button
                  type="button"
                  data-pos={p}
                  class="letter-btn"
                  class:is-highlighted={isSelected}
                  class:is-space-btn={char === ' '}
                  onpointerdown={(e) => handleLetterPointerDown(e, char)}
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

  {:else if crossType === 'small-polish'}
    <!-- Malý polský kříž: 2 sloupce (Bez tečky | S tečkou), každý má 3×3 mřížku a 2×2 šikmý kříž -->
    <div class="small-polish-container">
      <!-- Sloupec 1: Bez tečky -->
      <div class="sp-column">
        <div class="sp-col-header">
          <span class="sp-col-title">Bez tečky</span>
        </div>

        <!-- 3x3 Mřížka bez tečky (A–I) -->
        <div class="sp-grid-3x3">
          {#each [1, 2, 3] as r}
            {#each [1, 2, 3] as c}
              {@const char = smallPolishLetters[(r - 1) * 3 + (c - 1)]}
              <button
                type="button"
                class="sp-cell r-{r} c-{c}"
                onpointerdown={(e) => handleLetterPointerDown(e, char)}
              >
                <span class="sp-cell-inner">
                  <span class="sp-char">{char}</span>
                </span>
              </button>
            {/each}
          {/each}
        </div>

        <!-- 2x2 Šikmý kříž bez tečky (S, T, U, V) -->
        <div class="sp-cross-x">
          <svg viewBox="0 0 140 115" class="sp-x-svg">
            <!-- Wedge Top (S) -->
            <g
              class="sp-wedge"
              role="button"
              tabindex="0"
              onpointerdown={(e) => handleLetterPointerDown(e, smallPolishLetters[18])}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onLetterSelect(smallPolishLetters[18]);
                }
              }}
            >
              <polygon points="0,0 140,0 70,57.5" class="wedge-hitarea" />
              <g class="sp-wedge-content">
                <text x="70" y="26" class="sp-wedge-char">{smallPolishLetters[18]}</text>
              </g>
            </g>
            <!-- Wedge Left (T) -->
            <g
              class="sp-wedge"
              role="button"
              tabindex="0"
              onpointerdown={(e) => handleLetterPointerDown(e, smallPolishLetters[19])}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onLetterSelect(smallPolishLetters[19]);
                }
              }}
            >
              <polygon points="0,0 70,57.5 0,115" class="wedge-hitarea" />
              <g class="sp-wedge-content">
                <text x="28" y="57.5" class="sp-wedge-char">{smallPolishLetters[19]}</text>
              </g>
            </g>
            <!-- Wedge Right (U) -->
            <g
              class="sp-wedge"
              role="button"
              tabindex="0"
              onpointerdown={(e) => handleLetterPointerDown(e, smallPolishLetters[20])}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onLetterSelect(smallPolishLetters[20]);
                }
              }}
            >
              <polygon points="140,0 140,115 70,57.5" class="wedge-hitarea" />
              <g class="sp-wedge-content">
                <text x="112" y="57.5" class="sp-wedge-char">{smallPolishLetters[20]}</text>
              </g>
            </g>
            <!-- Wedge Bottom (V) -->
            <g
              class="sp-wedge"
              role="button"
              tabindex="0"
              onpointerdown={(e) => handleLetterPointerDown(e, smallPolishLetters[21])}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onLetterSelect(smallPolishLetters[21]);
                }
              }}
            >
              <polygon points="0,115 140,115 70,57.5" class="wedge-hitarea" />
              <g class="sp-wedge-content">
                <text x="70" y="89" class="sp-wedge-char">{smallPolishLetters[21]}</text>
              </g>
            </g>
            <!-- Diagonal crossing lines -->
            <line x1="8" y1="6.5" x2="132" y2="108.5" class="sp-x-line" />
            <line x1="132" y1="6.5" x2="8" y2="108.5" class="sp-x-line" />
          </svg>
        </div>
      </div>

      <!-- Sloupec 2: S tečkou -->
      <div class="sp-column">
        <div class="sp-col-header">
          <span class="sp-col-title">S tečkou</span>
          <span class="sp-dot-badge">•</span>
        </div>

        <!-- 3x3 Mřížka s tečkou (J–R) -->
        <div class="sp-grid-3x3">
          {#each [1, 2, 3] as r}
            {#each [1, 2, 3] as c}
              {@const char = smallPolishLetters[9 + (r - 1) * 3 + (c - 1)]}
              <button
                type="button"
                class="sp-cell r-{r} c-{c} has-dot"
                onpointerdown={(e) => handleLetterPointerDown(e, char)}
              >
                <span class="sp-cell-inner">
                  <span class="sp-char">{char}</span>
                  <span class="sp-dot">•</span>
                </span>
              </button>
            {/each}
          {/each}
        </div>

        <!-- 2x2 Šikmý kříž s tečkou (W, X, Y, Z) -->
        <div class="sp-cross-x">
          <svg viewBox="0 0 140 115" class="sp-x-svg">
            <!-- Wedge Top (W) -->
            <g
              class="sp-wedge"
              role="button"
              tabindex="0"
              onpointerdown={(e) => handleLetterPointerDown(e, smallPolishLetters[22])}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onLetterSelect(smallPolishLetters[22]);
                }
              }}
            >
              <polygon points="0,0 140,0 70,57.5" class="wedge-hitarea" />
              <g class="sp-wedge-content">
                <text x="70" y="22" class="sp-wedge-char">{smallPolishLetters[22]}</text>
                <circle cx="70" cy="38" r="3.2" class="sp-wedge-dot" />
              </g>
            </g>
            <!-- Wedge Left (X) -->
            <g
              class="sp-wedge"
              role="button"
              tabindex="0"
              onpointerdown={(e) => handleLetterPointerDown(e, smallPolishLetters[23])}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onLetterSelect(smallPolishLetters[23]);
                }
              }}
            >
              <polygon points="0,0 70,57.5 0,115" class="wedge-hitarea" />
              <g class="sp-wedge-content">
                <text x="22" y="57.5" class="sp-wedge-char">{smallPolishLetters[23]}</text>
                <circle cx="42" cy="57.5" r="3.2" class="sp-wedge-dot" />
              </g>
            </g>
            <!-- Wedge Right (Y) -->
            <g
              class="sp-wedge"
              role="button"
              tabindex="0"
              onpointerdown={(e) => handleLetterPointerDown(e, smallPolishLetters[24])}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onLetterSelect(smallPolishLetters[24]);
                }
              }}
            >
              <polygon points="140,0 140,115 70,57.5" class="wedge-hitarea" />
              <g class="sp-wedge-content">
                <text x="118" y="57.5" class="sp-wedge-char">{smallPolishLetters[24]}</text>
                <circle cx="98" cy="57.5" r="3.2" class="sp-wedge-dot" />
              </g>
            </g>
            <!-- Wedge Bottom (Z) -->
            <g
              class="sp-wedge"
              role="button"
              tabindex="0"
              onpointerdown={(e) => handleLetterPointerDown(e, smallPolishLetters[25])}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onLetterSelect(smallPolishLetters[25]);
                }
              }}
            >
              <polygon points="0,115 140,115 70,57.5" class="wedge-hitarea" />
              <g class="sp-wedge-content">
                <text x="70" y="93" class="sp-wedge-char">{smallPolishLetters[25]}</text>
                <circle cx="70" cy="77" r="3.2" class="sp-wedge-dot" />
              </g>
            </g>
            <!-- Diagonal crossing lines -->
            <line x1="8" y1="6.5" x2="132" y2="108.5" class="sp-x-line" />
            <line x1="132" y1="6.5" x2="8" y2="108.5" class="sp-x-line" />
          </svg>
        </div>
      </div>
    </div>

  {:else if crossType === 'mobile-keypad'}
    <!-- Mobilní klávesnice 3x4 (100% šířka, klepnutí = multi-tap, podržení = číslo) -->
    <div class="phone-keypad-grid-3x4">
      {#each PHONE_GRID_3X4 as item}
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
              <span
                class="phone-sub-char"
                class:is-active-char={isActiveKey && pendingTapIndex === 0}
              >
                ␣
              </span>
              <span
                class="phone-sub-char"
                class:is-active-char={isActiveKey && pendingTapIndex === 1}
              >
                0
              </span>
            {:else if keyLetters.length > 0}
              {#each keyLetters as ch, idx}
                <span
                  class="phone-sub-char"
                  class:is-active-char={isActiveKey && pendingTapIndex === idx}
                >
                  {ch}
                </span>
              {/each}
            {/if}
          </div>
        </button>
      {/each}
    </div>
  {/if}
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

  /* --- Velký polský kříž 3x3: 9 samostatných chlívků s mezerami --- */
  .polish-grid-3x3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, clamp(46px, 7.5vh, 58px));
    gap: 6px;
    width: 100%;
    background: transparent;
    padding: 0;
    touch-action: none;
  }

  /* Každý chlívek má pouze své vlastní specifické ohrádky */
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
    border-radius: var(--radius-xs);
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
    background-color: rgba(0, 210, 255, 0.22);
    border: 1px solid rgba(0, 210, 255, 0.55);
    color: var(--color-text-primary);
    font-weight: 800;
    border-radius: var(--radius-xs);
  }

  .letter-btn.is-highlighted .dot {
    color: var(--color-accent-primary);
  }

  .char-symbol {
    font-size: var(--text-lg);
    font-weight: 700;
    font-family: var(--font-mono);
    line-height: 1;
  }

  .char-symbol.is-space-symbol {
    color: var(--color-text-secondary);
    font-size: var(--text-base);
  }

  .dot-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 8px;
    margin-top: 1px;
  }

  .dot {
    font-size: 13px;
    font-weight: 900;
    letter-spacing: -1px;
    line-height: 1;
    color: var(--color-accent-primary);
  }

  .letter-placeholder {
    width: 100%;
    height: 100%;
  }

  /* --- Malý polský kříž (2 sloupce: Bez tečky | S tečkou) --- */
  .small-polish-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-md);
    width: 100%;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
  }

  .sp-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 100%;
  }

  .sp-col-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 100%;
    padding: 1px 0;
  }

  .sp-col-title {
    font-size: var(--text-2xs);
    font-weight: 700;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .sp-dot-badge {
    font-size: 13px;
    font-weight: 900;
    color: var(--color-accent-primary);
    line-height: 1;
  }

  /* 3x3 Mřížka */
  .sp-grid-3x3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, clamp(44px, 6.2vh, 48px));
    gap: 4px;
    width: 100%;
    box-sizing: border-box;
    touch-action: none;
  }

  .sp-cell {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    padding: 0;
    box-sizing: border-box;
    border: none;
    color: var(--color-text-primary);
    cursor: pointer;
    touch-action: none;
    border-radius: var(--radius-xs);
    transition: background-color 0.08s ease;
  }

  .sp-cell:active {
    background-color: var(--color-accent-primary-subtle);
  }

  .sp-cell-inner {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    transition: transform 0.08s ease;
    pointer-events: none;
  }

  .sp-cell:active .sp-cell-inner {
    transform: scale(0.92);
  }

  /* Ohrádky mřížky 3x3 */
  .sp-cell.r-1.c-1 { border-right: 2.5px solid var(--color-text-secondary); border-bottom: 2.5px solid var(--color-text-secondary); }
  .sp-cell.r-1.c-2 { border-left: 2.5px solid var(--color-text-secondary); border-right: 2.5px solid var(--color-text-secondary); border-bottom: 2.5px solid var(--color-text-secondary); }
  .sp-cell.r-1.c-3 { border-left: 2.5px solid var(--color-text-secondary); border-bottom: 2.5px solid var(--color-text-secondary); }

  .sp-cell.r-2.c-1 { border-top: 2.5px solid var(--color-text-secondary); border-bottom: 2.5px solid var(--color-text-secondary); border-right: 2.5px solid var(--color-text-secondary); }
  .sp-cell.r-2.c-2 { border: 2.5px solid var(--color-text-secondary); }
  .sp-cell.r-2.c-3 { border-top: 2.5px solid var(--color-text-secondary); border-bottom: 2.5px solid var(--color-text-secondary); border-left: 2.5px solid var(--color-text-secondary); }

  .sp-cell.r-3.c-1 { border-top: 2.5px solid var(--color-text-secondary); border-right: 2.5px solid var(--color-text-secondary); }
  .sp-cell.r-3.c-2 { border-top: 2.5px solid var(--color-text-secondary); border-left: 2.5px solid var(--color-text-secondary); border-right: 2.5px solid var(--color-text-secondary); }
  .sp-cell.r-3.c-3 { border-top: 2.5px solid var(--color-text-secondary); border-left: 2.5px solid var(--color-text-secondary); }

  .sp-char {
    font-size: var(--text-base);
    font-weight: 700;
    font-family: var(--font-mono);
    line-height: 1;
    pointer-events: none;
  }

  .sp-dot {
    font-size: 13px;
    font-weight: 900;
    color: var(--color-accent-primary);
    line-height: 1;
    pointer-events: none;
    margin-left: 1px;
  }

  /* 2x2 Šikmý kříž X */
  .sp-cross-x {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    touch-action: none;
  }

  .sp-x-svg {
    width: 100%;
    max-width: 145px;
    height: clamp(98px, 14.5vh, 115px);
    overflow: visible;
    user-select: none;
    -webkit-user-select: none;
  }

  .sp-wedge {
    cursor: pointer;
    touch-action: none;
    outline: none;
  }

  .wedge-hitarea {
    fill: transparent;
    transition: fill 0.08s ease;
  }

  .sp-wedge:active .wedge-hitarea {
    fill: var(--color-accent-primary-subtle);
  }

  .sp-wedge-content {
    transition: transform 0.08s ease;
    transform-origin: center;
    transform-box: fill-box;
    pointer-events: none;
  }

  .sp-wedge:active .sp-wedge-content {
    transform: scale(0.92);
  }

  .sp-wedge-char {
    font-family: var(--font-mono);
    font-size: 16px;
    font-weight: 700;
    fill: var(--color-text-primary);
    text-anchor: middle;
    dominant-baseline: central;
    pointer-events: none;
  }

  .sp-wedge-dot {
    fill: var(--color-accent-primary);
    pointer-events: none;
  }

  .sp-x-line {
    stroke: var(--color-text-secondary);
    stroke-width: 2.5px;
    stroke-linecap: round;
    pointer-events: none;
  }

  /* --- Mobilní klávesnice 3x4 (100% šířka) --- */
  .phone-keypad-grid-3x4 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(4, clamp(44px, 6.5vh, 54px));
    gap: 5px;
    width: 100%;
    box-sizing: border-box;
    touch-action: none;
  }

  .phone-key-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-2);
    border: 1.5px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    gap: 1px;
    padding: 3px 4px;
    box-sizing: border-box;
    cursor: pointer;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    transition: background-color 0.1s ease, border-color 0.1s ease, transform 0.06s ease, box-shadow 0.1s ease;
  }

  .phone-key-btn:active {
    transform: scale(0.95);
    background-color: var(--color-surface-active);
  }

  .phone-key-btn.is-active-key {
    background-color: var(--color-surface-active);
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 12px rgba(0, 210, 255, 0.35);
  }

  .phone-key-num {
    font-size: clamp(18px, 2.6vh, 22px);
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
    font-size: clamp(10px, 1.4vh, 11px);
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
</style>
