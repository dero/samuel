<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import SegmentedControl from '../../components/ui/SegmentedControl.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import TextEntrySheet from '../../components/ui/TextEntrySheet.svelte';
  import StatusBar from '../../components/ui/StatusBar.svelte';
  import WordsReference from './WordsReference.svelte';
  import {
    type WordsMode,
    type WordMatch,
    WORDS_SEGMENT_OPTIONS
  } from './wordsData';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import { versionService } from '../../services/versionService.svelte';
  import { localSettingsService } from '../../services/localSettingsService';
  import { onMount, onDestroy } from 'svelte';
  import {
    PencilSimple,
    ClipboardText,
    X,
    Database,
    DownloadSimple,
    SpinnerGap
  } from 'phosphor-svelte';

  const modSettings = localSettingsService.forModule('words');

  // Submodule / Mode
  let activeSubmodule = $state<WordsMode>(
    (modSettings.getString('mode', 'mask') as WordsMode) || 'mask'
  );

  // Input query
  let query = $state<string>(modSettings.getString('query', ''));
  let showTextSheet = $state<boolean>(false);

  // Options (per user specifications)
  let ignoreDiacritics = $state<boolean>(
    modSettings.getBoolean('ignore_diacritics', true)
  );
  let useRegex = $state<boolean>(
    modSettings.getBoolean('use_regex', false)
  );
  let onlySubstantives = $state<boolean>(
    modSettings.getBoolean('only_substantives', true)
  );
  let includeProperNames = $state<boolean>(
    modSettings.getBoolean('include_proper_names', false)
  );
  let includeRuian = $state<boolean>(
    modSettings.getBoolean('include_ruian', true)
  );

  // Persistence
  $effect(() => {
    modSettings.setString('mode', activeSubmodule);
    modSettings.setString('query', query);
    modSettings.setBoolean('ignore_diacritics', ignoreDiacritics);
    modSettings.setBoolean('use_regex', useRegex);
    modSettings.setBoolean('only_substantives', onlySubstantives);
    modSettings.setBoolean('include_proper_names', includeProperNames);
    modSettings.setBoolean('include_ruian', includeRuian);
  });

  // Automatically discard spaces if in mask mode
  $effect(() => {
    if (activeSubmodule === 'mask' && /\s/.test(query)) {
      query = query.replace(/\s+/g, '');
    }
  });

  function handleReset() {
    settings.vibrate(25);
    query = '';
    toast.show('Slovník vyčištěn', { type: 'success' });
  }


  async function handlePaste() {
    settings.vibrate(20);
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        query = activeSubmodule === 'mask' ? clip.trim().replace(/\s+/g, '') : clip.trim();
        toast.show('✓ Vloženo ze schránky', { type: 'success' });
      }
    } catch {
      toast.show('Nelze číst schránku', { type: 'danger' });
    }
  }

  // Worker communication
  let worker: Worker | null = null;
  let results = $state<WordMatch[]>([]);
  let hasMore = $state<boolean>(false);
  let isLoading = $state<boolean>(false);
  let searchError = $state<string | null>(null);
  let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  let nextRequestId = 0;
  let activeCopiedWord = $state<string | null>(null);

  onMount(() => {
    worker = new Worker(new URL('./words.worker.ts', import.meta.url), {
      type: 'module'
    });

    worker.onmessage = (e: MessageEvent) => {
      const { type, results: res, hasMore: more, error } = e.data;
      if (type === 'result') {
        isLoading = false;
        searchError = error || null;
        results = res || [];
        hasMore = Boolean(more);
      } else if (type === 'error') {
        isLoading = false;
        searchError = error || 'Chyba vyhledávání';
        results = [];
        hasMore = false;
      }
    };

    if (versionService.state.isDbInstalled) {
      worker.postMessage({ id: nextRequestId++, type: 'init' });
    }
  });

  onDestroy(() => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    if (worker) {
      worker.terminate();
      worker = null;
    }
  });

  // Re-run search when query, mode, or settings change
  $effect(() => {
    const q = query;
    const m = activeSubmodule;
    const reg = useRegex;
    const diac = ignoreDiacritics;
    const subs = onlySubstantives;
    const prop = includeProperNames;
    const rui = includeRuian;
    const dbReady = versionService.state.isDbInstalled;

    if (!dbReady || !q.trim()) {
      results = [];
      isLoading = false;
      searchError = null;
      return;
    }

    isLoading = true;
    searchError = null;

    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      if (!worker) return;
      worker.postMessage({
        id: nextRequestId++,
        type: 'search',
        query: q,
        mode: m,
        useRegex: reg,
        ignoreDiacritics: diac,
        onlySubstantives: subs,
        includeProperNames: prop,
        includeRuian: rui,
        limit: 1000
      });
    }, 120);
  });

  function handleWordClick(w: string) {
    settings.vibrate(35);
    activeCopiedWord = w;
    setTimeout(() => {
      if (activeCopiedWord === w) activeCopiedWord = null;
    }, 350);

    navigator.clipboard.writeText(w).then(
      () => {
        toast.show(`✓ Zkopírováno: ${w}`, { type: 'success' });
      },
      () => {
        toast.show('Nelze zkopírovat do schránky', { type: 'danger' });
      }
    );
  }

  async function handleDownloadDatabase() {
    settings.vibrate(20);
    try {
      toast.show('Stahuji slovníkovou databázi...', { type: 'info' });
      await versionService.downloadDb();
      toast.show('Databáze byla stažena', { type: 'success' });
      if (worker) {
        worker.postMessage({ id: nextRequestId++, type: 'init' });
      }
    } catch (err: any) {
      toast.show(`Chyba stažení: ${err?.message || 'Neznámá chyba'}`, { type: 'danger' });
    }
  }
</script>

<ModuleShell
  title="Slovník"
  hasAlphabet={false}
  onReset={handleReset}
  onPaste={handlePaste}
>
  <!-- TOP ZONE: Output (Word results list or Empty State) -->
  {#snippet output()}
    <div class="words-output-stage">
      {#if !versionService.state.isDbInstalled}
        <!-- DB Not Installed State -->
        <div class="db-uninstalled-card">
          <div class="db-icon-circle">
            <Database size={28} weight="bold" />
          </div>
          <div class="db-title">Slovníková databáze není stažena</div>
          <div class="db-desc">
            Pro offline vyhledávání ve slovníku a přesmyčkách je nutné stáhnout databázi (cca 102 MB).
          </div>
          <button
            type="button"
            class="download-db-btn"
            onclick={handleDownloadDatabase}
            disabled={versionService.state.status === 'downloading_db'}
          >
            {#if versionService.state.status === 'downloading_db'}
              <SpinnerGap size={18} weight="bold" class="spin-icon" />
              <span>Stahuji ({versionService.state.progress}%)...</span>
            {:else}
              <DownloadSimple size={18} weight="bold" />
              <span>Stáhnout databázi</span>
            {/if}
          </button>
        </div>
      {:else if !query.trim()}
        <!-- Empty State Prompt -->
        <button
          type="button"
          class="empty-hint-card"
          onclick={() => {
            settings.vibrate(20);
            showTextSheet = true;
          }}
          aria-label="Klepnutím zadat vzor nebo písmena"
        >
          <div class="empty-hint-title">
            {#if activeSubmodule === 'mask'}
              Zadej masku s tečkami (např. k..k.a)
            {:else}
              Zadej písmena pro složení přesmyčky
            {/if}
          </div>
          <div class="empty-hint-sub">
            {#if activeSubmodule === 'mask'}
              Tečka <code>.</code> nahrazuje 1 znak, hvězdička <code>*</code> libovolně mnoho znaků.
            {:else}
              Např. <code>KOTELNA</code> najde přesné přesmyčky i kratší podslova.
            {/if}
          </div>
        </button>
      {:else}
        <!-- Results Stage Header using universal StatusBar -->
        <StatusBar>
          {#snippet left()}
            {#if isLoading}
              <span class="loading-label font-mono">
                <SpinnerGap size={13} weight="bold" class="spin-icon" />
                <span>Hledám...</span>
              </span>
            {:else if searchError}
              <span class="error-label font-mono">{searchError}</span>
            {:else if results.length === 0}
              <span class="font-mono">Žádná slova nenalezena</span>
            {:else if hasMore || results.length >= 1000}
              <span class="font-mono">1000+ výsledků</span>
            {:else}
              <span class="font-mono">
                {results.length} {results.length === 1 ? 'výsledek' : results.length < 5 ? 'výsledky' : 'výsledků'}
              </span>
            {/if}
          {/snippet}

          {#snippet right()}
            <span class="status-badge-wrap">
              <span class="nature-pill font-mono">
                {activeSubmodule === 'mask' ? 'Maska' : 'Přesmyčka'}
              </span>
            </span>
          {/snippet}
        </StatusBar>

        <div class="results-scroll-container" data-allow-contextmenu>
          {#each results as match, index (match.word)}
            <button
              type="button"
              class="word-card"
              class:is-copied={activeCopiedWord === match.word}
              onclick={() => handleWordClick(match.word)}
            >
              <div class="word-card-left">
                <span class="word-rank font-mono">{index + 1}.</span>
                <span class="word-text font-mono">{match.word}</span>
                {#if match.isName}
                  <span class="word-tag font-mono">vlastní</span>
                {/if}
              </div>
              <span class="word-len font-mono">({match.len})</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/snippet}

  <!-- BOTTOM ZONE: Sub-Toolbar & Single-line Input Trigger -->
  {#snippet input()}
    <div class="zone-input-flow">
      <!-- 1. Sub-Toolbar: Mode selector (36 px) -->
      <div class="subtoolbar-container">
        <SegmentedControl
          options={WORDS_SEGMENT_OPTIONS}
          value={activeSubmodule}
          size="sm"
          onChange={(m) => {
            activeSubmodule = m;
          }}
          ariaLabel="Režim slovníku"
        />
      </div>

      <!-- 2. Single-line Input Row (42 px) - Click opens TextEntrySheet -->
      <div class="input-row">
        <button
          type="button"
          class="cipher-input-trigger font-mono"
          onclick={() => {
            settings.vibrate(20);
            showTextSheet = true;
          }}
          title={activeSubmodule === 'mask' ? 'Klepnutím zadat masku' : 'Klepnutím zadat písmena'}
          aria-label="Klepnutím zadat text"
        >
          {#if query}
            <span class="trigger-text">{query}</span>
          {:else}
            <span class="trigger-placeholder">
              {activeSubmodule === 'mask' ? 'Zadat masku...' : 'Zadat písmena...'}
            </span>
          {/if}
        </button>

        {#if query}
          <button
            type="button"
            class="input-clear-btn"
            onclick={() => {
              settings.vibrate(15);
              query = '';
            }}
            title="Vymazat dotaz"
            aria-label="Vymazat dotaz"
          >
            <X size={15} weight="bold" />
          </button>
        {/if}

        <button
          type="button"
          class="input-sheet-btn"
          onclick={() => {
            settings.vibrate(20);
            showTextSheet = true;
          }}
          title="Otevřít textový editor"
          aria-label="Otevřít textový editor"
        >
          <PencilSimple size={16} weight="bold" />
        </button>

        <button
          type="button"
          class="input-paste-btn"
          onclick={handlePaste}
          title="Vložit text ze schránky"
          aria-label="Vložit text ze schránky"
        >
          <ClipboardText size={17} weight="bold" />
        </button>
      </div>
    </div>
  {/snippet}

  <!-- Contextual Menu Options -->
  {#snippet menuOptions()}
    <div class="menu-group">
      <div class="menu-group-title">Slovníkový korpus</div>
      <OptionRow
        label="Pouze podstatná jména"
        hint="Omezit hledání na česká substantiva (vynechat slovesa, přídavná jména a tvary)"
        checked={onlySubstantives}
        onChange={(val) => {
          onlySubstantives = val;
        }}
      />
      <OptionRow
        label="Zahrnout vlastní jména"
        hint="Povolit jména osob, příjmení a zeměpisná vlastní jména (např. Karel, Praha, Novák)"
        checked={includeProperNames}
        onChange={(val) => {
          includeProperNames = val;
        }}
      />
      <OptionRow
        label="Zahrnout místopis"
        hint="Prohledávat také názvy českých obcí, částí obcí a ulic z RÚIAN"
        checked={includeRuian}
        onChange={(val) => {
          includeRuian = val;
        }}
      />
    </div>

    <div class="menu-group">
      <div class="menu-group-title">Nastavení vyhledávání</div>
      <OptionRow
        label="Ignorovat diakritiku"
        hint="Hledat bez ohledu na háčky a čárky (např. 'kocka' najde i 'kočka')"
        checked={ignoreDiacritics}
        onChange={(val) => {
          ignoreDiacritics = val;
        }}
      />
      <OptionRow
        label="Používat regex syntaxi"
        hint="Povolit plné regulární výrazy JavaScriptu (např. ^[k-m].*a$)"
        checked={useRegex}
        onChange={(val) => {
          useRegex = val;
        }}
      />
    </div>
  {/snippet}

  <!-- Reference Modal -->
  {#snippet reference()}
    <WordsReference />
  {/snippet}
</ModuleShell>

<!-- Multi-line Text Entry Sheet with Quick Action Characters and space discarding in mask mode -->
<TextEntrySheet
  open={showTextSheet}
  title={activeSubmodule === 'mask' ? 'Maska' : 'Přesmyčka'}
  value={query}
  placeholder={activeSubmodule === 'mask' ? 'Např. K..KA nebo POD*...' : 'Např. KOTELNA...'}
  quickInsertChars={activeSubmodule === 'mask' ? ['.', '*'] : []}
  discardSpaces={activeSubmodule === 'mask'}
  autocapitalize={activeSubmodule === 'mask' ? 'none' : 'characters'}
  inputmode={activeSubmodule === 'mask' ? 'search' : 'text'}
  onSave={(val) => {
    query = activeSubmodule === 'mask' ? val.replace(/\s+/g, '') : val;
  }}
  onClose={() => {
    showTextSheet = false;
  }}
/>

<style>
  .words-output-stage {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    background-color: var(--color-bg-canvas);
    overflow: hidden;
  }

  /* Empty State Card */
  .empty-hint-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--space-lg);
    background: transparent;
    border: none;
    cursor: pointer;
    gap: var(--space-xs);
  }

  .empty-hint-title {
    color: var(--color-text-secondary);
    font-size: var(--text-base);
    font-weight: 600;
  }

  .empty-hint-sub {
    color: var(--color-text-muted);
    font-size: var(--text-xs);
    max-width: 320px;
    line-height: 1.4;
  }

  .empty-hint-sub code {
    color: var(--color-accent-primary);
    background-color: var(--color-surface-2);
    padding: 2px 5px;
    border-radius: var(--radius-xs);
    font-family: var(--font-mono);
  }

  /* DB Uninstalled Card */
  .db-uninstalled-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--space-lg);
    gap: var(--space-sm);
  }

  .db-icon-circle {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-full);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-accent-primary);
  }

  .db-title {
    color: var(--color-text-primary);
    font-size: var(--text-base);
    font-weight: 700;
  }

  .db-desc {
    color: var(--color-text-secondary);
    font-size: var(--text-xs);
    max-width: 300px;
    line-height: 1.4;
  }

  .download-db-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 var(--space-md);
    height: 40px;
    background-color: var(--color-accent-primary);
    color: #000000;
    border: none;
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0, 210, 255, 0.3);
    margin-top: var(--space-xs);
    transition: opacity 0.12s ease, transform 0.08s ease;
  }

  .download-db-btn:active:not(:disabled) {
    transform: scale(0.97);
  }

  .download-db-btn:disabled {
    opacity: 0.7;
    cursor: wait;
  }

  /* Results Header & Status Bar Details */
  .status-badge-wrap {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
  }

  .nature-pill {
    font-size: 10.5px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 4px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    color: var(--color-accent-primary);
    white-space: nowrap;
  }

  .loading-label {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--color-accent-primary);
  }

  .error-label {
    color: var(--color-accent-danger);
  }

  .results-scroll-container {
    flex: 1;
    width: 100%;
    box-sizing: border-box;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 0 0 var(--space-sm) 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .word-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    box-sizing: border-box;
    min-height: 38px;
    height: 38px;
    padding: 0 10px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    cursor: pointer;
    content-visibility: auto;
    contain-intrinsic-size: 38px;
    transition: background-color 0.1s ease, border-color 0.1s ease, transform 0.06s ease;
  }

  .word-card:active {
    background-color: var(--color-surface-active);
    transform: scale(0.99);
  }

  .word-card.is-copied {
    border-color: var(--color-accent-success);
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.35);
  }

  .word-card-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    overflow: hidden;
  }

  .word-rank {
    color: var(--color-text-muted);
    font-size: 11px;
    font-weight: 600;
    min-width: 22px;
    text-align: left;
    margin: 0;
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
    user-select: none;
  }

  .word-text {
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .word-len {
    color: var(--color-text-muted);
    font-size: 11px;
    font-weight: 600;
    margin-left: 8px;
    flex-shrink: 0;
  }

  .word-tag {
    display: inline-flex;
    align-items: center;
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 1px 4.5px;
    border-radius: 3px;
    background-color: rgba(255, 255, 255, 0.07);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border-subtle);
    flex-shrink: 0;
    line-height: 1.2;
    user-select: none;
  }

  /* Zone Input Flow */
  .zone-input-flow {
    display: flex;
    flex-direction: column;
    gap: var(--zone-input-gap, 8px);
    width: 100%;
    box-sizing: border-box;
  }

  .subtoolbar-container {
    height: 36px;
    display: flex;
    align-items: center;
    overflow: hidden;
    flex-shrink: 0;
  }

  /* Single-line Input Row */
  .input-row {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    min-height: 42px;
    height: 42px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: 3px 6px;
    box-sizing: border-box;
    transition: border-color 0.12s ease;
  }

  .input-row:focus-within {
    border-color: var(--color-border-focus);
    box-shadow: 0 0 8px rgba(0, 210, 255, 0.15);
  }

  .cipher-input-trigger {
    flex: 1;
    min-width: 0;
    height: 100%;
    background: transparent;
    border: none;
    outline: none;
    display: flex;
    align-items: center;
    text-align: left;
    padding: 0 4px;
    cursor: pointer;
    overflow: hidden;
  }

  .trigger-text {
    color: var(--color-text-primary);
    font-size: var(--text-base);
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.5px;
  }

  .trigger-placeholder {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    font-family: var(--font-sans);
    font-weight: 400;
  }

  .input-clear-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    border-radius: var(--radius-xs);
    flex-shrink: 0;
    transition: color 0.1s ease, background-color 0.1s ease;
  }

  .input-clear-btn:hover {
    color: var(--color-text-primary);
    background-color: var(--color-surface-3);
  }

  .input-sheet-btn,
  .input-paste-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    background-color: var(--color-surface-3);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs);
    color: var(--color-text-secondary);
    cursor: pointer;
    flex-shrink: 0;
    transition: background-color 0.1s ease, color 0.1s ease, transform 0.08s ease;
  }

  .input-sheet-btn:hover,
  .input-paste-btn:hover {
    color: var(--color-accent-primary);
    background-color: var(--color-surface-active);
  }

  .input-sheet-btn:active,
  .input-paste-btn:active {
    transform: scale(0.96);
  }

  /* Context Menu Styles */
  .menu-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding-bottom: var(--space-sm);
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .menu-group:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .menu-group-title {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--color-text-muted);
    margin-bottom: 2px;
  }


  /* Keyframe animations */
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  :global(.spin-icon) {
    animation: spin 1s linear infinite;
  }
</style>
