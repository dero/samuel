<script lang="ts">
  import Chassis from '../../components/ui/Chassis.svelte';
  import Keycap from '../../components/ui/Keycap.svelte';
  import { BASE_CONFIGS } from './numbersData';

  interface Props {
    base: number;
    onDigit: (digit: string) => void;
  }

  let { base, onDigit }: Props = $props();

  const config = $derived(BASE_CONFIGS[base] ?? BASE_CONFIGS[10]);

  // Fewer digits get bigger keys; every layout fits the 308 px budget with the variants row
  const layout = $derived.by(() => {
    if (base === 2) return { columns: 2, keyHeight: '84px', size: 'l' as const };
    if (base === 3) return { columns: 3, keyHeight: '76px', size: 'l' as const };
    if (base <= 6) return { columns: base === 4 ? 2 : 3, keyHeight: '62px', size: 'm' as const };
    if (base <= 9) return { columns: base === 9 ? 3 : 4, keyHeight: '56px', size: 'm' as const };
    return { columns: base === 10 ? 3 : 4, keyHeight: '52px', size: 'm' as const };
  });

  // Decimal is a telephone pad with a wide 0, the other bases go in digit order
  const isDecimal = $derived(base === 10);
  const keys = $derived(isDecimal ? config.digits.slice(1) : config.digits);
  const fillerSpan = $derived((layout.columns - (keys.length % layout.columns)) % layout.columns);
</script>

<Chassis columns={layout.columns} keyHeight={layout.keyHeight}>
  {#each keys as digit (digit)}
    <Keycap size={layout.size} label={digit} onPress={() => onDigit(digit)} />
  {/each}

  {#if isDecimal}
    <div class="key-wide">
      <Keycap size={layout.size} label="0" onPress={() => onDigit('0')} />
    </div>
  {:else if fillerSpan > 0}
    <div class="grid-filler" style:grid-column={`span ${fillerSpan}`} aria-hidden="true"></div>
  {/if}
</Chassis>

<style>
  .key-wide {
    grid-column: 1 / -1;
  }

  .grid-filler {
    background-color: var(--color-surface-2);
    opacity: 0.35;
    border-radius: 2px;
  }
</style>
