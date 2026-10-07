<script lang="ts">
  import ModuleShell from '../components/layout/ModuleShell.svelte';
  import type { ModuleMeta } from '../types';
  import ModuleIcon from '../components/ui/ModuleIcon.svelte';
  import TranslationCard from '../components/ui/TranslationCard.svelte';

  interface Props {
    module: ModuleMeta;
  }

  let { module }: Props = $props();

  let dummyText = $state('');

  function handleReset() {
    dummyText = '';
  }
</script>

<ModuleShell
  hasAlphabet={module.hasAlphabet}
  onReset={handleReset}
>
  {#snippet output()}
    <TranslationCard
      text={dummyText}
      placeholder="Zatím žádný vstup. Modul bude implementován v dalším kroku."
    />
  {/snippet}

  {#snippet input()}
    <div class="input-container">
      <div class="stub-keypad">
        <div class="stub-info">
          <span class="stub-icon">
            <ModuleIcon id={module.id} size={40} weight="duotone" />
          </span>
          <span class="stub-name">{module.name}</span>
          <span class="stub-badge">Připraveno ke specifikaci</span>
        </div>
      </div>
    </div>
  {/snippet}

  {#snippet reference()}
    <div class="ref-body">
      <h3>{module.name}</h3>
      <div class="ref-note">
        Podrobná referenční tabulka bude doplněna při detailní implementaci tohoto modulu.
      </div>
    </div>
  {/snippet}
</ModuleShell>

<style>
  .input-container {
    padding: var(--space-lg);
  }

  .stub-keypad {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 140px;
    background-color: var(--color-surface-2);
    border: 1px dashed var(--color-border-subtle);
    border-radius: var(--radius-md);
  }

  .stub-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
  }

  .stub-icon {
    font-size: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-accent-primary);
  }

  .stub-name {
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .stub-badge {
    font-size: var(--text-xs);
    color: var(--color-accent-primary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 700;
  }

  .ref-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .ref-body h3 {
    margin: 0;
    color: var(--color-accent-primary);
  }

  .ref-note {
    padding: var(--space-md);
    background-color: var(--color-surface-2);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }
</style>
