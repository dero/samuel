<script lang="ts">
  import { settings } from '../../state/settings.svelte';

  interface Props {
    label: string;
    value: string | number;
    onIncrement: () => void;
    onDecrement: () => void;
  }

  let { label, value, onIncrement, onDecrement }: Props = $props();

  let timer: ReturnType<typeof setTimeout> | null = null;
  let interval: ReturnType<typeof setInterval> | null = null;

  function clearTimers() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  function handleMinus(e: PointerEvent) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    clearTimers();
    settings.vibrate(20);
    onDecrement();

    timer = setTimeout(() => {
      interval = setInterval(() => {
        settings.vibrate(15);
        onDecrement();
      }, 80);
    }, 320);
  }

  function handlePlus(e: PointerEvent) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    clearTimers();
    settings.vibrate(20);
    onIncrement();

    timer = setTimeout(() => {
      interval = setInterval(() => {
        settings.vibrate(15);
        onIncrement();
      }, 80);
    }, 320);
  }
</script>

<div class="number-stepper">
  <button
    type="button"
    class="stepper-btn minus-btn"
    aria-label="Snížit {label}"
    onpointerdown={handleMinus}
    onpointerup={clearTimers}
    onpointerleave={clearTimers}
    onpointercancel={clearTimers}
    oncontextmenu={(e) => e.preventDefault()}
  >
    <span>−</span>
  </button>

  <div class="stepper-display">
    <span class="stepper-label">{label}</span>
    <span class="stepper-val">{value}</span>
  </div>

  <button
    type="button"
    class="stepper-btn plus-btn"
    aria-label="Zvýšit {label}"
    onpointerdown={handlePlus}
    onpointerup={clearTimers}
    onpointerleave={clearTimers}
    onpointercancel={clearTimers}
    oncontextmenu={(e) => e.preventDefault()}
  >
    <span>+</span>
  </button>
</div>

<style>
  .number-stepper {
    display: flex;
    align-items: stretch;
    height: 40px;
    background-color: var(--color-surface-2, #1c1c1c);
    border: 1px solid var(--color-border-subtle, #2a2a2a);
    border-radius: var(--radius-sm, 6px);
    overflow: hidden;
    box-sizing: border-box;
    flex: 1;
    min-width: 0;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
  }

  .stepper-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 100%;
    background-color: var(--color-surface-1, #121212);
    border: none;
    color: var(--color-text-primary, #ffffff);
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
    touch-action: none;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
    transition: background-color 0.08s ease, color 0.08s ease;
  }

  .stepper-btn:active {
    background-color: var(--color-surface-active, #333333);
    color: var(--color-accent-primary, #00d2ff);
  }

  .stepper-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    min-width: 0;
    padding: 0 2px;
    line-height: 1.1;
  }

  .stepper-label {
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--color-text-muted, #828282);
  }

  .stepper-val {
    font-size: 13.5px;
    font-weight: 800;
    font-family: var(--font-mono, monospace);
    color: var(--color-text-primary, #ffffff);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
