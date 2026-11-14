<script lang="ts">
  import { DISPLAY_CONFIGS, DISPLAY_VIEWBOX, type DisplayType } from './displaysData';

  interface Props {
    type: DisplayType;
    segments: string;
    size?: 'sm' | 'md';
  }

  let { type, segments, size = 'sm' }: Props = $props();

  const config = $derived(DISPLAY_CONFIGS[type]);
  const activeSet = $derived(new Set([...segments]));
</script>

<div class="display-thumb size-{size}" aria-hidden="true">
  <svg viewBox={DISPLAY_VIEWBOX} class="thumb-svg">
    {#each config.segments as seg (seg.id)}
      <polygon
        points={seg.points}
        class="thumb-seg"
        class:is-on={activeSet.has(seg.id)}
      />
    {/each}
  </svg>
</div>

<style>
  .display-thumb {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3px 4px;
    background-color: var(--color-surface-sunken);
    border: 1px solid var(--color-border-subtle);
    border-radius: 4px;
    flex-shrink: 0;
  }

  .display-thumb.size-sm {
    width: 28px;
    height: 40px;
  }

  .display-thumb.size-md {
    width: 34px;
    height: 48px;
  }

  .thumb-svg {
    width: 100%;
    height: 100%;
    display: block;
    overflow: visible;
  }

  .thumb-seg {
    fill: var(--color-surface-3);
    opacity: 0.45;
  }

  .thumb-seg.is-on {
    fill: var(--color-accent-primary);
    opacity: 1;
    filter: drop-shadow(0 0 3px var(--color-accent-primary-glow));
  }
</style>
