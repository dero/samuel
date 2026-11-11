<script lang="ts">
  import Chassis from '../../components/ui/Chassis.svelte';
  import Keycap from '../../components/ui/Keycap.svelte';
  import { isCanonicalRomanPrefix } from './numbersSolver';
  import RomanEasterEgg from './RomanEasterEgg.svelte';

  interface Props {
    buffer?: string;
    canonicalOnly?: boolean;
    showEasterEgg?: boolean;
    onDigit: (digit: string) => void;
  }

  let { buffer = '', canonicalOnly = false, showEasterEgg = true, onDigit }: Props = $props();

  const ROMAN_KEYS = [
    { char: 'I', val: 1 },
    { char: 'V', val: 5 },
    { char: 'X', val: 10 },
    { char: 'L', val: 50 },
    { char: 'C', val: 100 },
    { char: 'D', val: 500 },
    { char: 'M', val: 1000 }
  ];

  function isKeyAllowed(char: string): boolean {
    return !canonicalOnly || isCanonicalRomanPrefix(buffer + char);
  }
</script>

<Chassis columns={4} keyHeight="58px">
  {#if showEasterEgg}
    <RomanEasterEgg />
  {:else}
    <div class="grid-filler" aria-hidden="true"></div>
  {/if}

  {#each ROMAN_KEYS as item (item.char)}
    <Keycap
      label={item.char}
      sublabel={String(item.val)}
      title={`${item.char} = ${item.val}`}
      ariaLabel={`${item.char} = ${item.val}`}
      disabled={!isKeyAllowed(item.char)}
      onPress={() => onDigit(item.char)}
    />
  {/each}
</Chassis>

<style>
  .grid-filler {
    background-color: var(--color-surface-2);
    opacity: 0.35;
    border-radius: 2px;
  }
</style>
