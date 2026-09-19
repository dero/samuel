<script lang="ts">
  import ModuleMenu from './ModuleMenu.svelte';
  import ReferenceModal from './ReferenceModal.svelte';

  interface Props {
    title?: string;
    hasAlphabet?: boolean;
    alphabetHint?: string;
    onReset?: () => void;
    onPaste?: (text: string) => void;
    layoutMode?: 'default' | 'compact-output' | 'fullscreen-input';
    output?: import('svelte').Snippet;
    input?: import('svelte').Snippet;
    menuOptions?: import('svelte').Snippet;
    reference?: import('svelte').Snippet;
  }

  let {
    title,
    hasAlphabet = false,
    alphabetHint,
    onReset,
    onPaste,
    layoutMode = 'default',
    output,
    input,
    menuOptions,
    reference
  }: Props = $props();
</script>

<div
  class="module-shell"
  class:compact-output={layoutMode === 'compact-output'}
  class:fullscreen-input={layoutMode === 'fullscreen-input'}
>
  <!-- Top: Output & State Zone -->
  {#if layoutMode !== 'fullscreen-input'}
    <div class="zone-output">
      {#if output}
        {@render output()}
      {/if}
    </div>
  {/if}

  <!-- Bottom: Input & Keypad Zone -->
  <div class="zone-input">
    {#if input}
      {@render input()}
    {/if}
  </div>

  <!-- Contextual Menu -->
  <ModuleMenu {title} {hasAlphabet} {alphabetHint} {onReset} {onPaste}>
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
    flex: 1 1 0px;
    min-height: var(--output-min-height);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: var(--space-sm) var(--space-md);
    overflow: hidden;
    box-sizing: border-box;
  }

  .zone-input {
    flex: 0 0 auto;
    max-height: calc(100% - var(--output-min-height));
    padding: var(--space-sm) var(--space-md) calc(var(--space-md) + env(safe-area-inset-bottom, 0px)) var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--zone-input-gap);
    background-color: var(--color-surface-1);
    border-top: 1px solid var(--color-border-subtle);
    box-sizing: border-box;
  }

  .compact-output .zone-output {
    flex: 0 0 auto;
    padding: var(--space-sm) var(--space-md);
  }

  .compact-output .zone-input {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .fullscreen-input .zone-input {
    flex: 1;
    min-height: 0;
    height: 100%;
    border-top: none;
    background-color: var(--color-bg-canvas);
    padding: var(--space-xs) var(--space-sm) calc(var(--space-xs) + env(safe-area-inset-bottom, 0px)) var(--space-sm);
    overflow: hidden;
  }
</style>
