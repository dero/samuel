<script lang="ts">
  import type { MonogramItem } from './frequencySolver';

  interface Props {
    monograms: MonogramItem[];
    totalChars: number;
    sortBy: 'freq' | 'alpha';
  }

  let { monograms, totalChars, sortBy }: Props = $props();

  const sortedList = $derived.by(() => {
    const list = [...monograms];
    if (sortBy === 'freq') {
      list.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.char.localeCompare(b.char, 'cs');
      });
    } else {
      list.sort((a, b) => a.char.localeCompare(b.char, 'cs'));
    }
    return list;
  });

  // Calculate the scale maximum for the bar tracks (at least 15% or max seen in text)
  const maxBarScale = $derived.by(() => {
    let max = 15;
    for (const item of monograms) {
      if (item.pct > max) max = item.pct;
      if (item.expectedPct !== null && item.expectedPct > max) max = item.expectedPct;
    }
    return Math.ceil(max * 1.1); // add 10% headroom
  });
</script>

<div class="monograms-view" data-allow-copy>
  <div class="list-container">
    {#each sortedList as item (item.char)}
      {@const fillWidth = Math.min(100, (item.pct / maxBarScale) * 100)}
      {@const expectedPos = item.expectedPct !== null ? Math.min(100, (item.expectedPct / maxBarScale) * 100) : null}
      <div class="mono-row" class:zero-count={item.count === 0}>
        <!-- Letter badge -->
        <div class="letter-keycap font-mono">
          {item.char}
        </div>

        <!-- Numbers -->
        <div class="metrics-col font-mono">
          <span class="count-val">{item.count}×</span>
          <span class="pct-val">{totalChars > 0 ? item.pct.toFixed(1) + '%' : '0.0%'}</span>
        </div>

        <!-- Bar Track & Reference Marker -->
        <div class="bar-col">
          <div class="bar-track">
            <!-- Actual percentage fill -->
            <div
              class="bar-fill"
              style:width="{fillWidth}%"
            ></div>

            <!-- Expected reference marker line -->
            {#if expectedPos !== null}
              <div
                class="expected-marker"
                style:left="{expectedPos}%"
                title="Český benchmark: {item.expectedPct?.toFixed(1)}%"
              >
                <span class="marker-dot"></span>
              </div>
            {/if}
          </div>

          <!-- Difference vs Reference -->
          {#if item.diffPct !== null && item.count > 0}
            <div
              class="diff-tag font-mono"
              class:diff-plus={item.diffPct > 1.5}
              class:diff-minus={item.diffPct < -1.5}
            >
              {item.diffPct > 0 ? '+' : ''}{item.diffPct.toFixed(1)}%
            </div>
          {:else if item.expectedPct !== null}
            <div class="diff-tag font-mono diff-expected">
              ~{item.expectedPct.toFixed(1)}%
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .monograms-view {
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  .list-container {
    flex: 1;
    overflow-y: auto;
    padding: 4px 2px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    box-sizing: border-box;
  }

  .mono-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 6px;
    background-color: var(--color-surface-1);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border-subtle);
    min-height: 36px;
    box-sizing: border-box;
  }

  .mono-row.zero-count {
    opacity: 0.35;
  }

  .letter-keycap {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-2);
    border-radius: 4px;
    font-size: 17px;
    font-weight: 700;
    color: var(--color-accent-primary);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    flex-shrink: 0;
  }

  .metrics-col {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    width: 44px;
    flex-shrink: 0;
  }

  .count-val {
    font-size: 14.5px;
    font-weight: 700;
    color: var(--color-text-primary);
    line-height: 1.1;
  }

  .pct-val {
    font-size: 12px;
    color: var(--color-text-secondary);
    line-height: 1.1;
  }

  .bar-col {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .bar-track {
    flex: 1;
    height: 10px;
    background-color: #000000;
    border-radius: 5px;
    position: relative;
    overflow: visible;
    border: 1px solid var(--color-border-subtle);
  }

  .bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-accent-primary) 0%, #34d399 100%);
    border-radius: 4px;
    transition: width 0.15s ease-out;
  }

  .expected-marker {
    position: absolute;
    top: -3px;
    bottom: -3px;
    width: 2px;
    background-color: #f59e0b; /* Amber */
    transform: translateX(-50%);
    z-index: 2;
  }

  .marker-dot {
    position: absolute;
    top: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: #f59e0b;
  }

  .diff-tag {
    font-size: 12px;
    width: 44px;
    text-align: right;
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }

  .diff-tag.diff-plus {
    color: #6ee7b7;
  }

  .diff-tag.diff-minus {
    color: #fca5a5;
  }

  .diff-expected {
    color: #f59e0b;
    opacity: 0.8;
  }
</style>
