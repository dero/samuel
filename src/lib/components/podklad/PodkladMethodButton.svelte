<script lang="ts">
  import { Camera, ImageSquare } from 'phosphor-svelte';
  import Keycap from '../ui/Keycap.svelte';
  import type { PodkladMethod } from '../../state/podklad.svelte';

  /** One way to bring an image in, as a key of the Podklad bottom row. */
  interface Props {
    method: PodkladMethod;
    onFile?: (file: File) => void;
  }

  let { method, onFile }: Props = $props();

  let fileInputEl = $state<HTMLInputElement | null>(null);

  function handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) onFile?.(file);
  }
</script>

<div class="method-key">
  <!-- The file picker needs a finished tap, hence pressOn="click" -->
  <Keycap pressOn="click" sublabel={method.label} onPress={() => fileInputEl?.click()}>
    {#if method.id === 'camera'}
      <Camera size={16} weight="bold" />
    {:else}
      <ImageSquare size={16} weight="bold" />
    {/if}
  </Keycap>

  <input
    bind:this={fileInputEl}
    type="file"
    accept="image/*"
    capture={method.id === 'camera' ? 'environment' : undefined}
    class="hidden-file-input"
    onchange={handleFileChange}
  />
</div>

<style>
  .method-key {
    min-width: 0;
  }

  .hidden-file-input {
    display: none;
  }
</style>
