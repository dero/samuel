<script lang="ts">
  import RepeatKey from './RepeatKey.svelte';

  /** Three cells of the parent grid: [−] value [+]. Holding a key keeps stepping. */
  interface Props {
    /** Spoken name of the value, e.g. "den (OD)". */
    label: string;
    value: string | number;
    onIncrement: () => void;
    onDecrement: () => void;
  }

  let { label, value, onIncrement, onDecrement }: Props = $props();
</script>

<RepeatKey label="−" size="m" ariaLabel="Snížit {label}" onStep={onDecrement} />
<span class="stepper-val">{value}</span>
<RepeatKey label="+" size="m" ariaLabel="Zvýšit {label}" onStep={onIncrement} />

<style>
  .stepper-val {
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    color: var(--color-text-primary);
    white-space: nowrap;
  }
</style>
