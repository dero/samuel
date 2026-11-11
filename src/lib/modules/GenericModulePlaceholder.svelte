<script lang="ts">
  import ModuleShell from '../components/layout/ModuleShell.svelte';
  import type { ModuleMeta } from '../types';
  import ModuleIcon from '../components/ui/ModuleIcon.svelte';
  import TranslationCard from '../components/ui/TranslationCard.svelte';
  import RefLayout from '../components/reference/RefLayout.svelte';

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
      placeholder="Zatím žádný vstup. Nástroj bude implementován v dalším kroku."
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
    <RefLayout help={{ controls: ['Nástroj je ve vývoji, reference přibude s ním.'] }} />
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
    font-size: 43px;
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
</style>
