<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import type { ModuleBarConfig } from '../../components/layout/ModuleBar.svelte';
  import SimpleKeyboard from '../../components/ui/SimpleKeyboard.svelte';
  import FactArticleViewer from './FactArticleViewer.svelte';
  import {
    loadFactArticles,
    searchFacts,
    highlightMatches,
    getArticleSnippet,
    type FactArticle
  } from './factsService';
  import { navigation } from '../../state/navigation.svelte';
  import { settings } from '../../state/settings.svelte';
  import { CaretRight } from 'phosphor-svelte';

  const allArticles = loadFactArticles();
  const articlesById = new Map(allArticles.map((a) => [a.id, a]));

  let searchQuery = $state('');
  let listEl = $state<HTMLDivElement | null>(null);

  const hasQuery = $derived(searchQuery.trim() !== '');
  const filteredArticles = $derived(searchFacts(searchQuery, allArticles));

  function formatTopicCount(n: number): string {
    if (n === 1) return '1 téma';
    return n >= 2 && n <= 4 ? `${n} témata` : `${n} témat`;
  }

  const bar = $derived<ModuleBarConfig>({
    empty: !hasQuery,
    hint: 'Pište, co hledáte.',
    status: hasQuery
      ? `Nalezeno ${filteredArticles.length} z ${allArticles.length}`
      : formatTopicCount(allArticles.length)
  });

  // A changed query starts the list from the top
  $effect(() => {
    void searchQuery;
    if (listEl) listEl.scrollTop = 0;
  });

  function handleChar(char: string) {
    searchQuery += char;
  }

  function handleBackspace() {
    searchQuery = searchQuery.slice(0, -1);
  }

  function handleClear() {
    searchQuery = '';
  }

  function openArticle(article: FactArticle) {
    settings.vibrate(20);
    navigation.openDetail(article.id);
  }
</script>

<ModuleShell
  title="Fakta"
  {bar}
  detailTitle={(id) => articlesById.get(id)?.title ?? 'Fakta'}
>
  {#snippet output()}
    <div class="facts-output" bind:this={listEl}>
      {#if filteredArticles.length === 0}
        <div class="empty-state">
          <span class="empty-query font-mono">„{searchQuery}“</span>
          <span class="empty-msg">Žádné téma neodpovídá.</span>
          <span class="empty-tip">Dotaz vymažete podržením koše.</span>
        </div>
      {:else}
        <div class="topic-list">
          {#each filteredArticles as article (article.id)}
            <button
              type="button"
              class="topic-card"
              onclick={() => openArticle(article)}
              aria-label="Zobrazit {article.title}"
            >
              <span class="card-body">
                <span class="card-category">{article.category}</span>
                <span class="card-title">
                  {#each highlightMatches(article.title, searchQuery) as seg}
                    {#if seg.isMatch}<mark>{seg.text}</mark>{:else}{seg.text}{/if}
                  {/each}
                </span>
                <span class="card-preview">
                  {#each highlightMatches(getArticleSnippet(article, searchQuery), searchQuery) as seg}
                    {#if seg.isMatch}<mark>{seg.text}</mark>{:else}{seg.text}{/if}
                  {/each}
                </span>
              </span>
              <span class="card-arrow" aria-hidden="true">
                <CaretRight size={16} />
              </span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/snippet}

  {#snippet input()}
    <SimpleKeyboard
      query={searchQuery}
      placeholder="Hledat téma…"
      hasInput={searchQuery.length > 0}
      onChar={handleChar}
      onBackspace={handleBackspace}
      onClear={handleClear}
    />
  {/snippet}

  {#snippet detail(id: string)}
    {@const article = articlesById.get(id)}
    {#if article}
      <FactArticleViewer {article} />
    {:else}
      <p class="missing-article">Téma nebylo nalezeno.</p>
    {/if}
  {/snippet}
</ModuleShell>

<style>
  .facts-output {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }

  .topic-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .topic-card {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    width: 100%;
    padding: var(--space-sm) var(--space-md);
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    text-align: left;
    box-sizing: border-box;
    transition: background-color 0.12s ease;
  }

  .topic-card:active {
    background-color: var(--color-surface-active);
  }

  .card-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .card-category {
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .card-title {
    font-size: var(--text-base);
    font-weight: 700;
    line-height: 1.25;
    color: var(--color-text-primary);
  }

  .card-preview {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: var(--text-xs);
    line-height: 1.35;
    color: var(--color-text-secondary);
    word-break: break-word;
  }

  .card-arrow {
    flex-shrink: 0;
    display: flex;
    color: var(--color-text-muted);
  }

  /* A match is marked by a filled box and weight, not by colour alone */
  mark {
    padding: 0 1px;
    border-radius: 2px;
    background-color: var(--color-accent-primary-subtle);
    color: var(--color-accent-primary);
    font-weight: 800;
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    padding: var(--space-md);
    text-align: center;
  }

  .empty-query {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .empty-msg {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .empty-tip {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .missing-article {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }
</style>
