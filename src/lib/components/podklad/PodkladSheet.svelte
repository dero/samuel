<script lang="ts">
  import { FileText } from 'phosphor-svelte';
  import BottomSheet from '../ui/BottomSheet.svelte';
  import TextEntrySheet from '../ui/TextEntrySheet.svelte';
  import HoldToAction from '../ui/HoldToAction.svelte';
  import PodkladMethodButton from './PodkladMethodButton.svelte';
  import { podklad, PODKLAD_METHODS } from '../../state/podklad.svelte';

  const config = $derived(podklad.config);
</script>

<!-- Opened from the header icon; text kinds go straight to the editor -->
{#if config && config.kind !== 'image'}
  <TextEntrySheet
    open={podklad.sheetOpen}
    title={config.title}
    icon={FileText}
    value={config.value}
    placeholder={config.placeholder ?? 'Napište nebo vložte text…'}
    autocapitalize={config.autocapitalize}
    paste
    clearable
    copyable={config.copyable}
    onSave={config.onSave}
    onClose={() => podklad.close()}
  />
{:else if config && config.kind === 'image'}
  {@const image = config}
  <BottomSheet
    open={podklad.sheetOpen}
    title={image.title}
    icon={FileText}
    maxHeight="92dvh"
    onClose={() => podklad.close()}
  >
    <div class="image-sheet">
      {#if image.preview}
        <div class="image-preview">
          <img src={image.preview} alt={image.title} />
        </div>
      {/if}

      <div class="image-methods">
        {#each PODKLAD_METHODS.image as method (method.id)}
          <PodkladMethodButton
            {method}
            onFile={(file) => {
              image.onFile(file);
              podklad.close();
            }}
          />
        {/each}
      </div>

      {#if !image.empty}
        <HoldToAction
          variant="outline"
          label="Smazat"
          confirmedLabel="Smazáno"
          ariaLabel="Podržte pro smazání fotografie"
          tapWarning="Podržte pro smazání"
          onAction={() => {
            image.onClear();
            podklad.close();
          }}
        />
      {/if}
    </div>
  </BottomSheet>
{/if}

<style>
  .image-sheet {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    width: 100%;
  }

  .image-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    height: clamp(96px, 28dvh, 220px);
    background-color: #000000;
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .image-preview img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    display: block;
  }

  .image-methods {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-sm);
  }
</style>
