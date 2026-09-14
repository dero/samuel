<script lang="ts">
  import ModuleShell from '../components/layout/ModuleShell.svelte';
  import type { ModuleMeta } from '../types';
  import { copyToClipboard } from '../utils/clipboard';
  import ModuleIcon from '../components/ui/ModuleIcon.svelte';

  interface Props {
    module: ModuleMeta;
  }

  let { module }: Props = $props();

  let dummyText = $state('');

  function handleReset() {
    dummyText = '';
  }

  function handlePaste(pasted: string) {
    dummyText += pasted;
  }
</script>

<ModuleShell
  hasAlphabet={module.hasAlphabet}
  onReset={handleReset}
  onPaste={handlePaste}
>
  {#snippet output()}
    <div class="output-container">
      <div class="output-header">
        <span class="output-label">Dekódovaný výstup (Klepnutím zkopírujete)</span>
      </div>
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="output-box"
        class:is-empty={!dummyText}
        onclick={() => copyToClipboard(dummyText || 'Ukázkový text tajenky')}
      >
        {dummyText || 'Zatím žádný vstup. Modul bude implementován v dalším kroku.'}
      </div>
    </div>
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
  .output-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 6px;
  }

  .output-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .output-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .output-box {
    flex: 1;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    padding: 14px;
    font-family: var(--font-mono);
    font-size: 18px;
    line-height: 1.5;
    cursor: pointer;
    overflow-y: auto;
    transition: border-color 0.2s, background-color 0.2s;
  }
  .output-box:active {
    background-color: var(--color-surface-active);
  }

  .output-box.is-empty {
    color: var(--color-text-secondary);
    font-style: italic;
    font-size: 14px;
  }

  .input-container {
    padding: 16px;
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
    gap: 8px;
  }

  .stub-icon {
    font-size: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-accent-primary);
  }

  .stub-name {
    font-size: 16px;
    font-weight: 600;
  }

  .stub-badge {
    font-size: 11px;
    color: var(--color-accent-primary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 700;
  }

  .ref-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .ref-body h3 {
    margin: 0;
    color: var(--color-accent-primary);
  }
  .ref-note {
    padding: 12px;
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: var(--radius-sm);
    font-size: 13px;
    color: var(--color-text-secondary);
  }
</style>
