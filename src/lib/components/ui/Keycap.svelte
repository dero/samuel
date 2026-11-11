<script lang="ts">
  import type { Snippet } from 'svelte';
  import { settings } from '../../state/settings.svelte';

  /**
   * The plastic key: the single source of its look and press behaviour.
   * Reserved for elements that directly enter the module's main input (DESIGN_SYSTEM §8).
   * Fires on pointerdown for immediate feedback. Needs a definite height from its parent
   * (see Chassis `keyHeight`), because the label is capped relative to the key's own height.
   */
  interface Props {
    label?: string;
    sublabel?: string;
    size?: 's' | 'm' | 'l';
    disabled?: boolean;
    /** The key is the active choice: accent fill and a full ring. */
    selected?: boolean;
    /** The key belongs to the active choice (its row or column): a thin ring. */
    related?: boolean;
    title?: string;
    ariaLabel?: string;
    haptic?: number | number[];
    /**
     * `click` waits for a finished tap: needed where the browser demands a user activation
     * (clipboard, file picker), which a touch pointerdown does not give.
     */
    pressOn?: 'pointerdown' | 'click';
    /**
     * A small key sized by its content, for the bar display. It is drawn lower than the 32 px
     * minimum, so its tap area reaches past the display's rim above and below.
     */
    compact?: boolean;
    class?: string;
    onPress: () => void;
    children?: Snippet;
  }

  let {
    label,
    sublabel,
    size = 'm',
    disabled = false,
    selected = false,
    related = false,
    title,
    ariaLabel,
    haptic = 20,
    pressOn = 'pointerdown',
    compact = false,
    class: customClass = '',
    onPress,
    children
  }: Props = $props();

  let isPressed = $state(false);

  // A key disabled mid-press may never get its pointerup (delegated events skip disabled targets)
  $effect(() => {
    if (disabled) isPressed = false;
  });

  function press() {
    settings.vibrate(haptic);
    onPress();
  }

  function handlePointerDown(e: PointerEvent) {
    if (disabled) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    isPressed = true;
    if (pressOn === 'click') return;
    e.preventDefault();
    press();
  }

  function release() {
    isPressed = false;
  }

  // detail === 0: keyboard or assistive tech; pointer presses already fired on pointerdown
  function handleClick(e: MouseEvent) {
    if (disabled) return;
    if (pressOn === 'click' || e.detail === 0) press();
  }
</script>

<button
  type="button"
  class="keycap size-{size} {customClass}"
  class:is-pressed={isPressed}
  class:is-selected={selected}
  class:is-related={related}
  class:has-sublabel={!!sublabel}
  class:has-icon={!!children && !!sublabel}
  class:is-compact={compact}
  {disabled}
  title={title ?? sublabel}
  aria-label={ariaLabel ?? sublabel}
  onpointerdown={handlePointerDown}
  onpointerup={release}
  onpointerleave={release}
  onpointercancel={release}
  oncontextmenu={(e) => e.preventDefault()}
  onclick={handleClick}
>
  {#if children}
    {@render children()}
  {:else}
    <span class="key-label">{label}</span>
  {/if}
  {#if sublabel}
    <span class="key-sublabel">{sublabel}</span>
  {/if}
</button>

<style>
  .keycap {
    container-type: size;
    --key-size: var(--key-m);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    width: 100%;
    height: var(--key-height, 100%);
    min-height: var(--control-min-height);
    padding: 0;
    border: none;
    border-radius: 2px;
    background-color: var(--color-key-surface);
    box-shadow: var(--shadow-key);
    color: var(--color-text-primary);
    cursor: pointer;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    box-sizing: border-box;
    transition: background-color 0.08s ease, box-shadow 0.08s ease;
  }

  /* Content-sized: no size container, which would collapse an auto width to nothing */
  .keycap.is-compact {
    container-type: normal;
    position: relative;
    flex-direction: row;
    gap: var(--space-xs);
    width: auto;
    height: 100%;
    min-height: 0;
    padding: 0 var(--space-sm);
    font-size: var(--text-xs);
    font-weight: 700;
    white-space: nowrap;
  }

  .keycap.is-compact::after {
    content: '';
    position: absolute;
    inset: calc(-1 * var(--key-hit-extend, 6px)) 0;
  }

  .size-s {
    --key-size: var(--key-s);
  }

  .size-l {
    --key-size: var(--key-l);
  }

  .keycap:active:not(:disabled),
  .keycap.is-pressed:not(:disabled) {
    background-color: var(--color-key-active);
    box-shadow: var(--shadow-key-pressed);
  }

  .keycap.is-selected {
    background-color: var(--color-accent-primary-subtle);
    box-shadow: inset 0 0 0 2px var(--color-accent-primary);
    color: var(--color-accent-primary);
  }

  .keycap.is-related {
    box-shadow: inset 0 0 0 1px var(--color-accent-primary);
  }

  /* A toggle shows its new state while the finger is still down, not only after release */
  .keycap.is-selected:active:not(:disabled),
  .keycap.is-selected.is-pressed:not(:disabled) {
    background-color: var(--color-accent-primary-subtle);
    box-shadow: inset 0 0 0 2px var(--color-accent-primary), var(--shadow-key-pressed);
  }

  .keycap:disabled {
    cursor: not-allowed;
  }

  /* The key itself is always the event target, never its label */
  .keycap > :global(*) {
    pointer-events: none;
  }

  .keycap:disabled > * {
    opacity: 0.48;
  }

  .key-label {
    font-family: var(--font-mono);
    font-size: min(var(--key-size), 60cqh);
    font-weight: 800;
    line-height: 1;
  }

  /* Label and sublabel share the key height, so both shrink to fit it together */
  .has-sublabel .key-label {
    font-size: min(var(--key-size), 48cqh);
  }

  .has-sublabel .key-sublabel {
    font-size: min(var(--text-xs), 3.6vw, 26cqh);
  }

  /* Icon over caption: on a 36 px bottom-row key the caption is 10 px under a 16 px icon,
     centred, so there is air above the icon and below the caption. Taller keys (Želva)
     stay capped by width and the text token. */
  .has-icon .key-sublabel {
    font-size: min(var(--text-xs), 3.6vw, 28cqh);
    line-height: 1.2;
  }

  .key-sublabel {
    /* Capped by width: a third of a 320px keypad must still fit "ODDĚLOVAČ" */
    max-width: 95%;
    overflow: hidden;
    font-size: min(var(--text-xs), 3.6vw);
    font-weight: 700;
    letter-spacing: 0.5px;
    text-overflow: ellipsis;
    text-transform: uppercase;
    white-space: nowrap;
    color: var(--color-text-secondary);
  }
</style>
