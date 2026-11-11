<script lang="ts">
  import { Eraser } from 'phosphor-svelte';
  import Chassis from '../../components/ui/Chassis.svelte';
  import Keycap from '../../components/ui/Keycap.svelte';
  import { chessState, type TrayTool } from './chessState.svelte';
  import { PIECE_SVG } from './chessPieces';
  import { BLACK_PIECES, START_FEN, WHITE_PIECES, pieceColor, pieceLabel } from './chessData';

  let trayEl = $state<HTMLDivElement | null>(null);

  $effect(() => {
    chessState.removeZoneEl = trayEl;
    return () => {
      if (chessState.removeZoneEl === trayEl) chessState.removeZoneEl = null;
    };
  });

  let removing = $derived(chessState.drag !== null && chessState.drag.source !== 'tray');

  // Keycap reports only the press; a piece dragged out of the tray needs its pointer
  let downEvent: PointerEvent | null = null;

  function rememberPointer(e: PointerEvent) {
    if (e.pointerType !== 'mouse' || e.button === 0) downEvent = e;
  }

  function pressTool(tool: TrayTool) {
    const e = downEvent;
    downEvent = null;
    if (e) chessState.press(e, 'tray', tool);
    else chessState.tapTray(tool);
  }

  function setStart() {
    downEvent = null;
    chessState.armed = null;
    chessState.loadPosition(START_FEN);
  }
</script>

{#snippet key(tool: TrayTool)}
  <Keycap
    selected={chessState.armed === tool}
    ariaLabel={tool === 'erase' ? 'Guma' : pieceLabel(tool)}
    onPress={() => pressTool(tool)}
  >
    {#if tool === 'erase'}
      <Eraser size={22} weight="bold" />
    {:else}
      <span class="tray-piece" class:outlined={pieceColor(tool) === 'b'}>{@html PIECE_SVG[tool]}</span>
    {/if}
  </Keycap>
{/snippet}

<div class="tray" bind:this={trayEl} onpointerdowncapture={rememberPointer}>
  <Chassis columns={7} keyHeight="40px">
    {#each WHITE_PIECES as piece (piece)}
      {@render key(piece)}
    {/each}
    {@render key('erase')}

    {#each BLACK_PIECES as piece (piece)}
      {@render key(piece)}
    {/each}
    <Keycap ariaLabel="Výchozí postavení" onPress={setStart}>
      <span class="start-label">Výchozí</span>
    </Keycap>
  </Chassis>

  {#if removing}
    <div class="remove-overlay" class:active={chessState.drag?.overRemove}>
      Pustit = odebrat
    </div>
  {/if}
</div>

<style>
  .tray {
    position: relative;
    touch-action: none;
  }

  /* The last column is wider for the Výchozí label */
  .tray :global(.chassis) {
    grid-template-columns: repeat(6, minmax(0, 1fr)) minmax(0, 1.25fr);
  }

  .tray-piece {
    width: min(85cqh, 90cqw);
    height: min(85cqh, 90cqw);
    pointer-events: none;
  }

  /* Black pieces on dark keys: thin light outline traced from the piece shape. */
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
