<script lang="ts">
  import KeypadBottomRow from '../../components/ui/KeypadBottomRow.svelte';
  import Keycap from '../../components/ui/Keycap.svelte';
  import { PencilSimple, PencilSimpleSlash } from 'phosphor-svelte';

  /** Shared bottom row of the drawing modules (Želva, Plotr): Smazat vše | Pero | Zpět. */
  interface Props {
    penDown: boolean;
    hasData: boolean;
    canUndo: boolean;
    onClear: () => void;
    onTogglePen: () => void;
    onUndo: () => void;
  }

  let { penDown, hasData, canUndo, onClear, onTogglePen, onUndo }: Props = $props();

  const penTitle = $derived(
    penDown ? 'Pero kreslí, klepnutím zvednout' : 'Pero je zvednuté, klepnutím položit'
  );
</script>

<KeypadBottomRow
  clearDisabled={!hasData}
  backspaceDisabled={!canUndo}
  clearLabel="Smazat celou kresbu podržením"
  backspaceTitle="Vzít zpět poslední stisk"
  {onClear}
  onBackspace={onUndo}
>
  {#snippet middle()}
    <Keycap
      sublabel={penDown ? 'Kreslí' : 'Zvednuto'}
      title={penTitle}
      ariaLabel={penTitle}
      onPress={onTogglePen}
    >
      {#if penDown}
        <PencilSimple size={16} weight="bold" />
      {:else}
        <PencilSimpleSlash size={16} weight="bold" />
      {/if}
    </Keycap>
  {/snippet}
</KeypadBottomRow>
