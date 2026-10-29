<script lang="ts">
  import HoldToAction from '../../components/ui/HoldToAction.svelte';
  import BackspaceButton from '../../components/ui/BackspaceButton.svelte';
  import { PencilSimple } from 'phosphor-svelte';
  import type { TurtleState } from './turtleTypes';

  /** Shared bottom row of drawing modules (Želva, Plotr): Clear | Pen | Undo. */
  interface Props {
    state: TurtleState;
    onClear: () => void;
    onTogglePen: () => void;
    onUndo: () => void;
  }

  let { state: turtleState, onClear, onTogglePen, onUndo }: Props = $props();
</script>

<div class="keypad-utility-row-3col">
  <HoldToAction
    label="Smazat"
    disabled={turtleState.segments.length === 0 && turtleState.markers.length === 0}
    onAction={onClear}
  />

  <button
    type="button"
    class="pen-toggle-btn"
    class:is-pen-up={!turtleState.penDown}
    onpointerdown={(e) => {
      e.preventDefault();
      onTogglePen();
    }}
    title={turtleState.penDown ? 'Pero kreslí (klepnutím zvednout)' : 'Pero je zvednuté (klepnutím položit)'}
    aria-label={turtleState.penDown ? 'Pero kreslí' : 'Pero je zvednuté'}
  >
    <span class="pen-icon-wrap">
      <PencilSimple size={16} weight="bold" />
    </span>
    <span class="pen-label">{turtleState.penDown ? 'Kreslí' : 'Zvednuto'}</span>
  </button>

  <BackspaceButton
    disabled={turtleState.history.length === 0}
    onAction={onUndo}
    title="Krok zpět (Undo)"
  />
</div>

<style>
  .pen-toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background-color: var(--color-surface-2);
    color: var(--color-accent-success);
    border-radius: 2px;
    border: none;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.10), inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    font-size: var(--text-sm);
    font-weight: 700;
    cursor: pointer;
    touch-action: manipulation;
  }

  .pen-icon-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transform: translateY(1px);
  }

  .pen-toggle-btn:active {
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
  }

  .pen-toggle-btn.is-pen-up {
    color: var(--color-text-muted);
  }

  .pen-label {
    white-space: nowrap;
  }
</style>
