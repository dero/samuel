<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import SimpleKeyboard from '../../components/ui/SimpleKeyboard.svelte';
  import FactArticleViewer from './FactArticleViewer.svelte';
  import {
    loadFactArticles,
    searchFacts,
    highlightMatches,
    getArticleSnippet,
    type FactArticle
  } from './factsService';
  import { settings } from '../../state/settings.svelte';
  import { BookOpen, CaretRight, X, MagnifyingGlass } from 'phosphor-svelte';

  // Load articles once
  const allArticles = loadFactArticles();

  let searchQuery = $state('');
  let selectedArticle = $state<FactArticle | null>(null);
  let listContainer = $state<HTMLDivElement | null>(null);

  const filteredArticles = $derived(searchFacts(searchQuery, allArticles));

  $effect(() => {
    // Whenever searchQuery changes, scroll list immediately back to the top
    if (searchQuery !== undefined && listContainer) {
      listContainer.scrollTop = 0;
    }
  });

  function handleChar(char: string) {
    searchQuery += char;
    listContainer?.scrollTo({ top: 0, behavior: 'instant' });
  }

  function handleBackspace() {
    if (searchQuery.length > 0) {
      searchQuery = searchQuery.slice(0, -1);
      listContainer?.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  function handleClear() {
    searchQuery = '';
    listContainer?.scrollTo({ top: 0, behavior: 'instant' });
  }

  function handleSelectArticle(article: FactArticle) {
    settings.vibrate(20);
    selectedArticle = article;
  }

  function handleReset() {
    searchQuery = '';
    selectedArticle = null;
    listContainer?.scrollTo({ top: 0, behavior: 'instant' });
  }
</script>

<ModuleShell
  title="Fakta"
  layoutMode="fullscreen-input"
  onReset={handleReset}
>
  {#snippet input()}
    {#if selectedArticle}
      <FactArticleViewer
        article={selectedArticle}
        onBack={() => (selectedArticle = null)}
      />
    {:else}
      <div class="facts-browser" data-allow-copy>
        <!-- Top Status Bar: Subtle status indicator (not an input field) -->
        <header class="facts-status-bar">
          <div class="status-left">
            <MagnifyingGlass size={13} color="var(--color-text-secondary)" />
            {#if searchQuery}
              <span class="status-prefix text-muted">Filtr:</span>
              <span class="status-query font-mono">{searchQuery}</span>
            {:else}
              <span class="status-idle text-muted">Přehled témat</span>
            {/if}
          </div>

          <div class="status-right">
            <span class="status-count text-muted font-mono">
              {#if searchQuery}
                {filteredArticles.length} / {allArticles.length}
              {:else}
                {allArticles.length} {allArticles.length === 1 ? 'téma' : allArticles.length < 5 ? 'témata' : 'témat'}
              {/if}
            </span>
            {#if searchQuery}
              <button
                type="button"
                class="status-clear-btn"
                onclick={handleClear}
                aria-label="Vymazat dotaz"
                title="Vymazat dotaz"
              >
                <X size={12} weight="bold" />
              </button>
            {/if}
          </div>
        </header>

        <!-- Middle: Scrollable Fact Articles List with Matched Substring Highlighting -->
        <div class="facts-list-zone" bind:this={listContainer}>
          {#if filteredArticles.length === 0}
            <div class="empty-state">
              <span class="empty-query font-mono">„{searchQuery}“</span>
              <span class="empty-msg">Nenalezen žádný odpovídající přehled</span>
              <button
                type="button"
                class="empty-clear-btn"
                onclick={handleClear}
              >
                Vymazat hledání
              </button>
            </div>
          {:else}
            <div class="articles-grid">
              {#each filteredArticles as article (article.id)}
                <button
                  type="button"
                  class="article-card"
                  onclick={() => handleSelectArticle(article)}
                  aria-label="Zobrazit {article.title}"
                >
                  <div class="card-left">
                    <div class="card-category-row">
                      <BookOpen size={11} weight="bold" class="category-icon" />
                      <span class="card-category">{article.category}</span>
                    </div>
                    <span class="card-title">
                      {#each highlightMatches(article.title, searchQuery) as seg}
                        {#if seg.isMatch}
                          <mark class="match-highlight">{seg.text}</mark>
                        {:else}
                          {seg.text}
                        {/if}
                      {/each}
                    </span>
                    <span class="card-preview text-muted">
                      {#each highlightMatches(getArticleSnippet(article, searchQuery), searchQuery) as seg}
                        {#if seg.isMatch}
                          <mark class="match-highlight">{seg.text}</mark>
                        {:else}
                          {seg.text}
                        {/if}
                      {/each}
                    </span>
                  </div>

                  <div class="card-right">
                    <CaretRight size={16} class="card-arrow" />
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Bottom: In-App QWERTY Keyboard (Tight to bottom, no extra gap) -->
        <div class="facts-keyboard-wrap">
          <SimpleKeyboard
            hasInput={searchQuery.length > 0}
            onChar={handleChar}
            onBackspace={handleBackspace}
            onClear={handleClear}
          />
        </div>
      </div>
    {/if}
  {/snippet}
</ModuleShell>

<style>
  .facts-browser {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    overflow: hidden;
    background-color: var(--color-bg-canvas);
    color: var(--color-text-primary);
  }

  /* Subtle status bar (not a fake input field) */
  .facts-status-bar {
    flex-shrink: 0;
    height: 32px;
    padding: 0 var(--space-sm);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--color-surface-1);
    border-bottom: 1px solid var(--color-border-subtle);
    font-size: 12px;
  }

  .status-left {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow: hidden;
    white-space: nowrap;
  }

  .status-prefix {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .status-query {
    font-size: 13px;
    font-weight: 700;
    color: var(--color-accent-primary);
    letter-spacing: 0.5px;
  }

  .status-idle {
    font-size: 11.5px;
    font-weight: 500;
  }

  .status-right {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .status-count {
    font-size: 11px;
    font-weight: 600;
  }

  .status-clear-btn {
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-full, 9999px);
    color: var(--color-text-secondary);
    padding: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    line-height: 1;
  }

  .status-clear-btn:active {
    color: var(--color-text-primary);
    background-color: var(--color-surface-active);
  }

  .facts-list-zone {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: var(--space-xs) var(--space-sm);
    -webkit-overflow-scrolling: touch;
  }

  .articles-grid {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-bottom: var(--space-xs);
  }

  .article-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    padding: 9px 12px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    text-align: left;
    cursor: pointer;
    transition: background-color 0.12s, border-color 0.12s;
    touch-action: manipulation;
  }

  .article-card:active {
    background-color: var(--color-surface-active);
  }

  .card-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }

  .card-category-row {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--color-accent-primary);
  }

  .card-category {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .card-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text-primary);
    line-height: 1.25;
  }

  .card-preview {
    font-size: 11.5px;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    word-break: break-word;
  }

  .card-right {
    flex-shrink: 0;
    color: var(--color-text-secondary);
  }

  /* Substring match highlight (yellow background with high contrast) */
  :global(mark.match-highlight) {
    background-color: rgba(234, 179, 8, 0.3);
    color: #fef08a;
    border-radius: 2px;
    padding: 0 2px;
    font-weight: 800;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-xl) var(--space-md);
    text-align: center;
    gap: var(--space-xs);
  }

  .empty-query {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-accent-primary);
  }

  .empty-msg {
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  .empty-clear-btn {
    margin-top: var(--space-sm);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: 12px;
    font-weight: 600;
    padding: 6px 14px;
    cursor: pointer;
  }

  .empty-clear-btn:active {
    background-color: var(--color-surface-active);
  }

  /* Keyboard wrapper: hugs the keyboard, zero excess vertical space */
  .facts-keyboard-wrap {
    flex-shrink: 0;
    padding: 2px 2px calc(2px + env(safe-area-inset-bottom, 0px)) 2px;
    background-color: #000000;
    border-top: 1px solid var(--color-border-subtle);
  }
</style>
