<script lang="ts">
  import { Lightning, Stop } from 'phosphor-svelte';
  import Chassis from '../../components/ui/Chassis.svelte';
  import Keycap from '../../components/ui/Keycap.svelte';
  import { chessState } from './chessState.svelte';
  import { toCzechSan } from './chessData';
  import { settings } from '../../state/settings.svelte';

  let stripEl = $state<HTMLDivElement | null>(null);

  let strip = $derived(chessState.strip);
  let solver = $derived(chessState.solverHere);
  let running = $derived(chessState.solver?.status === 'running');
  let solutions = $derived(chessState.gameOver ? null : solver?.report?.result ?? null);
  let sideLabel = $derived(chessState.turn === 'w' ? 'Bílý' : 'Černý');

  // Keep the current move (or the newest solver chip) in view.
  $effect(() => {
    const _cursor = chessState.cursor;
    const _solver = solver?.status;
    if (!stripEl) return;
    const active = stripEl.querySelector<HTMLElement>('.chip.active, .chip.solution');
    active?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });

  function jump(index: number) {
    settings.vibrate(20);
    chessState.jumpTo(index);
  }
</script>

<div class="rules-panel">
  <div class="strip" bind:this={stripEl} data-allow-copy>
    <button
      type="button"
      class="chip"
      class:active={chessState.cursor === strip.base}
      aria-current={chessState.cursor === strip.base ? 'step' : undefined}
      onclick={() => jump(strip.base)}
    >
      Start
    </button>

    {#each strip.items as item (item.index)}
      <button
        type="button"
        class="chip move"
        class:active={chessState.cursor === item.index}
        aria-current={chessState.cursor === item.index ? 'step' : undefined}
        onclick={() => jump(item.index)}
      >
        {item.label}
      </button>
    {/each}

    {#if solutions}
      {#each solutions.solutions as s (s.from + s.to + (s.promotion ?? ''))}
        <button
          type="button"
          class="chip solution"
          onclick={() => {
            settings.vibrate(20);
            chessState.playSolution(s.line);
          }}
        >
          Mat {solutions.depth}: {s.line.map((m) => toCzechSan(m.san)).join(' ')}
        </button>
      {/each}
    {:else if strip.items.length === 0}
      <span class="strip-hint">Tahy se zapisují sem</span>
    {/if}
  </div>

  <Chassis columns={2} keyHeight="40px">
    <Keycap
      ariaLabel="Na tahu {sideLabel.toLowerCase()}, přepnout stranu"
      onPress={() => chessState.toggleTurn()}
    >
      <span class="key-body">
        <span class="turn-dot" class:black={chessState.turn === 'b'}></span>
        <span class="turn-text">
          <span class="turn-caption">na tahu</span>
          <span class="key-text">{sideLabel}</span>
        </span>
      </span>
    </Keycap>

    <Keycap
      selected={running}
      disabled={!running && !!chessState.gameOver}
      ariaLabel={running ? 'Zrušit hledání matu' : 'Hledat nejkratší mat'}
      onPress={() => chessState.solve()}
    >
      <span class="key-body">
        {#if running}
          <Stop size={16} weight="fill" />
          <span class="key-text">Zrušit</span>
        {:else}
          <Lightning size={16} weight="fill" />
          <span class="key-text">Řešit</span>
        {/if}
      </span>
    </Keycap>
  </Chassis>
</div>

<style>
  .rules-panel {
    display: flex;
    flex-direction: column;
    gap: var(--zone-input-gap);
    user-select: none;
    -webkit-user-select: none;
  }

  /* Flat strip of the game: it browses positions, it does not enter them. */
  .strip {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    /* With the key row below, as tall as the piece tray: switching modes keeps the board size */
    height: calc(var(--control-min-height) + 2px);
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
  }

  .strip::-webkit-scrollbar {
    display: none;
  }

  .chip {
    flex: 0 0 auto;
    height: var(--control-min-height);
    padding: 0 10px;
    display: inline-flex;
    align-items: center;
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs);
    background-color: var(--color-surface-2);
    color: var(--color-text-secondary);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    font-weight: 600;
    white-space: nowrap;
    box-sizing: border-box;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  .chip:active {
    background-color: var(--color-surface-active);
  }

  .chip.active {
    background-color: var(--color-accent-primary-subtle);
    border-color: var(--color-accent-primary);
    color: var(--color-accent-primary);
    box-shadow: inset 0 0 0 1px var(--color-accent-primary);
  }

  .chip.solution {
    background-color: var(--color-accent-success-subtle);
    border-color: var(--color-accent-success);
    color: var(--color-accent-success);
  }

  .strip-hint {
    flex: 0 0 auto;
    padding: 0 6px;
    color: var(--color-text-muted);
    font-size: var(--text-xs);
    white-space: nowrap;
  }

  .key-body {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-width: 0;
    max-width: 100%;
    padding: 0 var(--space-xs);
  }

  .key-text {
    font-size: var(--key-s);
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
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  /* The side to move in its piece colour (content, not a status) */
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
</style>
