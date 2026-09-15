<script lang="ts">
  import ModuleMenu from './ModuleMenu.svelte';
  import ReferenceModal from './ReferenceModal.svelte';

  interface Props {
    hasAlphabet?: boolean;
    onReset?: () => void;
    onPaste?: (text: string) => void;
    layoutMode?: 'default' | 'compact-output';
    output?: import('svelte').Snippet;
    input?: import('svelte').Snippet;
    menuOptions?: import('svelte').Snippet;
    reference?: import('svelte').Snippet;
  }

  let {
    hasAlphabet = false,
    onReset,
    onPaste,
    layoutMode = 'default',
    output,
    input,
    menuOptions,
    reference
  }: Props = $props();
</script>

<div class="module-shell" class:compact-output={layoutMode === 'compact-output'}>
  <!-- Top: Output & State Zone -->
  <div class="zone-output">
    {#if output}
      {@render output()}
    {/if}
  </div>

  <!-- Bottom: Input & Keypad Zone -->
  <div class="zone-input">
    {#if input}
      {@render input()}
    {/if}
  </div>

  <!-- Contextual Menu -->
  <ModuleMenu {hasAlphabet} {onReset} {onPaste}>
    {#if menuOptions}
      {@render menuOptions()}
    {/if}
  </ModuleMenu>

  <!-- Reference Modal -->
  <ReferenceModal>
    {#if reference}
      {@render reference()}
    {/if}
  </ReferenceModal>
</div>

<style>
  .module-shell {
    flex: 1;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    background-color: var(--color-bg-canvas);
  }

  .zone-output {
    flex: 1;
    min-height: var(--output-min-height);
    display: flex;
    flex-direction: column;
    padding: var(--space-md) var(--space-md) var(--space-xs) var(--space-md);
    overflow: hidden;
    box-sizing: border-box;
  }

  .zone-input {
    flex-shrink: 0;
    padding: var(--space-xs) var(--space-md) calc(var(--space-lg) + env(safe-area-inset-bottom, 0px)) var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    background-color: var(--color-surface-1);
    border-top: 1px solid var(--color-border-subtle);
    box-sizing: border-box;
  }

  .compact-output .zone-output {
    flex: 0 0 auto;
    padding: var(--space-sm) var(--space-md) var(--space-xs) var(--space-md);
  }

  .compact-output .zone-input {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
</style>
