<script lang="ts">
  import { MODULE_GROUPS } from '../../types';
  import { navigation } from '../../state/navigation.svelte';
  import { settings } from '../../state/settings.svelte';
  import { versionService } from '../../services/versionService.svelte';
  import {
    launcher,
    LAUNCHER_ENTRIES,
    matchesSearch,
    normalizeSearch,
    type LauncherEntry
  } from '../../state/launcher.svelte';
  import BottomSheet from '../ui/BottomSheet.svelte';
  import ModuleIcon from '../ui/ModuleIcon.svelte';
  import { SquaresFour, MagnifyingGlass } from 'phosphor-svelte';

  const COLUMNS = 4;

  let query = $state('');
  let searchFocused = $state(false);
  let searchEl = $state<HTMLInputElement | null>(null);
  let listEl = $state<HTMLDivElement | null>(null);

  const isSearching = $derived(searchFocused || query.trim() !== '');

  // Fades at the list edges say "more tiles this way", even when a row ends flush with the edge
  let fadeTop = $state(false);
  let fadeBottom = $state(false);

  function updateFades() {
    if (!listEl) return;
    const { scrollTop, scrollHeight, clientHeight } = listEl;
    fadeTop = scrollTop > 2;
    fadeBottom = scrollTop + clientHeight < scrollHeight - 2;
  }

  $effect(() => {
    if (!listEl) return;
    const observer = new ResizeObserver(updateFades);
    observer.observe(listEl);
    if (listEl.firstElementChild) observer.observe(listEl.firstElementChild);
    updateFades();
    return () => observer.disconnect();
  });

  // Filter out: tiles keep their place, non-matching ones (and empty groups) disappear
  const matches = $derived(LAUNCHER_ENTRIES.filter((e) => matchesSearch(e, query)));

  // One block per group (in group order), entries sorted alphabetically (Czech) inside
  const groupBlocks = $derived(
    MODULE_GROUPS.map((group) => {
      const entries = matches
        .filter((e) => e.group === group.id)
        .sort((a, b) => a.name.localeCompare(b.name, 'cs'));
      const fillers = (COLUMNS - (entries.length % COLUMNS)) % COLUMNS;
      return { group, entries, fillers };
    }).filter((block) => block.entries.length > 0)
  );

  // Most recent first, without the tile you are in (switching back and forth stays one tap)
  const recentEntries = $derived(
    launcher.recent
      .filter((id) => id !== navigation.activeEntryId)
      .map((id) => LAUNCHER_ENTRIES.find((e) => e.id === id))
      .filter((e): e is LauncherEntry => !!e)
      .slice(0, COLUMNS)
  );

  // Fresh launcher on every open: empty query, list from the top
  $effect(() => {
    if (navigation.isLauncherOpen) {
      query = '';
      if (listEl) listEl.scrollTop = 0;
    }
  });

  function groupColor(entry: LauncherEntry) {
    return MODULE_GROUPS.find((g) => g.id === entry.group)?.color;
  }

  function handleSelect(entry: LauncherEntry) {
    settings.vibrate(20);
    searchEl?.blur();
    launcher.record(entry.id);
    if (entry.shortcut) {
      navigation.openShortcut(entry.shortcut);
    } else {
      navigation.openModule(entry.target);
    }
  }

  function handleSearchKeydown(e: KeyboardEvent) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    // A tile named by the query beats one matched only by an alias ("trojk" → Trojkovka, not Čísla)
    const shown = groupBlocks.flatMap((b) => b.entries);
    const q = normalizeSearch(query);
    const best = shown.find((entry) => normalizeSearch(entry.name).startsWith(q)) ?? shown[0];
    if (best) handleSelect(best);
  }
</script>

{#snippet tile(entry: LauncherEntry)}
  <button
    type="button"
    class="module-btn"
    class:is-active={navigation.activeEntryId === entry.id}
    style:--group-color={groupColor(entry)}
    onclick={() => handleSelect(entry)}
  >
    <span class="icon">
      <ModuleIcon id={entry.icon} weight="duotone" />
    </span>
    <span class="name">{entry.name}</span>
    {#if entry.shortcut}
      <span class="via">{entry.shortcut.via}</span>
    {/if}
    {#if entry.id === 'settings' && versionService.state.updateAvailable}
      <span class="update-dot" title="K dispozici je aktualizace"></span>
    {/if}
  </button>
{/snippet}

<BottomSheet
  open={navigation.isLauncherOpen}
  title="Výběr pomůcky"
  icon={SquaresFour}
  onClose={() => navigation.closeLauncher()}
  maxWidth="540px"
  maxHeight="80dvh"
  height="80dvh"
  padding={false}
  scrollable={false}
>
  <div class="launcher">
    <div class="list-frame" class:fade-top={fadeTop} class:fade-bottom={fadeBottom}>
      <div class="launcher-list" bind:this={listEl} onscroll={updateFades}>
        <div class="launcher-groups" class:is-searching={isSearching}>
          {#each groupBlocks as { group, entries, fillers } (group.id)}
            <section class="group-block" style:--group-color={group.color} aria-label={group.name}>
              <div class="group-label" aria-hidden="true">
                <span class="group-label-text">{group.name}</span>
              </div>
              <div class="modules-grid">
                {#each entries as entry (entry.id)}
                  {@render tile(entry)}
                {/each}
                {#each Array(fillers) as _}
                  <div class="grid-filler" aria-hidden="true"></div>
                {/each}
              </div>
            </section>
          {:else}
            <p class="no-results">Nic nenalezeno. Zkuste začátek názvu, např. „bin“.</p>
          {/each}
        </div>
      </div>
    </div>

    <!-- Thumb zone: recent tiles and the search field -->
    <div class="launcher-footer">
      {#if !isSearching && recentEntries.length > 0}
        <section class="group-block recent-block" aria-label="Nedávné">
          <div class="group-label recent-label" aria-hidden="true">
            <span class="group-label-text">Nedávné</span>
          </div>
          <div class="modules-grid">
            {#each recentEntries as entry (entry.id)}
              {@render tile(entry)}
            {/each}
            {#each Array(COLUMNS - recentEntries.length) as _}
              <div class="grid-filler" aria-hidden="true"></div>
            {/each}
          </div>
        </section>
      {/if}

      <label class="search-row">
        <MagnifyingGlass size={18} weight="bold" />
        <input
          bind:this={searchEl}
          bind:value={query}
          type="search"
          class="search-input"
          placeholder="Hledej modul…"
          aria-label="Hledat modul"
          enterkeyhint="go"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          onfocus={() => (searchFocused = true)}
          onblur={() => (searchFocused = false)}
          onkeydown={handleSearchKeydown}
        />
      </label>
    </div>
  </div>
</BottomSheet>

<style>
  .launcher {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .list-frame {
    position: relative;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .list-frame::before,
  .list-frame::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 40px;
    pointer-events: none;
    z-index: 1;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .list-frame::before {
    top: 0;
    height: 24px;
    background: linear-gradient(to bottom, var(--color-surface-1), transparent);
  }

  .list-frame::after {
    bottom: 0;
    background: linear-gradient(to top, var(--color-surface-1), transparent);
  }

  .list-frame.fade-top::before,
  .list-frame.fade-bottom::after {
    opacity: 1;
  }

  .launcher-list {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }

  .launcher-groups {
    display: flex;
    flex-direction: column;
    gap: 1px;
    background-color: var(--color-border-subtle);
  }

  /* While searching, the few results sit right above the field (and the keyboard) */
  .launcher-groups.is-searching {
    margin-top: auto;
  }

  .launcher-footer {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md) max(var(--space-md), env(safe-area-inset-bottom, 0px));
    background-color: var(--color-surface-1);
    border-top: 1px solid var(--color-border-subtle);
  }

  .recent-block {
    background-color: var(--color-border-subtle);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .no-results {
    margin: 0;
    padding: var(--space-lg) var(--space-md);
    background-color: var(--color-surface-1);
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    text-align: center;
  }

  .search-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    height: var(--tap-min-size);
    padding: 0 var(--space-md);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
    box-sizing: border-box;
    transition: border-color 0.12s ease;
  }

  .search-row:focus-within {
    border-color: var(--color-border-focus);
  }

  .search-input {
    flex: 1;
    min-width: 0;
    height: 100%;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 0;
    color: var(--color-text-primary);
    font-family: var(--font-sans);
    font-size: var(--text-base);
  }

  .search-input:focus {
    outline: none;
  }

  .search-input::placeholder {
    color: var(--color-text-muted);
  }

  .group-block {
    display: flex;
    gap: 1px;
  }

  /* Vertical group name, read bottom-to-top like a book spine */
  .group-label {
    flex: none;
    width: calc(20px * var(--font-scale));
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background-color: var(--group-color);
  }

  /* Recent tiles are not a category: neutral spine, tiles keep their own group colors */
  .recent-label {
    background-color: var(--color-surface-3);
  }

  .recent-label .group-label-text {
    color: var(--color-text-secondary);
  }

  .group-label-text {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    max-height: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--font-condensed);
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.3px;
    color: var(--color-text-inverse);
  }

  .modules-grid {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1px;
  }

  .module-btn,
  .grid-filler {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-sm) 2px;
    background-color: var(--color-surface-1);
    border: none;
    border-radius: 0;
    gap: 5px;
    min-height: 68px;
    box-sizing: border-box;
  }

  .grid-filler {
    background-color: var(--color-surface-sunken);
  }

  .module-btn {
    transition: background-color 0.12s ease;
    touch-action: manipulation;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  @media (hover: hover) {
    .module-btn:hover {
      background-color: var(--color-surface-2);
    }
  }

  .module-btn:active {
    background-color: var(--color-surface-active);
  }

  /* Active module in its group color (primary accent stays for in-module controls) */
  .module-btn.is-active {
    background-color: var(--color-surface-2);
    background-color: color-mix(in srgb, var(--group-color) 14%, var(--color-surface-1));
    box-shadow: inset 0 0 0 1px var(--group-color);
  }

  .module-btn.is-active .name {
    color: var(--group-color);
    font-weight: 700;
  }

  .update-dot {
    position: absolute;
    top: 6px;
    right: 8px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--color-accent-primary);
    box-shadow: 0 0 6px var(--color-accent-primary);
  }

  .icon {
    font-size: calc(24px * var(--font-scale));
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--group-color);
  }

  .name {
    font-family: var(--font-condensed);
    font-size: var(--text-xs);
    font-weight: 500;
    letter-spacing: 0.05px;
    text-align: center;
    line-height: 1.15;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 98%;
  }

  /* Shortcut tiles: where they lead, under the name */
  .via {
    margin-top: -4px;
    font-family: var(--font-condensed);
    font-size: min(calc(10px * var(--font-scale)), 3.2vw);
    line-height: 1.1;
    color: var(--color-text-muted);
    white-space: nowrap;
  }
</style>
