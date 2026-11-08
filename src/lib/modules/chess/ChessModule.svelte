<script lang="ts">
  import { ArrowUUpLeft, ArrowUUpRight } from 'phosphor-svelte';
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import SegmentedControl from '../../components/ui/SegmentedControl.svelte';
  import HoldToAction from '../../components/ui/HoldToAction.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import ChessBoard from './ChessBoard.svelte';
  import PieceTray from './PieceTray.svelte';
  import RulesPanel from './RulesPanel.svelte';
  import ChessReference from './ChessReference.svelte';
  import { chessState, type ChessMode } from './chessState.svelte';
  import { positionProblem } from './chessData';
  import { settings } from '../../state/settings.svelte';

  const modeOptions: { id: ChessMode; label: string }[] = [
    { id: 'free', label: 'Volně' },
    { id: 'rules', label: 'Pravidla' }
  ];

  // An empty board is a deliberate start; a half-built one that cannot be played needs a look
  const positionAttention = $derived(
    chessState.parts.board.some(Boolean) ? positionProblem(chessState.current.fen) : null
  );

  // Stop a running search and drop a stuck drag when the module closes.
  $effect(() => {
    return () => {
      chessState.cancelSolve();
      chessState.drag = null;
    };
  });

  // ─── Undo / redo with auto-repeat while held ─────────────

  let repeatTimer: ReturnType<typeof setTimeout> | null = null;

  function stopRepeat() {
    if (repeatTimer) clearTimeout(repeatTimer);
    repeatTimer = null;
  }

  function startRepeat(e: PointerEvent, step: () => void, enabled: boolean) {
    e.preventDefault();
    if (!enabled) return;
    settings.vibrate(30);
    step();
    stopRepeat();
    const tick = (delay: number) => {
      repeatTimer = setTimeout(() => {
        step();
        tick(80);
      }, delay);
    };
    tick(420);
  }
</script>

<svelte:window onpointerup={stopRepeat} onpointercancel={stopRepeat} onblur={stopRepeat} />

<ModuleShell
  title="Šachy"
  onReset={() => chessState.resetModule()}
  podklad={{
    kind: 'position',
    required: false,
    empty: false,
    title: 'Pozice nebo partie',
    description: 'FEN, nebo tahy česky i anglicky.',
    placeholder: 'FEN, nebo tahy: 1. e4 e5 2. Jf3 Jc6 …',
    autocapitalize: 'none',
    copyable: true,
    attention: positionAttention,
    value: chessState.current.fen,
    onSave: (val) => {
      const text = val.trim();
      if (text && text !== chessState.current.fen) chessState.importText(text);
    }
  }}
>
  {#snippet output()}
    <ChessBoard />
  {/snippet}

  {#snippet input()}
    <div class="zone-input-flow">
      <div class="subtoolbar-container">
        <SegmentedControl
          size="sm"
          options={modeOptions}
          value={chessState.mode}
          ariaLabel="Režim šachovnice"
          onChange={(id) => chessState.setMode(id)}
        />
      </div>

      {#if chessState.mode === 'free'}
        <PieceTray />
      {:else}
        <RulesPanel />
      {/if}

      <div class="keypad-utility-row-3col history-row">
        <HoldToAction
          onAction={() => chessState.clearBoard()}
          ariaLabel="Vyprázdnit šachovnici podržením"
          tapWarning="Podržte pro prázdnou šachovnici"
        />

        <button
          type="button"
          class="utility-btn history-btn"
          disabled={!chessState.canUndo}
          aria-label="Zpět"
          onpointerdown={(e) => startRepeat(e, () => chessState.undo(), chessState.canUndo)}
          onpointerleave={stopRepeat}
        >
          <span class="btn-inner">
            <ArrowUUpLeft size={18} weight="bold" />
            <span class="btn-label">Zpět</span>
          </span>
        </button>

        <button
          type="button"
          class="utility-btn history-btn"
          disabled={!chessState.canRedo}
          aria-label="Vpřed"
          onpointerdown={(e) => startRepeat(e, () => chessState.redo(), chessState.canRedo)}
          onpointerleave={stopRepeat}
        >
          <span class="btn-inner">
            <ArrowUUpRight size={18} weight="bold" />
            <span class="btn-label">Vpřed</span>
          </span>
        </button>
      </div>
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <div class="menu-group">
      <div class="menu-group-title">Šachovnice</div>
      <OptionRow
        label="Otočit šachovnici"
        hint="Černý dole"
        checked={chessState.flipped}
        isNonStandard={chessState.flipped}
        onChange={(v) => {
          chessState.flipped = v;
          chessState.saveToStorage();
        }}
      />
      <OptionRow
        label="Souřadnice"
        hint="a–h a 1–8 na okraji polí"
        checked={chessState.showCoords}
        onChange={(v) => {
          chessState.showCoords = v;
          chessState.saveToStorage();
        }}
      />
      <OptionRow
        label="Nápověda tahů"
        hint="Kam figura dosáhne, v režimu Volně"
        checked={chessState.showHints}
        onChange={(v) => {
          chessState.showHints = v;
          chessState.saveToStorage();
        }}
      />
    </div>
  {/snippet}

  {#snippet reference()}
    <ChessReference />
  {/snippet}
</ModuleShell>

<style>
  /* Undo and redo are a symmetric pair, unlike the usual wide Space key in the middle. */
  .history-row {
    grid-template-columns: 1fr 1.2fr 1.2fr;
  }

  .history-btn {
    background-color: var(--color-surface-2);
    color: var(--color-text-primary);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    cursor: pointer;
    touch-action: none;
    -webkit-tap-highlight-color: transparent;
  }

  .history-btn:active:not(:disabled) {
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
  }

  .history-btn:disabled {
    cursor: not-allowed;
  }

  .btn-inner {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .history-btn:disabled .btn-inner {
    opacity: 0.48;
  }

  .btn-label {
    font-size: var(--text-sm);
    font-weight: 600;
  }

  .menu-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
  }

  .menu-group-title {
    font-size: calc(13px * var(--font-scale));
    font-weight: 700;
    color: var(--color-text-primary);
  }


</style>
