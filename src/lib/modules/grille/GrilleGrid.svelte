<script lang="ts">
  import Chassis from '../../components/ui/Chassis.svelte';
  import { isCenterCell, getRotatedHolesForStep } from './grilleSolver';
  import { ROTATION_COLORS } from './grilleData';
  import { settings } from '../../state/settings.svelte';

  /** The grille itself: the main input surface of the module, a tap toggles a hole. */
  interface Props {
    gridSize: number;
    gridMatrix: string[][];
    holes: string[];
    rotationCCW?: boolean;
    tapOrderReading?: boolean;
    onToggleHole: (r: number, c: number) => void;
  }

  let {
    gridSize,
    gridMatrix,
    holes,
    rotationCCW = false,
    tapOrderReading = false,
    onToggleHole
  }: Props = $props();

  interface CellOrbitState {
    step: number; // 0 = hole, 1 = 90°, 2 = 180°, 3 = 270°
    color: string;
    isHole: boolean;
  }

  // Precomputed orbit state for each cell (which rotation step will uncover it)
  const cellOrbitMap = $derived.by<Map<string, CellOrbitState>>(() => {
    const map = new Map<string, CellOrbitState>();
    const dir = rotationCCW ? 'ccw' : 'cw';

    for (let s = 0; s < 4; s++) {
      const stepHoles = getRotatedHolesForStep(holes, gridSize, s, dir);
      const color = ROTATION_COLORS[s].color;
      for (const key of stepHoles) {
        if (!map.has(key)) {
          map.set(key, {
            step: s,
            color,
            isHole: s === 0
          });
        }
      }
    }
    return map;
  });

  interface GridCellItem {
    r: number;
    c: number;
    key: string;
    token: string;
    isCenter: boolean;
    isHole: boolean;
    isLocked: boolean;
    stepColor: string | undefined;
    tapOrderIndex: number | null;
    ariaLabel: string;
  }

  // Precomputed flat cell list for fast, keyed rendering
  const cellList = $derived.by<GridCellItem[]>(() => {
    const list: GridCellItem[] = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const key = `${r},${c}`;
        const orbitInfo = cellOrbitMap.get(key);
        const isHole = orbitInfo?.isHole ?? false;
        const isLocked = orbitInfo ? !orbitInfo.isHole : false;
        const isCenter = isCenterCell(r, c, gridSize);
        const token = gridMatrix[r]?.[c] ?? '';

        let tapOrderIndex: number | null = null;
        if (isHole) {
          const idx = holes.indexOf(key);
          if (idx >= 0) {
            tapOrderIndex = idx + 1;
          }
        }

        const ariaLabel = isHole
          ? `Otvor na pozici ${r + 1}, ${c + 1} (${token})`
          : isLocked
            ? `Zamčená pozice ${r + 1}, ${c + 1} (rotace ${ROTATION_COLORS[orbitInfo?.step ?? 0].label})`
            : isCenter
              ? `Středová buňka ${r + 1}, ${c + 1}`
              : `Volná buňka ${r + 1}, ${c + 1} (${token})`;

        list.push({
          r,
          c,
          key,
          token,
          isCenter,
          isHole,
          isLocked,
          stepColor: orbitInfo?.color,
          tapOrderIndex,
          ariaLabel
        });
      }
    }
    return list;
  });

  function handleCellPointerDown(e: PointerEvent, r: number, c: number, isDisabled: boolean) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();

    if (isDisabled) {
      settings.vibrate(35);
      return;
    }

    settings.vibrate(20);
    onToggleHole(r, c);
  }
</script>

<div class="grille-board">
  <Chassis columns={gridSize}>
    {#each cellList as cell (cell.key)}
      <button
        type="button"
        class="grille-cell"
        class:is-hole={cell.isHole}
        class:is-locked={cell.isLocked}
        class:is-center={cell.isCenter}
        style:--step-color={cell.stepColor}
        aria-pressed={cell.isHole}
        aria-disabled={cell.isLocked || cell.isCenter}
        aria-label={cell.ariaLabel}
        onpointerdown={(e) => handleCellPointerDown(e, cell.r, cell.c, cell.isLocked || cell.isCenter)}
      >
        {#if cell.isHole}
          {#if tapOrderReading && cell.tapOrderIndex !== null}
            <span class="cell-mark cell-hole-number" aria-hidden="true">{cell.tapOrderIndex}</span>
          {:else}
            <span class="cell-mark cell-hole-ring" aria-hidden="true">◎</span>
          {/if}
        {:else if cell.isLocked}
          <span class="cell-mark cell-locked-dot" aria-hidden="true">·</span>
        {:else if cell.isCenter}
          <span class="cell-mark cell-center-symbol" aria-hidden="true">✦</span>
        {/if}

        <span class="cell-token" class:is-multi={cell.token.length > 1}>{cell.token}</span>
      </button>
    {/each}
  </Chassis>
</div>

<style>
  /*
   * Square. Full panel width whenever the output above still fits three lines of the result
   * (TranslationCard: 29 px × 1.35 plus its own and the output zone's padding); otherwise
   * at least the standard panel budget minus the hold row, as on 320 × 540.
   * Screen height = 100dvh minus the iOS insets, the shell's fixed rows and the hold row.
   */
  .grille-board {
    --grille-output-3-lines: calc(3 * 29px * 1.35 + 2 * var(--space-2xs) + 2 * var(--space-sm));
    --grille-fixed-rows: calc(
      var(--header-height) + var(--status-bar-height) + var(--zone-input-offset) +
        var(--zone-input-gap) + var(--utility-row-height) + var(--space-md) +
        env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px)
    );
    align-self: center;
    width: min(
      100%,
      max(
        calc(var(--panel-max-height) - var(--zone-input-gap) - var(--utility-row-height)),
        calc(100dvh - var(--grille-fixed-rows) - var(--grille-output-3-lines))
      )
    );
    user-select: none;
    -webkit-user-select: none;
  }

  /* Flat cells: not plastic keys, the grille keeps its own form */
  .grille-cell {
    container-type: inline-size;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-width: 0;
    aspect-ratio: 1;
    margin: 0;
    padding: 0;
    overflow: hidden;
    border: none;
    border-radius: 2px;
    background-color: var(--color-surface-3);
    color: var(--color-text-primary);
    cursor: pointer;
    touch-action: none;
    box-sizing: border-box;
  }

  .grille-cell:active:not(.is-locked):not(.is-center) {
    background-color: var(--color-surface-active);
  }

  /* Hole: fill and ring, plus a mark in the corner */
  .grille-cell.is-hole {
    background-color: var(--color-accent-primary-subtle);
    box-shadow: inset 0 0 0 2px var(--color-accent-primary);
  }

  .grille-cell.is-locked,
  .grille-cell.is-center {
    background-color: var(--color-surface-sunken);
    cursor: not-allowed;
  }

  .cell-token {
    max-width: 90%;
    overflow: hidden;
    font-family: var(--font-mono);
    font-size: min(var(--key-m), 56cqw);
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.5px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cell-token.is-multi {
    font-size: min(var(--key-s), 36cqw);
    letter-spacing: -1px;
  }

  .grille-cell.is-hole .cell-token {
    color: var(--step-color);
    font-weight: 800;
  }

  .grille-cell.is-locked .cell-token {
    color: var(--step-color);
    opacity: 0.65;
  }

  .cell-mark {
    position: absolute;
    top: 1px;
    right: 2px;
    font-size: min(var(--text-xs), 30cqw);
    font-weight: 900;
    line-height: 1;
    pointer-events: none;
  }

  .cell-hole-ring {
    color: var(--color-accent-primary);
  }

  /* Order badge when reading in tap order */
  .cell-hole-number {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 1.4em;
    height: 1.4em;
    border-radius: 0.7em;
    background-color: var(--color-accent-primary);
    color: var(--color-text-inverse);
    font-family: var(--font-mono);
  }

  .cell-locked-dot {
    top: 0;
    font-size: min(var(--text-base), 50cqw);
    color: var(--step-color);
    opacity: 0.85;
  }

  .cell-center-symbol {
    font-weight: 700;
    color: var(--color-text-muted);
  }
</style>
