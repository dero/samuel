<script lang="ts">
  import type { Snippet } from 'svelte';
  import ModuleBar, { type ModuleBarConfig } from './ModuleBar.svelte';
  import ModuleMenu from './ModuleMenu.svelte';
  import TahakView from './TahakView.svelte';
  import PodkladIntro from '../podklad/PodkladIntro.svelte';
  import PodkladPanel from '../podklad/PodkladPanel.svelte';
  import ScrollArea from '../ui/ScrollArea.svelte';
  import { navigation } from '../../state/navigation.svelte';
  import { podklad as podkladState, type PodkladConfig } from '../../state/podklad.svelte';

  /**
   * Module skeleton: output → status bar → optional variants row → lower panel.
   * The header tabs switch only the lower panel (Interakce / Podklad / Menu).
   */
  interface Props {
    title?: string;
    hasAlphabet?: boolean;
    alphabetHint?: string;
    hasWarning?: boolean;
    onReset?: () => void;
    layoutMode?: 'default' | 'compact-output' | 'fullscreen-input';
    /** User data the module works on (DESIGN_SYSTEM §7). */
    podklad?: PodkladConfig;
    /** Left text and action of the status bar (DESIGN_SYSTEM §5). */
    bar?: ModuleBarConfig;
    output?: Snippet;
    /** Flavour switcher at the top of the Interakce panel. */
    variants?: Snippet;
    input?: Snippet;
    menuOptions?: Snippet;
    reference?: Snippet;
    /** One item over the whole area (`#/<module>/detail/<id>`), rendered from its id. */
    detail?: Snippet<[string]>;
    /** Heading of the detail overlay, from the item id. */
    detailTitle?: (id: string) => string;
  }

  let {
    hasWarning = false,
    onReset,
    layoutMode = 'default',
    podklad,
    bar,
    output,
    variants,
    input,
    menuOptions,
    reference,
    detail,
    detailTitle
  }: Props = $props();

  const view = $derived(navigation.subView);
  const isFullscreen = $derived(layoutMode === 'fullscreen-input');
  // A Menu holding only Reset adds nothing to the hold-clear, so only options make a Menu
  const hasMenu = $derived(!!menuOptions);
  const hasTahak = $derived(!!reference && navigation.activeModule?.hasReference !== false);
  const showInteraction = $derived(view !== 'podklad' && view !== 'menu');
  const isPodkladMissing = $derived(!!podklad && podklad.required && podklad.empty);

  $effect(() => {
    navigation.setMenuWarning(hasWarning);
    return () => navigation.setMenuWarning(false);
  });

  $effect(() => {
    navigation.hasMenu = hasMenu;
  });

  $effect(() => {
    podkladState.config = podklad ?? null;
  });

  $effect(() => {
    return () => podkladState.reset();
  });

  // Views this module cannot show (old links), and the required podklad that must come first
  $effect(() => {
    if (navigation.isLauncherOpen) return; // the route belongs to the launcher, keep it
    if (view === 'menu' && !hasMenu) navigation.replaceView('none');
    else if (view === 'podklad' && !podklad) navigation.replaceView('none');
    else if (view === 'tahak' && !hasTahak) navigation.replaceView('none');
    else if (view === 'detail' && !detail) navigation.replaceView('none');
    else if (view === 'none' && isPodkladMissing) navigation.replaceView('podklad');
  });

  let zoneEl = $state<HTMLDivElement | null>(null);

  // Typing in Podklad with the OS keyboard open: the output steps aside for the editor
  const isKeyboardEditing = $derived(view === 'podklad' && podkladState.keyboardOpen);

  // A short slide when a tab changes the panel height
  let heightBefore = 0;

  $effect.pre(() => {
    void view;
    if (zoneEl) heightBefore = zoneEl.offsetHeight;
  });

  $effect(() => {
    void view;
    if (!zoneEl || !heightBefore) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const heightAfter = zoneEl.offsetHeight;
    if (heightAfter === heightBefore) return;
    zoneEl.animate(
      [{ height: `${heightBefore}px` }, { height: `${heightAfter}px` }],
      { duration: 160, easing: 'ease-out' }
    );
  });
</script>

<div
  class="module-shell"
  class:compact-output={layoutMode === 'compact-output'}
  class:fullscreen-input={isFullscreen}
  class:is-keyboard={isKeyboardEditing}
  style:padding-bottom={podkladState.keyboardInset ? `${podkladState.keyboardInset}px` : undefined}
>
  {#if !isFullscreen}
    <div class="zone-output">
      {#if isPodkladMissing && podklad}
        <PodkladIntro config={podklad} />
      {:else if output}
        {@render output()}
      {/if}
    </div>

    <ModuleBar config={bar} {hasTahak} />
  {/if}

  <div
    class="zone-input"
    class:is-panel={!showInteraction}
    bind:this={zoneEl}
  >
    <!-- Stays mounted: switching tabs must not lose what the keypad holds -->
    <div class="panel-interaction" class:is-hidden={!showInteraction}>
      {#if variants}
        <div class="variants-row">
          {@render variants()}
        </div>
      {/if}
      {#if input}
        {@render input()}
      {/if}
    </div>

    {#if view === 'podklad' && podklad}
      <!-- Both editors fill the panel: the text scrolls itself, the photo fits its frame -->
      <div class="panel-fill">
        <PodkladPanel config={podklad} />
      </div>
    {:else if view === 'menu' && hasMenu}
      <ScrollArea outset="var(--space-md)" outsetLeft="var(--space-md)">
        <ModuleMenu {onReset} options={menuOptions} />
      </ScrollArea>
    {/if}
  </div>

  {#if view === 'tahak' && hasTahak && reference}
    <TahakView>
      {@render reference()}
    </TahakView>
  {:else if view === 'detail' && detail && navigation.detailId}
    {@const detailId = navigation.detailId}
    <TahakView
      title={detailTitle?.(detailId) ?? ''}
      closeLabel="Zavřít"
      showIcon={false}
      scrollable
      onClose={() => navigation.closeDetail()}
    >
      {@render detail(detailId)}
    </TahakView>
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
    box-sizing: border-box;
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

  .variants-row {
    flex: none;
    display: flex;
    align-items: center;
    height: var(--subtoolbar-height);
    overflow: hidden;
  }

  .zone-input {
    flex: 0 0 auto;
    max-height: calc(100% - var(--output-min-height) - var(--status-bar-height));
    padding: var(--zone-input-offset) var(--space-md) calc(var(--space-md) + env(safe-area-inset-bottom, 0px));
    display: flex;
    flex-direction: column;
    gap: var(--zone-input-gap);
    background-color: var(--color-surface-1);
    box-sizing: border-box;
  }

  .panel-interaction {
    display: contents;
  }

  .panel-interaction.is-hidden {
    display: none;
  }

  /* Podklad and Menu: always half the screen, whatever the Interakce panel needs */
  .zone-input.is-panel {
    height: 50dvh;
  }

  .panel-fill {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  /* Keyboard open in Podklad: header, bar and the editor fill what the keyboard leaves */
  .module-shell.is-keyboard .zone-output {
    display: none;
  }

  .module-shell.is-keyboard .zone-input {
    flex: 1 1 auto;
    height: auto;
    min-height: 0;
    max-height: none;
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
    background-color: var(--color-bg-canvas);
    padding: 0;
    overflow: hidden;
  }
</style>
