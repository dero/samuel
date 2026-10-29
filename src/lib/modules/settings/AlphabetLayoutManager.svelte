<script lang="ts">
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
  <h2 class="card-title">Správa abeced</h2>
  <p class="card-desc">Abecedu pro nástroj zvolíte v jeho menu.</p>

  <div class="layouts-list">
    {#each alphabet.layouts as layout (layout.id)}
      {@const isInspected = layout.id === inspectedLayoutId}
      <div class="layout-row" class:active={isInspected}>
        <button
          type="button"
          class="layout-select-btn"
          onclick={() => {
            settings.vibrate(20);
            inspectedLayoutId = layout.id;
          }}
        >
          <span class="layout-name">{layout.name}</span>
          <span class="layout-count">{layout.letters.length} znaků</span>
          {#if layout.isBuiltin}
            <span class="builtin-badge">Vestavěná</span>
          {:else}
            <span class="custom-badge">Vlastní</span>
          {/if}
        </button>

        {#if !layout.isBuiltin}
          <HoldToAction
            onAction={() => handleDeleteCustomLayout(layout.id)}
            showLabel={false}
            ariaLabel="Podržte pro smazání vlastní abecedy"
            holdDuration={400}
            variant="icon-only"
          />
        {/if}
      </div>
    {/each}
  </div>

  <!-- Letters grid for inspected layout -->
  <div class="letters-preview">
    <div class="preview-label">
      <strong>{inspectedLayout.name}</strong>
    </div>
    {#if inspectedLayout.description}
      <div class="preview-desc">{inspectedLayout.description}</div>
    {/if}
    <div class="letters-chips">
      {#each inspectedLayout.letters as letter}
        <span class="letter-chip">{letter}</span>
      {/each}
    </div>
    {#if inspectedLayout.isBuiltin}
      <div class="preview-hint">
        Vestavěnou abecedu nelze upravit, jen zkopírovat.
      </div>
    {:else}
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
    {/if}
  </div>

  <!-- Create Custom Layout -->
  <button
    type="button"
    class="secondary-btn"
    onclick={() => {
      settings.vibrate(25);
      editorMode = 'create';
      editorOpen = true;
    }}
  >
    + Nová abeceda
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
  .card {
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .card-title {
    font-size: var(--text-base);
    font-weight: 700;
    margin: 0;
  }

  .card-desc {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    line-height: 1.4;
    margin: 0;
  }

  .layouts-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .layout-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: 6px 10px;
  }

  .layout-row.active {
    border-color: var(--color-accent-primary);
  }

  .layout-select-btn {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex: 1;
    text-align: left;
    padding: 6px 0;
    background: none;
    border: none;
    cursor: pointer;
    font: inherit;
    color: inherit;
  }

  .layout-name {
    font-size: var(--text-sm);
    font-weight: 600;
  }

  .layout-count {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  .builtin-badge {
    font-size: var(--text-2xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    padding: 1px 6px;
    border-radius: var(--radius-full);
    background-color: var(--color-surface-active);
    color: var(--color-text-secondary);
  }

  .custom-badge {
    font-size: var(--text-2xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    padding: 1px 6px;
    border-radius: var(--radius-full);
    background-color: var(--color-accent-primary-subtle);
    color: var(--color-accent-primary);
  }

  .letters-preview {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-md);
    background-color: var(--color-surface-2);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border-subtle);
  }

  .preview-label {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .preview-desc {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    line-height: 1.35;
  }

  .preview-hint {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    font-style: italic;
    line-height: 1.35;
    margin-top: 4px;
  }

  .letters-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .letter-chip {
    padding: 4px 8px;
    background-color: var(--color-surface-3);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    font-weight: 600;
    color: inherit;
  }

  .secondary-btn {
    padding: 10px 14px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-accent-primary);
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    cursor: pointer;
    font: inherit;
  }

  .secondary-btn:active:not(:disabled) {
    background-color: var(--color-surface-active);
  }

</style>
