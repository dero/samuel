<script lang="ts">
  import { untrack } from 'svelte';
  import { navigation } from '../../state/navigation.svelte';
  import { settings } from '../../state/settings.svelte';
  import { versionService } from '../../services/versionService.svelte';
  import {
    launcher,
    LAUNCHER_ENTRIES,
    rankEntries,
    normalizeSearch,
    type LauncherEntry,
    type RankedEntry
  } from '../../state/launcher.svelte';
  import { MODULES } from '../../types';
  import ModuleIcon from '../ui/ModuleIcon.svelte';
  import ScrollArea from '../ui/ScrollArea.svelte';
  import {
    X,
    MagnifyingGlass,
    Question,
    GearSix,
    ClockCounterClockwise,
    KeyReturn
  } from 'phosphor-svelte';

  /**
   * The launcher is a page of its own (`#/moduly`): browse an alphabetical grid of every tool,
   * or search, which swaps the grid for a ranked list whose best hit sits right at the field.
   * Built for many more tools than fit one screen: no categories, no colours, no fillers.
   */

  const SYSTEM_IDS = new Set(MODULES.filter((m) => m.isSystem).map((m) => m.id as string));

  // Modules and shortcuts in one alphabetical flow; Nápověda and Nastavení sit by the search
  const gridEntries = LAUNCHER_ENTRIES.filter((e) => !SYSTEM_IDS.has(e.id)).sort((a, b) =>
    a.name.localeCompare(b.name, 'cs')
  );

  let query = $state('');
  let searchFocused = $state(false);
  let searchEl = $state<HTMLInputElement | null>(null);
  let gridViewport = $state<HTMLDivElement | null>(null);

  const hasQuery = $derived(query.trim() !== '');

  const ranked = $derived<RankedEntry[]>(rankEntries(LAUNCHER_ENTRIES, query, launcher.recent));

  // Most recent first, without the tile you are in (switching back and forth stays one tap)
  const recentEntries = $derived(
    launcher.recent
      .filter((id) => id !== navigation.activeEntryId)
      .map((id) => LAUNCHER_ENTRIES.find((e) => e.id === id))
      .filter((e): e is LauncherEntry => !!e)
  );

  // Rows above the field: search hits, or every recent entry while the empty field has focus.
  // Listed best last, so the best one is nearest the thumb and the field.
  const rows = $derived<RankedEntry[]>(
    hasQuery
      ? [...ranked].reverse()
      : searchFocused
        ? recentEntries.map((entry) => ({ entry, score: 0 })).reverse()
        : []
  );
  const showRows = $derived(hasQuery || (searchFocused && recentEntries.length > 0));
  const enterTarget = $derived(hasQuery ? ranked[0]?.entry : undefined);

  // Fresh launcher on every open: empty query, grid from the top. Only the opening counts:
  // the grid unmounting while the player searches must not clear the query.
  $effect(() => {
    if (!navigation.isLauncherOpen) return;
    untrack(() => {
      query = '';
      if (gridViewport) gridViewport.scrollTop = 0;
    });
  });

  // Follows the visual viewport, so the search field stays above an overlaying keyboard (iOS)
  let viewportHeight = $state<number | null>(null);
  let viewportTop = $state(0);
  $effect(() => {
    const viewport = window.visualViewport;
    if (!viewport || !navigation.isLauncherOpen) return;
    const update = () => {
      viewportHeight = viewport.height;
      viewportTop = viewport.offsetTop;
    };
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  });

  function open(entry: LauncherEntry) {
    settings.vibrate(20);
    searchEl?.blur();
    launcher.record(entry.id);
    if (entry.shortcut) navigation.openShortcut(entry.shortcut);
    else navigation.openModule(entry.target);
  }

  function openSystem(id: 'help' | 'settings') {
    settings.vibrate(20);
    navigation.openModule(id);
  }

  function handleSearchKeydown(e: KeyboardEvent) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (enterTarget) open(enterTarget);
  }

  // The alias part that matched, split so the typed beginnings can be bold
  function reasonParts(reason: string): { text: string; hit: boolean }[] {
    const queryWords = normalizeSearch(query).split(/\s+/).filter(Boolean);
    return reason.split(/(\s+)/).flatMap((word) => {
      const length = queryWords
        .filter((q) => normalizeSearch(word).startsWith(q))
        .reduce((max, q) => Math.max(max, q.length), 0);
      return length > 0
        ? [
            { text: word.slice(0, length), hit: true },
            { text: word.slice(length), hit: false }
          ]
        : [{ text: word, hit: false }];
    });
  }
</script>

{#if navigation.isLauncherOpen}
  <div
    class="launcher"
    role="dialog"
    aria-label="Nástroje"
    style:height={viewportHeight ? `${viewportHeight}px` : undefined}
    style:top={viewportTop ? `${viewportTop}px` : undefined}
  >
    <header class="launcher-head">
      <button
        type="button"
        class="head-close"
        aria-label="Zavřít výběr nástrojů"
        onclick={() => {
          settings.vibrate(20);
          navigation.closeLauncher();
        }}
      >
        <X size={22} weight="bold" />
      </button>
      <h2 class="head-title">Nástroje</h2>
    </header>

    {#if showRows}
      <!-- Search: a ranked list, best at the bottom right by the field -->
      <div class="rows-zone">
        <ScrollArea outset="var(--space-md)">
          <!-- Keeps focus in the field: a blur would hide the recent rows before the tap lands -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div class="rows" onpointerdown={(e) => e.preventDefault()}>
            {#each rows as { entry, reason } (entry.id)}
              {@const isTarget = entry === enterTarget}
              <button type="button" class="row" class:is-target={isTarget} onclick={() => open(entry)}>
                <span class="row-icon"><ModuleIcon id={entry.icon} weight="duotone" /></span>
                <span class="row-name">
                  {entry.name}
                  {#if entry.shortcut}<span class="row-via">{entry.shortcut.via}</span>{/if}
                </span>
                {#if reason}
                  <span class="row-reason">
                    {#each reasonParts(reason) as part, i (i)}{#if part.hit}<b>{part.text}</b>{:else}{part.text}{/if}{/each}
                  </span>
                {/if}
                {#if isTarget}
                  <span class="row-enter" aria-label="Otevře se klávesou Enter"><KeyReturn size={16} weight="bold" /></span>
                {/if}
              </button>
            {:else}
              <p class="no-results">Nic nenalezeno. Zkuste začátek názvu, např. „bin“.</p>
            {/each}
          </div>
        </ScrollArea>
      </div>
    {:else}
      <!-- Browse: every tool, alphabetically -->
      <div class="grid-zone">
        <ScrollArea outset="var(--space-md)" bind:viewport={gridViewport}>
          <div class="grid">
            {#each gridEntries as entry (entry.id)}
              <button
                type="button"
                class="tile"
                class:is-active={navigation.activeEntryId === entry.id}
                onclick={() => open(entry)}
              >
                <span class="tile-icon"><ModuleIcon id={entry.icon} weight="duotone" /></span>
                <span class="tile-name">{entry.name}</span>
                {#if entry.shortcut}
                  <span class="tile-via">{entry.shortcut.via}</span>
                {/if}
              </button>
            {/each}
          </div>
        </ScrollArea>
      </div>
    {/if}

    <footer class="launcher-foot">
      {#if !showRows && recentEntries.length > 0}
        <div class="recent" aria-label="Nedávné">
          <span class="recent-icon" aria-hidden="true"><ClockCounterClockwise size={18} weight="bold" /></span>
          <div class="recent-chips">
            {#each recentEntries as entry (entry.id)}
              <button type="button" class="chip" onclick={() => open(entry)}>
                <span class="chip-icon"><ModuleIcon id={entry.icon} weight="duotone" /></span>
                <span>{entry.name}</span>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <div class="search-line">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="search-row" onclick={() => searchEl?.focus()}>
          <MagnifyingGlass size={18} weight="bold" />
          <input
            bind:this={searchEl}
            bind:value={query}
            type="search"
            class="search-input"
            placeholder="Hledej nástroj…"
            aria-label="Hledat nástroj"
            enterkeyhint="go"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            onfocus={() => (searchFocused = true)}
            onblur={() => (searchFocused = false)}
            onkeydown={handleSearchKeydown}
          />
          {#if showRows}
            <!-- Back to the grid: clears the query and lets the keyboard go -->
            <button
              type="button"
              class="search-clear"
              aria-label="Zpět na všechny nástroje"
              onpointerdown={(e) => e.preventDefault()}
              onclick={(e) => {
                e.stopPropagation();
                settings.vibrate(20);
                query = '';
                searchEl?.blur();
              }}
            >
              <X size={18} weight="bold" />
            </button>
          {/if}
        </div>
        <button type="button" class="icon-btn" aria-label="Nápověda" onclick={() => openSystem('help')}>
          <Question size={20} weight="bold" />
        </button>
        <button type="button" class="icon-btn" aria-label="Nastavení" onclick={() => openSystem('settings')}>
          <GearSix size={20} weight="bold" />
          {#if versionService.state.updateAvailable}
            <span class="update-dot" title="K dispozici je aktualizace"></span>
          {/if}
        </button>
      </div>
    </footer>
  </div>
{/if}

<style>
  .launcher {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 100dvh;
    z-index: 300;
    display: flex;
    flex-direction: column;
    background-color: var(--color-bg-canvas);
  }

  .launcher-head {
    flex: none;
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    height: var(--header-height);
    padding: 0 var(--space-md) 0 var(--space-xs);
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .head-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: none;
    background: transparent;
    color: var(--color-text-primary);
    cursor: pointer;
  }

  .head-title {
    margin: 0;
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .grid-zone,
  .rows-zone {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 0 var(--space-md);
  }

  /* Browse */
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
    gap: var(--space-xs);
    padding: var(--space-md) 0;
  }

  .tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-width: 0;
    min-height: 64px;
    padding: var(--space-sm) 2px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    cursor: pointer;
  }

  .tile:active {
    background-color: var(--color-surface-active);
  }

  .tile.is-active {
    border-color: var(--color-accent-primary);
    box-shadow: inset 0 0 0 1px var(--color-accent-primary);
  }

  .tile-icon {
    display: flex;
    font-size: 24px;
    color: var(--color-text-secondary);
  }

  .tile-name {
    max-width: 100%;
    overflow: hidden;
    font-size: min(var(--text-xs), 3.4vw);
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tile-via {
    max-width: 100%;
    overflow: hidden;
    font-size: min(var(--text-xs), 3vw);
    color: var(--color-text-muted);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Search rows: pushed to the bottom, the best one last */
  .rows {
    flex: 1 0 auto;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: var(--space-xs);
    padding: var(--space-md) 0 var(--space-xs);
  }

  .row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-height: 40px;
    padding: 0 var(--space-sm);
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    text-align: left;
    cursor: pointer;
  }

  .row:active {
    background-color: var(--color-surface-active);
  }

  .row.is-target {
    background-color: var(--color-accent-primary-subtle);
    border-color: var(--color-accent-primary);
  }

  .row-icon {
    flex: none;
    display: flex;
    font-size: 20px;
    color: var(--color-text-secondary);
  }

  .row-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    font-size: var(--text-sm);
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .row-via {
    margin-left: var(--space-xs);
    font-weight: 400;
    color: var(--color-text-muted);
  }

  .row-reason {
    flex: none;
    max-width: 50%;
    overflow: hidden;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .row-reason b {
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .row-enter {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-accent-primary);
  }

  .no-results {
    margin: 0;
    padding: var(--space-md) var(--space-sm);
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  /* Thumb zone */
  .launcher-foot {
    flex: none;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md) calc(var(--space-md) + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid var(--color-border-subtle);
    background-color: var(--color-surface-1);
  }

  .recent {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-width: 0;
  }

  .recent-icon {
    flex: none;
    display: flex;
    color: var(--color-text-muted);
  }

  .recent-chips {
    flex: 1;
    display: flex;
    gap: var(--space-xs);
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
    overscroll-behavior: contain;
  }

  .recent-chips::-webkit-scrollbar {
    display: none;
  }

  .chip {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: var(--control-min-height);
    padding: 0 var(--space-sm);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: var(--text-xs);
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
  }

  .chip:active {
    background-color: var(--color-surface-active);
  }

  .chip-icon {
    display: flex;
    font-size: 16px;
    color: var(--color-text-secondary);
  }

  .search-line {
    display: flex;
    gap: var(--space-xs);
  }

  .search-row {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-width: 0;
    height: 44px;
    padding: 0 var(--space-md);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-medium);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
  }

  .search-row:focus-within {
    border-color: var(--color-border-focus);
  }

  .search-clear {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    margin-right: calc(-1 * var(--space-sm));
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
  }

  /* The field's own clear button would duplicate ours */
  .search-input::-webkit-search-cancel-button {
    display: none;
  }

  .search-input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    outline: none;
    color: var(--color-text-primary);
    font-size: var(--text-base);
  }

  .icon-btn {
    position: relative;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
    cursor: pointer;
  }

  .icon-btn:active {
    background-color: var(--color-surface-active);
  }

  .update-dot {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 8px;
    height: 8px;
    border-radius: var(--radius-full);
    background-color: var(--color-accent-warning);
  }
</style>
