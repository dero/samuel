<script lang="ts" module>
  export interface ModuleBarAction {
    label: string;
    icon?: any;
    tone?: 'neutral' | 'accent' | 'success' | 'warning';
    disabled?: boolean;
    title?: string;
    onClick: () => void;
  }

  export interface ModuleBarConfig {
    /** Next step while the module is empty (about 38 characters at most). */
    hint?: string;
    empty?: boolean;
    status?: string;
    /** Default status for modules with nothing better to say. */
    charCount?: number;
    warning?: string | null;
    action?: ModuleBarAction;
  }

  function formatCharCount(n: number): string {
    if (n === 1) return '1 znak';
    return n >= 2 && n <= 4 ? `${n} znaky` : `${n} znaků`;
  }
</script>

<script lang="ts">
  import { BookOpen } from 'phosphor-svelte';
  import Keycap from '../ui/Keycap.svelte';
  import { navigation } from '../../state/navigation.svelte';

  interface Props {
    config?: ModuleBarConfig;
    hasTahak: boolean;
  }

  let { config = {}, hasTahak }: Props = $props();

  // One text by priority: warning, then the hint of an empty module, then the status
  const isHint = $derived(!config.warning && !!config.empty && !!config.hint);
  const text = $derived.by(() => {
    if (config.warning) return config.warning;
    if (config.empty && config.hint) return config.hint;
    if (config.status) return config.status;
    return config.charCount != null ? formatCharCount(config.charCount) : '';
  });

  // The lamp: off while the module waits for input, on once it holds data, amber on a warning
  const lamp = $derived<'off' | 'on' | 'warning'>(
    config.warning ? 'warning' : config.empty ? 'off' : 'on'
  );

  // A hint needs the whole bar; an empty module has nothing to act on yet
  const action = $derived(isHint ? undefined : config.action);
  const tahakOpen = $derived(navigation.subView === 'tahak');
</script>

<!--
  The bar is a recessed display set into the top of the panel: the text says what the module
  is doing, the keys beside it are plastic so they read as pressable. Keys fire on a finished
  tap: the book opens the tahák over the bar, and a press on touch would land in it.
-->
<div class="module-bar">
  <div class="bar-display" class:is-warning={lamp === 'warning'}>
    <span class="bar-lamp lamp-{lamp}" aria-hidden="true"></span>
    <span class="bar-text" class:is-warning={lamp === 'warning'} class:is-hint={isHint}>{text}</span>

    {#if action}
      {@const Icon = action.icon}
      <Keycap
        compact
        pressOn="click"
        class="bar-key tone-{action.tone ?? 'neutral'}"
        disabled={action.disabled}
        title={action.title}
        onPress={action.onClick}
      >
        {#if Icon}
          <Icon size={14} weight="bold" />
        {/if}
        <span>{action.label}</span>
      </Keycap>
    {/if}

    {#if hasTahak}
      <Keycap
        compact
        pressOn="click"
        class="bar-key bar-book"
        selected={tahakOpen}
        ariaLabel="Tahák a návod"
        title="Tahák a návod"
        onPress={() => navigation.openTahak()}
      >
        <BookOpen size={16} weight="duotone" />
      </Keycap>
    {/if}
  </div>
</div>

<style>
  /* The panel's top edge: a ledge of panel surface around the display */
  .module-bar {
    flex: none;
    position: relative;
    z-index: 1;
    display: flex;
    height: var(--status-bar-height);
    padding: calc(var(--status-bar-height) - var(--bar-display-height) - 1px) var(--space-md) 0;
    background-color: var(--color-surface-1);
    border-top: 1px solid var(--color-border-subtle);
    box-sizing: border-box;
  }

  /* Sunken like the key chassis: the same black, rim and pressed-in shadow */
  .bar-display {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 2px;
    height: var(--bar-display-height);
    padding: 2px 2px 2px var(--space-sm);
    background-color: var(--color-bg-canvas);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-key-pressed);
    box-sizing: border-box;
    --key-hit-extend: 8px;
  }

  .bar-display.is-warning {
    border-color: color-mix(in srgb, var(--color-accent-warning) 45%, transparent);
  }

  .bar-lamp {
    flex: none;
    width: 7px;
    height: 7px;
    margin-right: 6px;
    border-radius: 50%;
    background-color: var(--color-border-subtle);
  }

  .bar-lamp.lamp-on {
    background-color: var(--color-accent-primary);
    box-shadow: 0 0 0 2px var(--color-accent-primary-subtle);
  }

  .bar-lamp.lamp-warning {
    background-color: var(--color-accent-warning);
    box-shadow: 0 0 0 2px var(--color-accent-warning-subtle);
  }

  .bar-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    padding-right: var(--space-xs);
    font-size: var(--text-xs);
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--color-text-primary);
  }

  .bar-text.is-hint {
    font-weight: 400;
    color: var(--color-text-secondary);
  }

  .bar-text.is-warning {
    color: var(--color-accent-warning);
  }

  .bar-display :global(.keycap.bar-book) {
    width: 36px;
    padding: 0;
  }

  .bar-display :global(.keycap.tone-accent) {
    color: var(--color-accent-primary);
  }

  .bar-display :global(.keycap.tone-success) {
    color: var(--color-accent-success);
  }

  .bar-display :global(.keycap.tone-warning) {
    color: var(--color-accent-warning);
  }
</style>
