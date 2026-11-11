<script lang="ts">
  import { CaretDown, Plus } from 'phosphor-svelte';
  import { alphabet } from '../../state/alphabet.svelte';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import { MODULES } from '../../types';
  import HoldToAction from '../../components/ui/HoldToAction.svelte';
  import AlphabetEditSheet from '../../components/ui/AlphabetEditSheet.svelte';

  let editorOpen = $state(false);
  let editorMode = $state<'create' | 'edit'>('create');

  let inspectedLayoutId = $state<string>(alphabet.layouts[0]?.id ?? 'english-26');

  let inspectedLayout = $derived(
    alphabet.getLayout(inspectedLayoutId) ?? alphabet.layouts[0]
  );

  // The list has its own count column, so a built-in name's "(26)" would only repeat it
  function listName(name: string, count: number): string {
    return name.replace(new RegExp(`\\s*\\(${count}\\)$`), '');
  }

  function formatCount(n: number): string {
    if (n === 1) return '1 znak';
    return n >= 2 && n <= 4 ? `${n} znaky` : `${n} znaků`;
  }

  function handleDeleteCustomLayout(id: string) {
    const resetModules = alphabet.deleteCustomLayout(id);
    if (inspectedLayoutId === id) {
      inspectedLayoutId = alphabet.layouts[0]?.id ?? 'english-26';
    }
    if (resetModules.length > 0) {
      const names = resetModules
        .map((m) => MODULES.find((mod) => mod.id === m)?.name ?? m)
        .join(', ');
      toast.show(`Abeceda smazána, výchozí abeceda obnovena: ${names}`, { type: 'info' });
    } else {
      toast.show('Abeceda smazána', { type: 'info' });
    }
  }

  function handleSaveLayout(name: string, letters: string[]) {
    if (editorMode === 'create') {
      inspectedLayoutId = alphabet.addCustomLayout(name, letters);
      toast.show('Abeceda vytvořena', { type: 'success' });
    } else {
      alphabet.updateCustomLayout(inspectedLayoutId, { name, letters });
      toast.show('Abeceda uložena', { type: 'success' });
    }
  }
</script>

<section class="card">
  <div class="card-head">
    <h2 class="card-title">Správa abeced</h2>
    <p class="card-desc">Abecedu pro nástroj zvolíte v jeho menu.</p>
  </div>

  <ul class="layout-list">
    {#each alphabet.layouts as layout (layout.id)}
      {@const open = layout.id === inspectedLayoutId}
      <li class="layout-item" class:is-open={open}>
        <button
          type="button"
          class="layout-row"
          aria-expanded={open}
          onclick={() => {
            if (open) return;
            settings.vibrate(20);
            inspectedLayoutId = layout.id;
          }}
        >
          <span class="layout-name">{listName(layout.name, layout.letters.length)}</span>
          {#if !layout.isBuiltin}
            <span class="custom-tag">Vlastní</span>
          {/if}
          <span class="layout-count">{formatCount(layout.letters.length)}</span>
          <span class="layout-caret" aria-hidden="true">
            <CaretDown size={14} weight="bold" />
          </span>
        </button>

        {#if open}
          <div class="layout-detail">
            <!-- A custom name may be cut in the row; its stored description says nothing -->
            {#if !layout.isBuiltin}
              <p class="layout-desc">{layout.name}</p>
            {:else if layout.description}
              <p class="layout-desc">{layout.description}</p>
            {/if}
            <div class="letters-grid">
              {#each layout.letters as letter, i (i)}
                <span class="letter-chip">{letter}</span>
              {/each}
            </div>
            {#if layout.isBuiltin}
              <p class="layout-note">Vestavěnou abecedu nelze upravit, jen zkopírovat.</p>
            {:else}
              <div class="layout-actions">
                <button
                  type="button"
                  class="secondary-btn"
                  onclick={() => {
                    settings.vibrate(25);
                    editorMode = 'edit';
                    editorOpen = true;
                  }}
                >
                  Upravit
                </button>
                <HoldToAction
                  onAction={() => handleDeleteCustomLayout(layout.id)}
                  label="Smazat"
                  confirmedLabel="Smazáno"
                  ariaLabel="Podržte pro smazání vlastní abecedy"
                  holdDuration={400}
                  variant="outline"
                />
              </div>
            {/if}
          </div>
        {/if}
      </li>
    {/each}
  </ul>

  <button
    type="button"
    class="secondary-btn"
    onclick={() => {
      settings.vibrate(25);
      editorMode = 'create';
      editorOpen = true;
    }}
  >
    <Plus size={16} weight="bold" />
    Nová abeceda
  </button>
</section>

<AlphabetEditSheet
  open={editorOpen}
  mode={editorMode}
  initialName={editorMode === 'edit' ? inspectedLayout.name : ''}
  initialLetters={inspectedLayout.letters}
  sourceLabel={inspectedLayout.name}
  onSave={handleSaveLayout}
  onClose={() => {
    editorOpen = false;
  }}
/>

<style>
  /* Matches the cards in SettingsModule */
  .card {
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .card-title {
    font-size: var(--text-base);
    font-weight: 700;
    margin: 0;
  }

  .card-desc {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: 1.4;
    margin: 3px 0 0 0;
  }

  /* One box with hairlines, like the version box above: names left, counts in one column */
  .layout-list {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .layout-item + .layout-item {
    border-top: 1px solid var(--color-border-subtle);
  }

  .layout-item.is-open {
    background-color: var(--color-surface-3);
    box-shadow: inset 3px 0 0 var(--color-accent-primary);
  }

  .layout-row {
    display: grid;
    /* Fixed columns: name, optional tag, count pushed right, caret */
    grid-template-columns: minmax(0, auto) auto 1fr 16px;
    align-items: center;
    column-gap: var(--space-sm);
    width: 100%;
    min-height: 44px;
    padding: var(--space-sm) var(--space-md);
    background: none;
    border: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .layout-item:not(.is-open) .layout-row:active {
    background-color: var(--color-surface-active);
  }

  .layout-name {
    grid-column: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--text-sm);
    font-weight: 600;
  }

  .custom-tag {
    grid-column: 2;
    padding: 1px 6px;
    border-radius: var(--radius-full);
    background-color: var(--color-accent-primary-subtle);
    color: var(--color-accent-primary);
    font-size: var(--text-2xs);
    font-weight: 700;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .layout-count {
    grid-column: 3;
    justify-self: end;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  .layout-caret {
    grid-column: 4;
    display: flex;
    justify-content: center;
    color: var(--color-text-muted);
  }

  .is-open .layout-caret {
    color: var(--color-accent-primary);
    transform: rotate(180deg);
  }

  @media (prefers-reduced-motion: no-preference) {
    .layout-caret {
      transition: transform 0.15s ease;
    }
  }

  .layout-detail {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: 0 var(--space-md) var(--space-md);
  }

  .layout-desc,
  .layout-note {
    margin: 0;
    font-size: var(--text-xs);
    line-height: 1.4;
    color: var(--color-text-secondary);
  }

  .layout-note {
    color: var(--color-text-muted);
  }

  /* Equal cells so the letters line up in columns on every width */
  .letters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(30px, 1fr));
    gap: 4px;
  }

  .letter-chip {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 30px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    font-weight: 600;
  }

  .layout-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-sm);
  }

  .secondary-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    min-height: 40px;
    padding: 10px 14px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-accent-primary);
    text-align: center;
    cursor: pointer;
  }

  .secondary-btn:active:not(:disabled) {
    background-color: var(--color-surface-active);
  }
</style>
