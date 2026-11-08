<script lang="ts">
  import ModuleMenu from './ModuleMenu.svelte';
  import ReferenceModal from './ReferenceModal.svelte';
  import PodkladIntro from '../podklad/PodkladIntro.svelte';
  import PodkladMethods from '../podklad/PodkladMethods.svelte';
  import PodkladSheet from '../podklad/PodkladSheet.svelte';
  import { navigation } from '../../state/navigation.svelte';
  import {
    podklad as podkladState,
    flyToPodkladIcon,
    type PodkladConfig
  } from '../../state/podklad.svelte';

  interface Props {
    title?: string;
    hasAlphabet?: boolean;
    alphabetHint?: string;
    hasWarning?: boolean;
    onReset?: () => void;
    layoutMode?: 'default' | 'compact-output' | 'fullscreen-input';
    /** External data the module works on (DESIGN_SYSTEM §3 Podklad). */
    podklad?: PodkladConfig;
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
    podklad,
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

  $effect(() => {
    podkladState.config = podklad ?? null;
  });

  $effect(() => {
    return () => podkladState.reset();
  });

  // Required podklad still empty: the module shows the Podklad phase instead of its zones
  const showPodkladPhase = $derived(!!podklad && podklad.required && podklad.empty);

  let outputEl = $state<HTMLDivElement | null>(null);
  let wasPodkladPhase: boolean | null = null;

  $effect(() => {
    const phase = showPodkladPhase;
    if (wasPodkladPhase === true && !phase && outputEl) {
      flyToPodkladIcon(outputEl.getBoundingClientRect());
    }
    wasPodkladPhase = phase;
  });
</script>

<div
  class="module-shell"
  class:compact-output={layoutMode === 'compact-output'}
  class:fullscreen-input={layoutMode === 'fullscreen-input'}
>
  <!-- Top: Output & State Zone -->
  {#if layoutMode !== 'fullscreen-input'}
    <div class="zone-output" bind:this={outputEl}>
      {#if showPodkladPhase && podklad}
        <PodkladIntro config={podklad} />
      {:else if output}
        {@render output()}
      {/if}
    </div>
  {/if}

  <!-- Bottom: Input & Keypad Zone -->
  <div class="zone-input">
    {#if showPodkladPhase && podklad}
      <PodkladMethods config={podklad} />
    {:else if input}
      {@render input()}
    {/if}
  </div>

  {#if podklad}
    <PodkladSheet />
  {/if}

  <!-- Contextual Menu -->
  {#if navigation.hasMenuButton}
    <ModuleMenu {title} {hasAlphabet} {alphabetHint} {onReset} options={menuOptions} />
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
