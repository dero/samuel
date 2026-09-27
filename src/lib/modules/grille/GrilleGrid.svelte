<script lang="ts">
  import {
    getRequiredHolesCount,
    isCenterCell,
    getRotatedHolesForStep
  } from './grilleSolver';
  import { ROTATION_COLORS } from './grilleData';
  import { settings } from '../../state/settings.svelte';
  import { Trash } from 'phosphor-svelte';

  interface Props {
    gridSize: number;
    gridMatrix: string[][];
    holes: string[];
    rotationCCW?: boolean;
    tapOrderReading?: boolean;
    hasData: boolean;
    onToggleHole: (r: number, c: number) => void;
    onResetHoles: () => void;
  }

  let {
    gridSize,
    gridMatrix,
    holes,
    rotationCCW = false,
    tapOrderReading = false,
    hasData,
    onToggleHole,
    onResetHoles
  }: Props = $props();

  const requiredHoles = $derived(getRequiredHolesCount(gridSize));
  const isComplete = $derived(holes.length === requiredHoles && requiredHoles > 0);

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
    isPadding: boolean;
    isCenter: boolean;
    isHole: boolean;
    isLocked: boolean;
    stepColor: string | null;
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
        const isPadding = !token;
        const stepColor = orbitInfo?.color ?? null;

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
          isPadding,
          isCenter,
          isHole,
          isLocked,
          stepColor,
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

<div class="grille-grid-stage">
  {#if !hasData}
    <div class="grille-placeholder">
      <div class="placeholder-box">
        <span class="placeholder-icon">⊞</span>
        <span class="placeholder-title">Žádná data</span>
        <span class="placeholder-desc">Vložte obsah tabulky níže</span>
      </div>
    </div>
  {:else}
    <div
      class="grille-chassis"
      style:grid-template-columns="repeat({gridSize}, 1fr)"
      style:grid-template-rows="repeat({gridSize}, 1fr)"
    >
      {#each cellList as cell (cell.key)}
        <button
          type="button"
          class="grille-cell"
          class:is-hole={cell.isHole}
          class:is-locked={cell.isLocked}
          class:is-center={cell.isCenter}
          class:is-padding={cell.isPadding}
          style:--step-color={cell.stepColor ?? 'inherit'}
          aria-disabled={cell.isLocked || cell.isCenter}
          aria-label={cell.ariaLabel}
          onpointerdown={(e) => handleCellPointerDown(e, cell.r, cell.c, cell.isLocked || cell.isCenter)}
        >
          {#if cell.isHole}
            {#if tapOrderReading && cell.tapOrderIndex !== null}
              <span class="cell-hole-indicator cell-hole-number" aria-hidden="true">{cell.tapOrderIndex}</span>
            {:else}
              <span class="cell-hole-indicator" aria-hidden="true">◎</span>
            {/if}
          {:else if cell.isLocked}
            <span class="cell-locked-dot" aria-hidden="true">·</span>
          {:else if cell.isCenter}
            <span class="cell-center-symbol" aria-hidden="true">✦</span>
          {/if}

          <span
            class="cell-token font-mono"
            class:single-char={cell.token.length <= 1}
            class:multi-char={cell.token.length > 1}
          >
            {cell.token}
          </span>
        </button>
      {/each}
    </div>

    <!-- Counter and reset row -->
    <div class="grille-counter-row">
      <span
        class="grille-counter-text"
        class:is-complete={isComplete}
      >
        {holes.length} / {requiredHoles} otvorů
      </span>

      {#if holes.length > 0}
        <button
          type="button"
          class="grille-clear-holes-btn"
          onclick={() => {
            settings.vibrate(25);
            onResetHoles();
          }}
          title="Vymazat všechny otvory"
          aria-label="Vymazat všechny otvory"
        >
          <Trash size={13} weight="bold" />
          <span>Vymazat otvory</span>
        </button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .grille-grid-stage {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    box-sizing: border-box;
    gap: 4px;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .grille-placeholder {
    width: 100%;
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000000;
    border: 1px dashed var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: var(--space-md);
    box-sizing: border-box;
  }

  .placeholder-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    text-align: center;
  }

  .placeholder-icon {
    font-size: 28px;
    color: var(--color-text-muted);
  }

  .placeholder-title {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text-secondary);
  }

  .placeholder-desc {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  /* Chassis matching Samuel design system */
  .grille-chassis {
    display: grid;
    gap: 2px;
    padding: 2px;
    background-color: #000000;
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    width: 100%;
    max-width: 310px;
    aspect-ratio: 1 / 1;
    box-sizing: border-box;
  }

  .grille-cell {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-2);
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 2px;
    color: var(--color-text-primary);
    cursor: pointer;
    touch-action: none;
    padding: 0;
    margin: 0;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    /* Zero transition delay for instant tactile feedback on touch */
    transition: none;
  }

  .grille-cell:active:not(.is-locked):not(.is-center) {
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
  }

  /* Active hole (cutout with turquoise glow) */
  .grille-cell.is-hole {
    background-color: rgba(0, 210, 255, 0.18);
    border-color: rgba(0, 210, 255, 0.6);
    box-shadow:
      0 0 8px rgba(0, 210, 255, 0.4),
      inset 0 0 0 2px var(--color-accent-primary, #00d2ff),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  .grille-cell.is-hole .cell-token {
    color: #f59e0b; /* 0° rotation color (Amber) */
    font-weight: 800;
  }

  .cell-hole-indicator {
    position: absolute;
    top: 1.5px;
    right: 2.5px;
    font-size: 13px;
    color: var(--color-accent-primary, #00d2ff);
    line-height: 1;
    font-weight: 900;
    pointer-events: none;
  }

  /* Order number badge when tapOrderReading is true */
  .cell-hole-indicator.cell-hole-number {
    font-size: 10px;
    font-family: var(--font-mono, monospace);
    font-weight: 900;
    background-color: var(--color-accent-primary, #00d2ff);
    color: #000000;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    top: 2px;
    right: 2px;
    box-shadow: 0 0 4px rgba(0, 210, 255, 0.7);
  }

  /* Sunken locked cell (orbit companion) - deeply recessed slot matching Braille precedent */
  .grille-cell.is-locked {
    cursor: not-allowed;
    background-color: var(--color-surface-sunken, #0a0a0a);
    border: 1px solid rgba(255, 255, 255, 0.03);
    box-shadow:
      inset 0 3px 6px rgba(0, 0, 0, 0.95),
      inset 0 1.5px 3px rgba(0, 0, 0, 0.9),
      inset 0 -1px 0 rgba(255, 255, 255, 0.04);
  }

  .grille-cell.is-locked .cell-token {
    color: var(--step-color);
    opacity: 0.65;
    font-weight: 700;
  }

  .cell-locked-dot {
    position: absolute;
    top: 0px;
    right: 3px;
    font-size: 15px;
    color: var(--step-color);
    opacity: 0.85;
    line-height: 1;
    font-weight: 900;
    pointer-events: none;
  }

  /* Center cell for odd grids */
  .grille-cell.is-center {
    cursor: not-allowed;
    background-color: var(--color-surface-sunken, #0a0a0a);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.9);
  }

  .cell-center-symbol {
    position: absolute;
    top: 1.5px;
    right: 2.5px;
    font-size: 11px;
    color: var(--color-accent-warning, #f59e0b);
    line-height: 1;
    font-weight: 700;
    pointer-events: none;
  }

  /* Padding cells with no data */
  .grille-cell.is-padding .cell-token {
    opacity: 0.15;
  }

  .font-mono {
    font-family: var(--font-mono, monospace);
  }

  .cell-token {
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 90%;
    /* Instant color transition */
    transition: none;
  }

  .cell-token.single-char {
    font-size: clamp(13px, 3.5vw, 17px);
  }

  .cell-token.multi-char {
    font-size: clamp(8.5px, 2.2vw, 11px);
    letter-spacing: -1px;
  }

  /* Counter bar */
  .grille-counter-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 310px;
    padding: 0 4px;
    box-sizing: border-box;
    min-height: 18px;
  }

  .grille-counter-text {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-text-secondary);
    letter-spacing: 0.3px;
  }

  .grille-counter-text.is-complete {
    color: var(--color-accent-success, #10b981);
  }

  .grille-clear-holes-btn {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: var(--radius-xs);
    transition: color 0.1s ease;
  }

  .grille-clear-holes-btn:hover {
    color: var(--color-accent-danger, #ef4444);
  }
</style>
