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
    polybiusSize?: number;
    polybiusCoordLabels?: 'numbers' | 'letters';
    onLetterSelect: (char: string) => void;
    onCoordSelect?: (axis: 1 | 2, val: number) => void;
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
    polybiusSize = 5,
    polybiusCoordLabels = 'numbers',
    onLetterSelect,
    onCoordSelect,
    onPhoneKeyTap,
    onPhoneKeyLongPress
  }: Props = $props();

  const polybiusIndices = $derived(Array.from({ length: polybiusSize }, (_, i) => i + 1));

  function getCoordLabel(index: number): string {
    if (polybiusCoordLabels === 'letters') {
      return String.fromCharCode(65 + index - 1);
    }
    return String(index);
  }

  function handleCoordPointerDown(e: PointerEvent, axis: 1 | 2, val: number) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    settings.vibrate(18);
    onCoordSelect?.(axis, val);
  }

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

  let activePigpenChar = $state<string | null>(null);
  let pigpenClearTimeout: ReturnType<typeof setTimeout> | null = null;

  function clearPigpenTimeout() {
    if (pigpenClearTimeout) {
      clearTimeout(pigpenClearTimeout);
      pigpenClearTimeout = null;
    }
  }

  function triggerEnclosureAnimation(target: HTMLElement | SVGElement) {
    const cell = target.closest(
      '.polish-cell, .mini-cell, .sp-cell, .sp-wedge, .phone-key-btn, .pigpen-cell, .polybius-cell, .polybius-char-btn, .polybius-header-btn'
    ) as HTMLElement | SVGElement | null;
    if (!cell) return;

    const keyframes = cell instanceof SVGElement
      ? [
          { filter: 'none' },
          { filter: 'drop-shadow(0 0 6px rgba(0, 210, 255, 0.6))', offset: 0.35 },
          { filter: 'none' }
        ]
      : [
          { borderColor: 'var(--color-text-secondary)', filter: 'none' },
          { borderColor: 'var(--color-accent-primary)', filter: 'drop-shadow(0 0 6px rgba(0, 210, 255, 0.6))', offset: 0.35 },
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
    } else if (crossType === 'polybius') {
      const cell = containerEl.querySelector(`.polybius-cell.r-${a1}.c-${a2}`) as HTMLElement | null;
      if (cell) {
        triggerEnclosureAnimation(cell);
        const btn = cell.querySelector('.polybius-char-btn') as HTMLElement | null;
        if (btn) {
          btn.animate(
            [
              { backgroundColor: 'var(--color-accent-primary)', color: '#000000', transform: 'scale(1.2)', boxShadow: '0 0 16px rgba(0, 210, 255, 0.9)' },
              { backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text-primary)', transform: 'scale(1)', boxShadow: 'none' }
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
    activePigpenChar = char;
    clearPigpenTimeout();
    pigpenClearTimeout = setTimeout(() => {
      activePigpenChar = null;
    }, 140);
    triggerEnclosureAnimation(e.currentTarget as HTMLElement | SVGElement);
    onLetterSelect(char);
  }

  function handleLetterPointerUp() {
    activePigpenChar = null;
    clearPigpenTimeout();
  }

  function handleLetterKeyDown(e: KeyboardEvent, char: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      settings.vibrate(18);
      onLetterSelect(char);
    }
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
    clearPigpenTimeout();
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
    <!-- Pigpen (Malý polský kříž): Sjednocené SVG plátno pro 3×3 mřížky i 2×2 šikmé kříže -->
    <div class="pigpen-board-wrapper">
      <!-- Hlavička sloupců: Bez tečky | S tečkou -->
      <div class="sp-headers-row">
        <div class="sp-col-header">
          <span class="sp-col-title">Bez tečky</span>
        </div>
        <div class="sp-col-header">
          <span class="sp-col-title">S tečkou</span>
          <span class="sp-dot-badge" aria-hidden="true"></span>
        </div>
      </div>

      <!-- Sjednocené SVG plátno (identické měřítko teček r=2.5 a nulové přesahy) -->
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
        <!-- ==================== 1. HITAREAS & OBSAH (BUŇKY) ==================== -->

        <!-- --- 3x3 Mřížka Col 1 (A–I, bez tečky) --- -->
        {#each [0, 1, 2] as r}
          {#each [0, 1, 2] as c}
            {@const char = smallPolishLetters[r * 3 + c]}
            {@const x = 4 + c * 48}
            {@const y = 4 + r * 48}
            {@const cx = x + 24}
            {@const cy = y + 24}
            <g
              class="pigpen-cell"
              class:is-active={activePigpenChar === char}
              role="button"
              tabindex="0"
              aria-label={`Písmeno ${char}`}
              onpointerdown={(e) => handleLetterPointerDown(e, char)}
              onkeydown={(e) => handleLetterKeyDown(e, char)}
              oncontextmenu={(e) => e.preventDefault()}
            >
              <rect {x} {y} width="48" height="48" class="cell-hitarea" />
              <g class="cell-content" style="transform-origin: {cx}px {cy}px;">
                <text x={cx} y={cy} class="cell-char">{char}</text>
              </g>
            </g>
          {/each}
        {/each}

        <!-- --- 3x3 Mřížka Col 2 (J–R, s tečkou) --- -->
        {#each [0, 1, 2] as r}
          {#each [0, 1, 2] as c}
            {@const char = smallPolishLetters[9 + r * 3 + c]}
            {@const x = 164 + c * 48}
            {@const y = 4 + r * 48}
            {@const cx = x + 24}
            {@const cy = y + 24}
            <g
              class="pigpen-cell"
              class:is-active={activePigpenChar === char}
              role="button"
              tabindex="0"
              aria-label={`Písmeno ${char}`}
              onpointerdown={(e) => handleLetterPointerDown(e, char)}
              onkeydown={(e) => handleLetterKeyDown(e, char)}
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

        <!-- --- 2x2 Šikmý kříž Col 1 (S–V, bez tečky) --- -->
        <!-- Wedge Top (S) -->
        <g
          class="pigpen-cell"
          class:is-active={activePigpenChar === smallPolishLetters[18]}
          role="button"
          tabindex="0"
          aria-label={`Písmeno ${smallPolishLetters[18]}`}
          onpointerdown={(e) => handleLetterPointerDown(e, smallPolishLetters[18])}
          onkeydown={(e) => handleLetterKeyDown(e, smallPolishLetters[18])}
          oncontextmenu={(e) => e.preventDefault()}
        >
          <polygon points="28,164 124,164 76,212" class="cell-hitarea" />
          <g class="cell-content" style="transform-origin: 76px 188px;">
            <text x="76" y="188" class="cell-char">{smallPolishLetters[18]}</text>
          </g>
        </g>

        <!-- Wedge Left (T) -->
        <g
          class="pigpen-cell"
          class:is-active={activePigpenChar === smallPolishLetters[19]}
          role="button"
          tabindex="0"
          aria-label={`Písmeno ${smallPolishLetters[19]}`}
          onpointerdown={(e) => handleLetterPointerDown(e, smallPolishLetters[19])}
          onkeydown={(e) => handleLetterKeyDown(e, smallPolishLetters[19])}
          oncontextmenu={(e) => e.preventDefault()}
        >
          <polygon points="28,164 76,212 28,260" class="cell-hitarea" />
          <g class="cell-content" style="transform-origin: 52px 212px;">
            <text x="52" y="212" class="cell-char">{smallPolishLetters[19]}</text>
          </g>
        </g>

        <!-- Wedge Right (U) -->
        <g
          class="pigpen-cell"
          class:is-active={activePigpenChar === smallPolishLetters[20]}
          role="button"
          tabindex="0"
          aria-label={`Písmeno ${smallPolishLetters[20]}`}
          onpointerdown={(e) => handleLetterPointerDown(e, smallPolishLetters[20])}
          onkeydown={(e) => handleLetterKeyDown(e, smallPolishLetters[20])}
          oncontextmenu={(e) => e.preventDefault()}
        >
          <polygon points="124,164 76,212 124,260" class="cell-hitarea" />
          <g class="cell-content" style="transform-origin: 100px 212px;">
            <text x="100" y="212" class="cell-char">{smallPolishLetters[20]}</text>
          </g>
        </g>

        <!-- Wedge Bottom (V) -->
        <g
          class="pigpen-cell"
          class:is-active={activePigpenChar === smallPolishLetters[21]}
          role="button"
          tabindex="0"
          aria-label={`Písmeno ${smallPolishLetters[21]}`}
          onpointerdown={(e) => handleLetterPointerDown(e, smallPolishLetters[21])}
          onkeydown={(e) => handleLetterKeyDown(e, smallPolishLetters[21])}
          oncontextmenu={(e) => e.preventDefault()}
        >
          <polygon points="28,260 76,212 124,260" class="cell-hitarea" />
          <g class="cell-content" style="transform-origin: 76px 236px;">
            <text x="76" y="236" class="cell-char">{smallPolishLetters[21]}</text>
          </g>
        </g>

        <!-- --- 2x2 Šikmý kříž Col 2 (W–Z, s tečkou) --- -->
        <!-- Wedge Top (W) -->
        <g
          class="pigpen-cell"
          class:is-active={activePigpenChar === smallPolishLetters[22]}
          role="button"
          tabindex="0"
          aria-label={`Písmeno ${smallPolishLetters[22]}`}
          onpointerdown={(e) => handleLetterPointerDown(e, smallPolishLetters[22])}
          onkeydown={(e) => handleLetterKeyDown(e, smallPolishLetters[22])}
          oncontextmenu={(e) => e.preventDefault()}
        >
          <polygon points="188,164 284,164 236,212" class="cell-hitarea" />
          <g class="cell-content" style="transform-origin: 236px 188px;">
            <text x="236" y="182" class="cell-char">{smallPolishLetters[22]}</text>
            <circle cx="236" cy="197" r="2.5" class="cell-dot" />
          </g>
        </g>

        <!-- Wedge Left (X) -->
        <g
          class="pigpen-cell"
          class:is-active={activePigpenChar === smallPolishLetters[23]}
          role="button"
          tabindex="0"
          aria-label={`Písmeno ${smallPolishLetters[23]}`}
          onpointerdown={(e) => handleLetterPointerDown(e, smallPolishLetters[23])}
          onkeydown={(e) => handleLetterKeyDown(e, smallPolishLetters[23])}
          oncontextmenu={(e) => e.preventDefault()}
        >
          <polygon points="188,164 236,212 188,260" class="cell-hitarea" />
          <g class="cell-content" style="transform-origin: 212px 212px;">
            <text x="206" y="212" class="cell-char">{smallPolishLetters[23]}</text>
            <circle cx="221" cy="212" r="2.5" class="cell-dot" />
          </g>
        </g>

        <!-- Wedge Right (Y) -->
        <g
          class="pigpen-cell"
          class:is-active={activePigpenChar === smallPolishLetters[24]}
          role="button"
          tabindex="0"
          aria-label={`Písmeno ${smallPolishLetters[24]}`}
          onpointerdown={(e) => handleLetterPointerDown(e, smallPolishLetters[24])}
          onkeydown={(e) => handleLetterKeyDown(e, smallPolishLetters[24])}
          oncontextmenu={(e) => e.preventDefault()}
        >
          <polygon points="284,164 236,212 284,260" class="cell-hitarea" />
          <g class="cell-content" style="transform-origin: 260px 212px;">
            <circle cx="251" cy="212" r="2.5" class="cell-dot" />
            <text x="266" y="212" class="cell-char">{smallPolishLetters[24]}</text>
          </g>
        </g>

        <!-- Wedge Bottom (Z) -->
        <g
          class="pigpen-cell"
          class:is-active={activePigpenChar === smallPolishLetters[25]}
          role="button"
          tabindex="0"
          aria-label={`Písmeno ${smallPolishLetters[25]}`}
          onpointerdown={(e) => handleLetterPointerDown(e, smallPolishLetters[25])}
          onkeydown={(e) => handleLetterKeyDown(e, smallPolishLetters[25])}
          oncontextmenu={(e) => e.preventDefault()}
        >
          <polygon points="188,260 236,212 284,260" class="cell-hitarea" />
          <g class="cell-content" style="transform-origin: 236px 236px;">
            <circle cx="236" cy="227" r="2.5" class="cell-dot" />
            <text x="236" y="242" class="cell-char">{smallPolishLetters[25]}</text>
          </g>
        </g>

        <!-- ==================== 2. DĚLICÍ ČÁRY (KRESLENÉ NAHOŘE) ==================== -->
        <!-- 3x3 Mřížka Col 1 -->
        <line x1="52" y1="4" x2="52" y2="148" class="pigpen-line" />
        <line x1="100" y1="4" x2="100" y2="148" class="pigpen-line" />
        <line x1="4" y1="52" x2="148" y2="52" class="pigpen-line" />
        <line x1="4" y1="100" x2="148" y2="100" class="pigpen-line" />

        <!-- 3x3 Mřížka Col 2 -->
        <line x1="212" y1="4" x2="212" y2="148" class="pigpen-line" />
        <line x1="260" y1="4" x2="260" y2="148" class="pigpen-line" />
        <line x1="164" y1="52" x2="308" y2="52" class="pigpen-line" />
        <line x1="164" y1="100" x2="308" y2="100" class="pigpen-line" />

        <!-- 2x2 Šikmý kříž Col 1 -->
        <line x1="28" y1="164" x2="124" y2="260" class="pigpen-line" />
        <line x1="124" y1="164" x2="28" y2="260" class="pigpen-line" />

        <!-- 2x2 Šikmý kříž Col 2 -->
        <line x1="188" y1="164" x2="284" y2="260" class="pigpen-line" />
        <line x1="284" y1="164" x2="188" y2="260" class="pigpen-line" />
      </svg>
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

  {:else if crossType === 'polybius'}
    <!-- Polybiův čtverec (5×5 nebo 6×6 s interaktivními souřadnicovými tlačítky v záhlaví) -->
    <div class="polybius-board-wrapper" class:size-6={polybiusSize === 6}>
      <div
        class="polybius-grid"
        style:grid-template-columns="32px repeat({polybiusSize}, 1fr)"
      >
        <!-- Top header row: empty corner cell + interactive col header buttons -->
        <div class="polybius-corner-cell" aria-hidden="true"></div>
        {#each polybiusIndices as c}
          {@const isColActive = selectedAxis2 === c}
          <button
            type="button"
            class="polybius-header-btn col-header-btn"
            class:is-active={isColActive}
            onpointerdown={(e) => handleCoordPointerDown(e, 2, c)}
            aria-label={`Sloupec ${getCoordLabel(c)}`}
          >
            <span>{getCoordLabel(c)}</span>
          </button>
        {/each}

        <!-- Grid rows: interactive row header button + letter cells -->
        {#each polybiusIndices as r}
          {@const isRowActive = selectedAxis1 === r}
          <button
            type="button"
            class="polybius-header-btn row-header-btn"
            class:is-active={isRowActive}
            onpointerdown={(e) => handleCoordPointerDown(e, 1, r)}
            aria-label={`Řádek ${getCoordLabel(r)}`}
          >
            <span>{getCoordLabel(r)}</span>
          </button>
          {#each polybiusIndices as c}
            {@const idx = (r - 1) * polybiusSize + (c - 1)}
            {@const char = letters[idx] ?? ''}
            {@const isExact = selectedAxis1 === r && selectedAxis2 === c}
            {@const isHighlighted = (selectedAxis1 === r || selectedAxis2 === c) && (selectedAxis1 !== null || selectedAxis2 !== null)}
            <div
              class="polybius-cell r-{r} c-{c}"
              class:is-row-matched={selectedAxis1 === r}
              class:is-col-matched={selectedAxis2 === c}
              class:is-exact-matched={isExact}
            >
              {#if char}
                <button
                  type="button"
                  class="polybius-char-btn"
                  class:is-highlighted={isHighlighted}
                  class:is-exact={isExact}
                  onpointerdown={(e) => handleLetterPointerDown(e, char)}
                  aria-label={`Písmeno ${char}, řádek ${getCoordLabel(r)}, sloupec ${getCoordLabel(c)}`}
                >
                  <span class="polybius-char">{char}</span>
                </button>
              {:else}
                <div class="polybius-empty-cell"></div>
              {/if}
            </div>
          {/each}
        {/each}
      </div>
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

  /* --- Pigpen (Sjednocené SVG plátno) --- */
  .pigpen-board-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    padding: var(--space-lg) 0 var(--space-xl);
    gap: var(--space-sm);
    box-sizing: border-box;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    touch-action: none;
  }

  .sp-headers-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    width: 100%;
    padding: 0 4px;
    box-sizing: border-box;
  }

  .sp-col-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    width: 100%;
  }

  .sp-col-title {
    font-size: var(--text-2xs);
    font-weight: 700;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .sp-dot-badge {
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background-color: var(--color-accent-primary);
    flex-shrink: 0;
  }

  .pigpen-board-svg {
    width: 100%;
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
    font-size: 16px;
    font-weight: 700;
    font-family: var(--font-mono);
    fill: var(--color-text-primary);
    text-anchor: middle;
    dominant-baseline: central;
    pointer-events: none;
  }

  .cell-dot {
    fill: var(--color-accent-primary);
    pointer-events: none;
  }

  .pigpen-line {
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

  /* Polybiův čtverec */
  .polybius-board-wrapper {
    width: 100%;
    max-width: 360px;
    margin: 0 auto;
    padding: 0 4px;
    box-sizing: border-box;
  }

  .polybius-board-wrapper.size-6 {
    max-width: 390px;
  }

  .polybius-grid {
    display: grid;
    gap: 3px;
    width: 100%;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
  }


  .polybius-header-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs);
    font-size: var(--text-xs);
    font-weight: 700;
    font-family: var(--font-mono);
    color: var(--color-text-secondary);
    cursor: pointer;
    touch-action: none;
    transition: all 0.12s ease;
    padding: 0;
  }

  .polybius-header-btn:active {
    transform: scale(0.92);
  }

  .polybius-header-btn.col-header-btn {
    min-height: 32px;
    height: 32px;
    margin-bottom: 2px;
  }

  .polybius-header-btn.row-header-btn {
    min-width: 32px;
    width: 32px;
    height: 100%;
    margin-right: 2px;
  }

  .polybius-header-btn.is-active {
    background: var(--color-accent-primary);
    color: #000000;
    border-color: var(--color-accent-primary);
    font-weight: 800;
    box-shadow: 0 0 8px rgba(0, 210, 255, 0.4);
  }

  .polybius-cell {
    display: flex;
    aspect-ratio: 1 / 1;
    min-width: 0;
    min-height: 0;
    border-radius: var(--radius-xs);
    transition: all 0.15s ease;
  }

  .polybius-cell.is-row-matched,
  .polybius-cell.is-col-matched {
    background: rgba(0, 210, 255, 0.06);
  }

  .polybius-cell.is-exact-matched {
    background: rgba(0, 210, 255, 0.16);
  }

  .polybius-char-btn {
    width: 100%;
    height: 100%;
    min-height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs);
    color: var(--color-text-primary);
    font-size: clamp(14px, 2.3vh, 18px);
    font-weight: 700;
    cursor: pointer;
    touch-action: none;
    transition: all 0.15s ease;
    padding: 0;
  }

  .polybius-char-btn:active {
    transform: scale(0.92);
  }

  .polybius-char-btn.is-highlighted {
    border-color: rgba(0, 210, 255, 0.45);
    color: var(--color-text-primary);
  }

  .polybius-char-btn.is-exact {
    background: rgba(0, 210, 255, 0.22);
    border-color: var(--color-accent-primary);
    color: var(--color-accent-primary);
    box-shadow: 0 0 10px rgba(0, 210, 255, 0.4);
  }

  .polybius-empty-cell {
    width: 100%;
    height: 100%;
    border-radius: var(--radius-xs);
    background: rgba(255, 255, 255, 0.02);
  }
</style>
