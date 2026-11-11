<script lang="ts">
  import type { Snippet } from 'svelte';
  import Keycap from '../../components/ui/Keycap.svelte';

  /**
   * Keycap that keeps stepping while held. The first step comes from the Keycap itself
   * (with its haptic); the repeats run in timers and stay silent.
   */
  interface Props {
    label?: string;
    size?: 's' | 'm' | 'l';
    ariaLabel: string;
    title?: string;
    onStep: () => void;
    children?: Snippet;
  }

  let { label, size = 's', ariaLabel, title, onStep, children }: Props = $props();

  const REPEAT_DELAY_MS = 320;
  const REPEAT_INTERVAL_MS = 80;

  let delayTimer: ReturnType<typeof setTimeout> | null = null;
  let repeatTimer: ReturnType<typeof setInterval> | null = null;

  function stop() {
    if (delayTimer) clearTimeout(delayTimer);
    if (repeatTimer) clearInterval(repeatTimer);
    delayTimer = null;
    repeatTimer = null;
    window.removeEventListener('blur', stop);
    document.removeEventListener('visibilitychange', stop);
  }

  function start(e: PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    stop();
    // A release that lands in another window never reaches the key
    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', stop);
    delayTimer = setTimeout(() => {
      repeatTimer = setInterval(onStep, REPEAT_INTERVAL_MS);
    }, REPEAT_DELAY_MS);
  }

  $effect(() => stop);
</script>

<div
  class="repeat-key"
  role="presentation"
  onpointerdown={start}
  onpointerup={stop}
  onpointerleave={stop}
  onpointercancel={stop}
>
  <Keycap {label} {size} {ariaLabel} {title} {children} onPress={onStep} />
</div>

<style>
  .repeat-key {
    display: flex;
    min-width: 0;
  }
</style>
