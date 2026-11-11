<script lang="ts">
  import RefSection from './RefSection.svelte';
  import RefText from './RefText.svelte';
  import type { RefHelpData, RefItem } from './refTypes';

  interface Props {
    help: RefHelpData;
  }

  let { help }: Props = $props();

  const hasHowTo = $derived(!!help.howTo?.length || !!help.example || !!help.media);
</script>

<!-- A sentence does not fit beside its term on 320 px: the term is a row, the sentence
     the description row under it (DESIGN_SYSTEM §10, desc-row) -->
{#snippet pairTable(items: readonly RefItem[], warn: boolean)}
  <div class="ref-table-wrap">
    <table class="ref-table help-table" class:is-warn={warn}>
      <tbody>
        {#each items as item, i (i)}
          {#if typeof item === 'string'}
            <tr><td class="help-term"><RefText text={item} /></td></tr>
            <tr class="desc-row"><td></td></tr>
          {:else}
            <tr><td class="help-term"><RefText text={item[0]} /></td></tr>
            <tr class="desc-row"><td><RefText text={item[1]} /></td></tr>
          {/if}
        {/each}
      </tbody>
    </table>
  </div>
{/snippet}

{#if help.purpose?.length}
  <RefSection title="K čemu to je">
    {#each help.purpose as paragraph, i (i)}
      <p class="help-para"><RefText text={paragraph} /></p>
    {/each}
  </RefSection>
{/if}

{#if hasHowTo}
  <RefSection title="Jak na to">
    {#each help.howTo ?? [] as paragraph, i (i)}
      <p class="help-para"><RefText text={paragraph} /></p>
    {/each}

    {#if help.example}
      <div class="help-example">
        <h4 class="help-example-title">{help.example.title}</h4>
        <ol class="help-steps">
          {#each help.example.steps as step, i (i)}
            <li class="help-step">
              <span class="help-step-num" aria-hidden="true">{i + 1}</span>
              <div class="help-step-body">
                <span class="help-step-action"><RefText text={step.action} /></span>
                <span class="help-step-result"><RefText text={step.result} /></span>
              </div>
            </li>
          {/each}
        </ol>
      </div>
    {/if}

    {#if help.media}
      <figure class="help-figure">
        <img src={help.media.src} alt={help.media.alt} loading="lazy" />
        {#if help.media.caption}
          <figcaption><RefText text={help.media.caption} /></figcaption>
        {/if}
      </figure>
    {/if}
  </RefSection>
{/if}

{#if help.controls?.length}
  <RefSection title="Ovládání">
    {@render pairTable(help.controls, false)}
  </RefSection>
{/if}

{#if help.pitfalls?.length}
  <RefSection title="Pozor">
    {@render pairTable(help.pitfalls, true)}
  </RefSection>
{/if}

<style>
  .help-para {
    margin: 0 0 var(--space-sm);
    font-size: var(--text-sm);
    line-height: 1.55;
    color: var(--color-text-primary);
  }

  .help-para:last-child {
    margin-bottom: 0;
  }

  .help-example {
    margin-top: var(--space-md);
    padding: var(--space-md);
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
  }

  .help-example-title {
    margin: 0 0 var(--space-sm);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .help-steps {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .help-step {
    display: flex;
    align-items: flex-start;
    gap: var(--space-sm);
  }

  .help-step-num {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-full);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-text-secondary);
  }

  .help-step-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    padding-top: 2px;
  }

  .help-step-action {
    font-size: var(--text-sm);
    font-weight: 600;
    line-height: 1.45;
    color: var(--color-text-primary);
  }

  .help-step-result {
    font-size: var(--text-sm);
    line-height: 1.45;
    color: var(--color-text-secondary);
  }

  .help-figure {
    margin: var(--space-md) 0 0;
  }

  .help-figure img {
    display: block;
    max-width: 100%;
    height: auto;
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
  }

  .help-figure figcaption {
    margin-top: var(--space-xs);
    font-size: var(--text-xs);
    line-height: 1.45;
    color: var(--color-text-secondary);
  }

  .help-table .help-term {
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .help-table.is-warn .help-term {
    color: var(--color-accent-warning);
  }
</style>
