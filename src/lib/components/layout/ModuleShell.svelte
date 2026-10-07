<script lang="ts">
  import ModuleMenu from './ModuleMenu.svelte';
  import ReferenceModal from './ReferenceModal.svelte';
  import { navigation } from '../../state/navigation.svelte';

  interface Props {
    title?: string;
    hasAlphabet?: boolean;
    alphabetHint?: string;
    hasWarning?: boolean;
    onReset?: () => void;
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
    hasWarning = false,
    onReset,
    layoutMode = 'default',
    output,
    input,
    menuOptions,
    reference
  }: Props = $props();

  $effect(() => {
    navigation.setMenuWarning(hasWarning);
    return () => {
      navigation.setMenuWarning(false);
    };
  });
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
  {#if navigation.activeModule?.hasMenu !== false}
    <ModuleMenu {title} {hasAlphabet} {alphabetHint} {onReset}>
      {#if menuOptions}
        {@render menuOptions()}
      {/if}
    </ModuleMenu>
  {/if}

  <!-- Reference Modal -->
  {#if navigation.activeModule?.hasReference !== false}
    <ReferenceModal>
      {#if reference}
        {@render reference()}
      {/if}
    </ReferenceModal>
  {/if}
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
    max-height: none;
    border-top: none;
    background-color: var(--color-bg-canvas);
    padding: 0;
    overflow: hidden;
  }
</style>
