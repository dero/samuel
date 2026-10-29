<script lang="ts">
  import { Eraser } from 'phosphor-svelte';
  import { chessState, type TrayTool } from './chessState.svelte';
  import { PIECE_SVG } from './chessPieces';
  import { BLACK_PIECES, START_FEN, WHITE_PIECES, pieceColor, pieceLabel } from './chessData';
  import { settings } from '../../state/settings.svelte';

  let trayEl = $state<HTMLDivElement | null>(null);

  $effect(() => {
    chessState.removeZoneEl = trayEl;
    return () => {
      if (chessState.removeZoneEl === trayEl) chessState.removeZoneEl = null;
    };
  });

  let removing = $derived(chessState.drag !== null && chessState.drag.source !== 'tray');

  function handleStart(e: PointerEvent) {
    e.preventDefault();
    settings.vibrate(30);
    chessState.armed = null;
    chessState.loadPosition(START_FEN);
  }
</script>

{#snippet key(tool: TrayTool)}
  <button
    type="button"
    class="keycap tray-key"
    class:armed={chessState.armed === tool}
    aria-pressed={chessState.armed === tool}
    aria-label={tool === 'erase' ? 'Guma' : pieceLabel(tool)}
    onpointerdown={(e) => chessState.press(e, 'tray', tool)}
  >
    {#if tool === 'erase'}
      <Eraser size={22} weight="bold" />
    {:else}
      <span class="tray-piece" class:outlined={pieceColor(tool) === 'b'}>{@html PIECE_SVG[tool]}</span>
    {/if}
  </button>
{/snippet}

<div class="tray-chassis" class:removing bind:this={trayEl}>
  {#each WHITE_PIECES as piece (piece)}
    {@render key(piece)}
  {/each}
  {@render key('erase')}

  {#each BLACK_PIECES as piece (piece)}
    {@render key(piece)}
  {/each}
  <button
    type="button"
    class="keycap tray-key start-key"
    aria-label="Výchozí postavení"
    onpointerdown={handleStart}
  >
    <span class="start-label">Výchozí</span>
  </button>

  {#if removing}
    <div class="remove-overlay" class:active={chessState.drag?.overRemove}>
      Pustit = odebrat
    </div>
  {/if}
</div>

<style>
  .tray-chassis {
    position: relative;
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr)) minmax(0, 1.25fr);
    grid-template-rows: repeat(2, 40px);
    gap: 2px;
    padding: 2px;
    background-color: #000000;
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.8);
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }

  .keycap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background-color: var(--color-surface-2);
    border: none;
    border-radius: 2px;
    color: var(--color-text-primary);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    cursor: pointer;
    touch-action: none;
    -webkit-tap-highlight-color: transparent;
    transition: background-color 0.08s ease;
  }

  .keycap:active {
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
  }

  .tray-key.armed {
    background-color: var(--color-accent-primary-subtle);
    box-shadow:
      inset 0 0 0 2px var(--color-accent-primary),
      0 0 10px var(--color-accent-primary-glow);
  }

  .tray-piece {
    width: 34px;
    height: 34px;
    pointer-events: none;
  }

  /* Black pieces on dark keycaps: thin light outline traced from the piece shape. */
  .tray-piece.outlined {
    filter: drop-shadow(0 0 0.6px rgba(255, 255, 255, 0.85)) drop-shadow(0 0 0.6px rgba(255, 255, 255, 0.85));
  }

  .tray-piece :global(svg) {
    width: 100%;
    height: 100%;
    display: block;
  }

  .start-label {
    font-size: min(var(--text-xs), 3.6vw);
    font-weight: 700;
    color: var(--color-text-secondary);
  }

  .remove-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    background-color: rgba(0, 0, 0, 0.72);
    border: 1px dashed var(--color-border-medium);
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    font-weight: 700;
    pointer-events: none;
  }

  .remove-overlay.active {
    background-color: var(--color-accent-danger-subtle);
    border-color: var(--color-accent-danger);
    color: var(--color-accent-danger);
  }
</style>
