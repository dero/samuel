<script lang="ts">
  import Chassis from './Chassis.svelte';
  import Keycap from './Keycap.svelte';

  interface Props {
    letters: string[];
    disabled?: boolean;
    onLetter: (letter: string) => void;
  }

  let { letters, disabled = false, onLetter }: Props = $props();

  // Dynamic columns: guarantee max 7 rows
  const cols = $derived(Math.max(6, Math.ceil(letters.length / 7)));
  const rows = $derived(Math.ceil(letters.length / cols));
  const emptySpan = $derived((cols - (letters.length % cols)) % cols);

  // Taller alphabets get lower keys so that the whole grid stays inside the height budget
  const keyHeight = $derived(rows >= 7 ? '34px' : rows === 6 ? '38px' : '42px');
  const keySize = $derived<'s' | 'm'>(rows >= 7 ? 's' : 'm');
</script>

<Chassis columns={cols} {keyHeight}>
  {#each letters as letter}
    <Keycap label={letter} size={keySize} {disabled} onPress={() => onLetter(letter)} />
  {/each}

  {#if emptySpan > 0}
    <div class="grid-filler" style:grid-column="span {emptySpan}" aria-hidden="true"></div>
  {/if}
</Chassis>

<style>
  .grid-filler {
    background-color: var(--color-surface-2);
    opacity: 0.35;
    border-radius: 2px;
    pointer-events: none;
  }
</style>
