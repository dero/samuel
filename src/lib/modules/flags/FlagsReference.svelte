<script lang="ts">
  import {
    LETTER_FLAGS,
    NUMBER_FLAGS,
    FLAG_COLORS,
    type FlagItem
  } from './flagsData';
  import FlagSvg from './FlagSvg.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';

  let activeTab = $state<'letters' | 'numbers'>('letters');

  const tabs: SegmentOption<'letters' | 'numbers'>[] = [
    { id: 'letters', label: 'Písmena', badge: LETTER_FLAGS.length },
    { id: 'numbers', label: 'Číslice', badge: NUMBER_FLAGS.length }
  ];

  function getColorHex(colorId: string): string {
    return FLAG_COLORS.find((c) => c.id === colorId)?.hex ?? '#888';
  }

  function getColorName(colorId: string): string {
    return FLAG_COLORS.find((c) => c.id === colorId)?.name ?? colorId;
  }
</script>

<div class="ref-container">
  <!-- Pinned Top: Tabs -->
  <div class="pinned-header">
    <SegmentedControl
      options={tabs}
      value={activeTab}
      onChange={(val) => (activeTab = val)}
    />
  </div>

  <!-- Scrollable entries area -->
  <div class="table-scroll">
    {#if activeTab === 'letters'}
      <div class="flags-list">
        {#each LETTER_FLAGS as flag (flag.code)}
          <div class="flag-card">
            <div class="flag-preview-box">
              <FlagSvg {flag} />
            </div>

            <div class="flag-info">
              <div class="flag-title-row">
                <span class="flag-code">{flag.code}</span>
                <span class="flag-nato">{flag.name}</span>
              </div>

              <div class="flag-meaning">
                {flag.meaning}
              </div>

              <div class="flag-colors-row">
                {#each flag.colors as c}
                  <span
                    class="color-dot"
                    style:background-color={getColorHex(c)}
                    title={getColorName(c)}
                  ></span>
                {/each}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="flags-list">
        {#each NUMBER_FLAGS as flag (flag.code)}
            <div class="flag-card">
              <div class="flag-preview-box pennant">
                <FlagSvg {flag} />
              </div>

              <div class="flag-info">
                <div class="flag-title-row">
                  <span class="flag-code">{flag.code}</span>
                  <span class="flag-nato">{flag.name}</span>
                </div>

                <div class="flag-colors-row">
                  {#each flag.colors as c}
                    <span
                      class="color-dot"
                      style:background-color={getColorHex(c)}
                      title={getColorName(c)}
                    ></span>
                  {/each}
                </div>
              </div>
            </div>
          {/each}
        </div>
    {/if}
  </div>
</div>

<style>
  .ref-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    gap: var(--space-sm);
  }

  .pinned-header {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }



  .table-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    padding-bottom: var(--space-lg);
    padding-right: 2px;
  }

  .flags-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .flag-card {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: var(--space-xs) var(--space-sm);
  }

  .flag-preview-box {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .flag-preview-box.pennant {
    width: 56px;
    height: 32px;
  }

  .flag-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .flag-title-row {
    display: flex;
    align-items: baseline;
    gap: var(--space-sm);
  }

  .flag-code {
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-accent-primary);
    font-family: var(--font-condensed);
    min-width: 18px;
  }

  .flag-nato {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .flag-meaning {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    line-height: 1.35;
  }

  .flag-colors-row {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 2px;
  }

  .color-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

</style>
