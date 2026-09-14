<script lang="ts">
  import ModuleMenu from './ModuleMenu.svelte';
  import ReferenceModal from './ReferenceModal.svelte';

  interface Props {
    hasAlphabet?: boolean;
    onReset?: () => void;
    onPaste?: (text: string) => void;
    output?: import('svelte').Snippet;
    input?: import('svelte').Snippet;
    menuOptions?: import('svelte').Snippet;
    reference?: import('svelte').Snippet;
  }

  let {
    hasAlphabet = false,
    onReset,
    onPaste,
    output,
    input,
    menuOptions,
    reference
  }: Props = $props();
</script>

<div class="module-shell">
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
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 12px;
    overflow: hidden;
  }

  .zone-input {
    flex-shrink: 0;
    padding-bottom: max(8px, env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    background-color: var(--color-surface-1);
    border-top: 1px solid var(--color-border-subtle);
  }
</style>
