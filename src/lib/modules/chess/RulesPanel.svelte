<script lang="ts">
  import { Lightning, Stop } from 'phosphor-svelte';
  import { chessState } from './chessState.svelte';
  import { toCzechSan } from './chessData';
  import { settings } from '../../state/settings.svelte';

  let stripEl = $state<HTMLDivElement | null>(null);

  let strip = $derived(chessState.strip);
  let solver = $derived(chessState.solverHere);
  let running = $derived(chessState.solver?.status === 'running');

  // Keep the current move (or the newest solver chip) in view.
  $effect(() => {
    const _cursor = chessState.cursor;
    const _solver = solver?.status;
    if (!stripEl) return;
    const active = stripEl.querySelector<HTMLElement>('.chip.active, .chip.solution, .chip.status');
    active?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });

  function tap(e: PointerEvent, action: () => void) {
    e.preventDefault();
    settings.vibrate(30);
    action();
  }
</script>

<div class="rules-chassis">
  <div class="strip" bind:this={stripEl} data-allow-copy>
    <button
      type="button"
      class="chip"
      class:active={chessState.cursor === strip.base}
      onclick={() => {
        settings.vibrate(30);
        chessState.jumpTo(strip.base);
      }}
    >
      Start
    </button>

    {#each strip.items as item (item.index)}
      <button
        type="button"
        class="chip move"
        class:active={chessState.cursor === item.index}
        onclick={() => {
          settings.vibrate(30);
          chessState.jumpTo(item.index);
        }}
      >
        {item.label}
      </button>
    {/each}

    {#if chessState.gameOver}
      <span class="chip status">{chessState.gameOver === 'mate' ? 'Mat' : 'Pat'}</span>
    {:else if solver?.status === 'running'}
      <span class="chip status muted">
        Hledám mat v {solver.progressDepth}… {solver.done}/{solver.total}
      </span>
    {:else if solver?.result && solver.result.depth === null}
      <span class="chip status muted">Mat do {solver.depth} nenalezen</span>
    {:else if solver?.result}
      {#each solver.result.solutions as s (s.from + s.to + (s.promotion ?? ''))}
        <button
          type="button"
          class="chip solution"
          onclick={() => {
            settings.vibrate(30);
            chessState.playSolution(s.line);
          }}
        >
          Mat {solver.result.depth}: {s.line.map((m) => toCzechSan(m.san)).join(' ')}
        </button>
      {/each}
    {:else if strip.items.length === 0}
      <span class="strip-hint">Tahy se zapisují sem</span>
    {/if}
  </div>

  <div class="controls">
    <button
      type="button"
      class="keycap turn-key"
      aria-label="Přepnout stranu na tahu"
      onpointerdown={(e) => tap(e, () => chessState.toggleTurn())}
    >
      <span class="turn-dot" class:black={chessState.turn === 'b'}></span>
      <span class="turn-text">
        <span class="turn-caption">na tahu</span>
        <span class="key-label">{chessState.turn === 'w' ? 'Bílý' : 'Černý'}</span>
      </span>
    </button>

    <div class="depth-group" role="radiogroup" aria-label="Mat v počtu tahů">
      <span class="depth-caption">Mat v</span>
      {#each [1, 2, 3] as depth (depth)}
        <button
          type="button"
          class="keycap depth-key"
          class:on={chessState.mateDepth === depth}
          role="radio"
          aria-checked={chessState.mateDepth === depth}
          onpointerdown={(e) =>
            tap(e, () => {
              chessState.mateDepth = depth;
              chessState.saveToStorage();
            })}
        >
          {depth}
        </button>
      {/each}
    </div>

    <button
      type="button"
      class="keycap solve-key"
      class:running
      disabled={!running && !!chessState.gameOver}
      onpointerdown={(e) => tap(e, () => chessState.solve())}
    >
      <span class="solve-inner">
        {#if running}
          <Stop size={16} weight="fill" />
          <span class="key-label">Zrušit</span>
        {:else}
          <Lightning size={16} weight="fill" />
          <span class="key-label">Řešit</span>
        {/if}
      </span>
    </button>
  </div>
</div>

<style>
  .rules-chassis {
    display: grid;
    grid-template-rows: repeat(2, 40px);
    gap: 2px;
    padding: 2px;
    background-color: #000000;
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.8);
    user-select: none;
    -webkit-user-select: none;
  }

  .strip {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 4px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    background-color: var(--color-surface-sunken);
    border-radius: 2px;
  }

  .strip::-webkit-scrollbar {
    display: none;
  }

  .chip {
    flex: 0 0 auto;
    height: 30px;
    padding: 0 10px;
    display: inline-flex;
    align-items: center;
    border: none;
    border-radius: var(--radius-xs);
    background-color: var(--color-surface-2);
    color: var(--color-text-secondary);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  .chip.active {
    background-color: var(--color-accent-primary-subtle);
    color: var(--color-accent-primary);
    box-shadow: inset 0 0 0 1px var(--color-accent-primary);
  }

  .chip.solution {
    background-color: var(--color-accent-success-subtle);
    color: var(--color-accent-success);
    box-shadow: inset 0 0 0 1px var(--color-accent-success);
  }

  .chip.status {
    cursor: default;
    color: var(--color-accent-warning);
    background: transparent;
  }

  .chip.status.muted {
    color: var(--color-text-muted);
    font-family: var(--font-sans);
  }

  .strip-hint {
    flex: 0 0 auto;
    padding: 0 6px;
    color: var(--color-text-muted);
    font-size: var(--text-xs);
    white-space: nowrap;
  }

  .controls {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    gap: 2px;
  }

  .keycap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0 6px;
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
  }

  .keycap:active:not(:disabled) {
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
  }

  .keycap:disabled .solve-inner {
    opacity: 0.48;
  }

  .key-label {
    font-size: min(var(--text-sm), 3.8vw);
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .turn-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
    line-height: 1.1;
  }

  .turn-caption {
    font-size: min(var(--text-2xs), 3vw);
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  .turn-dot {
    flex: 0 0 auto;
    width: 14px;
    height: 14px;
    border-radius: var(--radius-full);
    background-color: #ffffff;
    box-shadow: 0 0 0 1px var(--color-border-medium);
  }

  .turn-dot.black {
    background-color: #000000;
    box-shadow: 0 0 0 1.5px var(--color-text-secondary);
  }

  .depth-group {
    display: flex;
    align-items: stretch;
    gap: 2px;
  }

  .depth-caption {
    display: flex;
    align-items: center;
    padding: 0 6px;
    background-color: var(--color-surface-1);
    border-radius: 2px;
    color: var(--color-text-muted);
    font-size: min(var(--text-xs), 3.4vw);
    font-weight: 700;
    white-space: nowrap;
  }

  .depth-key {
    width: 30px;
    padding: 0;
    font-family: var(--font-mono);
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text-secondary);
  }

  .depth-key.on {
    background-color: var(--color-accent-primary-subtle);
    color: var(--color-accent-primary);
    box-shadow: inset 0 0 0 1px var(--color-accent-primary);
  }

  .solve-key {
    color: var(--color-accent-success);
  }

  .solve-key.running {
    color: var(--color-accent-warning);
  }

  .solve-inner {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }
</style>
