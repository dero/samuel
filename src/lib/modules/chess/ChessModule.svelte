<script lang="ts">
  import { ArrowUUpLeft, ArrowUUpRight } from 'phosphor-svelte';
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import SplitBottomRow from '../../components/ui/SplitBottomRow.svelte';
  import Keycap from '../../components/ui/Keycap.svelte';
  import MenuGroup from '../../components/ui/MenuGroup.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import ChessBoard from './ChessBoard.svelte';
  import PieceTray from './PieceTray.svelte';
  import RulesPanel from './RulesPanel.svelte';
  import ChessReference from './ChessReference.svelte';
  import { chessState, type ChessMode } from './chessState.svelte';

  const modeOptions: SegmentOption<ChessMode>[] = [
    { id: 'free', label: 'Volně' },
    { id: 'rules', label: 'Pravidla' }
  ];

  // ─── Undo / redo with auto-repeat while held ─────────────

  let repeatTimer: ReturnType<typeof setTimeout> | null = null;
  // A pointer is down on the history keys; a keyboard press steps once
  let pointerHeld = false;

  function stopRepeat() {
    pointerHeld = false;
    if (repeatTimer) clearTimeout(repeatTimer);
    repeatTimer = null;
  }

  // The Keycap vibrated on the press; the repeated steps stay silent
  function stepAndRepeat(step: () => void, canStep: () => boolean) {
    step();
    if (repeatTimer) clearTimeout(repeatTimer);
    repeatTimer = null;
    if (!pointerHeld) return;
    const tick = (delay: number) => {
      repeatTimer = setTimeout(() => {
        if (!canStep()) return stopRepeat();
        step();
        tick(80);
      }, delay);
    };
    tick(420);
  }

  // Stop a running search, a repeat and a stuck drag when the module closes.
  $effect(() => {
    return () => {
      stopRepeat();
      chessState.cancelSolve();
      chessState.drag = null;
    };
  });
</script>

<svelte:window onpointerup={stopRepeat} onpointercancel={stopRepeat} onblur={stopRepeat} />

<ModuleShell
  title="Šachy"
  hasWarning={chessState.flipped}
  onReset={() => chessState.resetModule()}
  podklad={{
    kind: 'position',
    required: false,
    empty: !chessState.notation,
    title: 'Pozice nebo partie',
    description: 'FEN, nebo tahy česky i anglicky.',
    placeholder: 'Např. 1. e4 e5 2. Jf3 Jc6',
    format: 'Tahy česky i anglicky, nebo pozice ve FEN.',
    autocapitalize: 'none',
    attention: chessState.attention,
    value: chessState.notation,
    onSave: (val) => chessState.importNotation(val)
  }}
  bar={{
    empty: chessState.isEmpty,
    hint: 'Položte figury, nebo zvolte Výchozí.',
    warning: chessState.notationWarning,
    status: chessState.status
  }}
>
  {#snippet output()}
    <ChessBoard />
  {/snippet}

  {#snippet variants()}
    <SegmentedControl
      size="sm"
      options={modeOptions}
      value={chessState.mode}
      ariaLabel="Režim šachovnice"
      onChange={(id) => chessState.setMode(id)}
    />
  {/snippet}

  {#snippet input()}
    <div class="chess-input">
      {#if chessState.mode === 'free'}
        <PieceTray />
      {:else}
        <RulesPanel />
      {/if}

      <!-- Bottom row 1+2: [Vyprázdnit] [Zpět | Vpřed], the pair walks the game in reading order -->
      <div
        class="history-row"
        onpointerdowncapture={(e) => {
          if (e.pointerType !== 'mouse' || e.button === 0) pointerHeld = true;
        }}
      >
        <SplitBottomRow
          clearDisabled={chessState.isEmpty && chessState.orphans.length === 0}
          onClear={() => chessState.clearBoard()}
          clearAriaLabel="Vyprázdnit šachovnici podržením"
          tapWarning="Podržte pro prázdnou šachovnici"
        >
          {#snippet pair()}
        <Keycap
          ariaLabel="Zpět"
          title="Zpět, podržením rychle"
          disabled={!chessState.canUndo}
          onPress={() => stepAndRepeat(() => chessState.undo(), () => chessState.canUndo)}
        >
          <span class="history-key">
            <ArrowUUpLeft size={18} weight="bold" />
            <span class="history-label">Zpět</span>
          </span>
        </Keycap>

        <Keycap
          ariaLabel="Vpřed"
          title="Vpřed, podržením rychle"
          disabled={!chessState.canRedo}
          onPress={() => stepAndRepeat(() => chessState.redo(), () => chessState.canRedo)}
        >
          <span class="history-key">
            <ArrowUUpRight size={18} weight="bold" />
            <span class="history-label">Vpřed</span>
          </span>
        </Keycap>
          {/snippet}
        </SplitBottomRow>
      </div>
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <MenuGroup title="Šachovnice">
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
    </MenuGroup>
  {/snippet}

  {#snippet reference()}
    <ChessReference />
  {/snippet}
</ModuleShell>

<style>
  .chess-input {
    display: flex;
    flex-direction: column;
    gap: var(--zone-input-gap);
    width: 100%;
  }

  .history-row {
    width: 100%;
  }

  .history-key {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .history-label {
    font-size: var(--key-s);
    font-weight: 700;
  }
</style>
