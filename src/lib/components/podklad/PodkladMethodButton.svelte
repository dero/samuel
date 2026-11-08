<script lang="ts">
  import { PencilSimple, Camera, ImageSquare } from 'phosphor-svelte';
  import { settings } from '../../state/settings.svelte';
  import type { PodkladMethod } from '../../state/podklad.svelte';

  interface Props {
    method: PodkladMethod;
    onWrite?: () => void;
    onFile?: (file: File) => void;
  }

  let { method, onWrite, onFile }: Props = $props();

  let fileInputEl = $state<HTMLInputElement | null>(null);

  function handleClick() {
    settings.vibrate(20);
    if (method.id === 'write') {
      onWrite?.();
    } else {
      fileInputEl?.click();
    }
  }

  function handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) onFile?.(file);
  }
</script>

<button type="button" class="method-btn" onclick={handleClick}>
  <span class="method-icon">
    {#if method.id === 'write'}
      <PencilSimple size={20} weight="bold" />
    {:else if method.id === 'camera'}
      <Camera size={20} weight="bold" />
    {:else}
      <ImageSquare size={20} weight="bold" />
    {/if}
  </span>
  <span class="method-label">{method.label}</span>
</button>

{#if method.id !== 'write'}
  <input
    bind:this={fileInputEl}
    type="file"
    accept="image/*"
    capture={method.id === 'camera' ? 'environment' : undefined}
    class="hidden-file-input"
    onchange={handleFileChange}
  />
{/if}

<style>
  .method-btn {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    width: 100%;
    height: var(--tap-min-size);
    padding: 0 var(--space-md);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: var(--text-sm);
    font-weight: 700;
    text-align: left;
    box-sizing: border-box;
    transition: background-color 0.12s ease;
  }

  .method-btn:active {
    background-color: var(--color-surface-active);
  }

  .method-icon {
    display: flex;
    color: var(--color-accent-primary);
    flex-shrink: 0;
  }

  .method-label {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hidden-file-input {
    display: none;
  }
</style>
