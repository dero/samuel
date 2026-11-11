<script lang="ts">
  import { CaretLeft, CaretRight } from 'phosphor-svelte';
  import Chassis from './Chassis.svelte';
  import Keycap from './Keycap.svelte';

  /**
   * Two-row digit keypad (1–9, 0) flanked by tall prev/next keys.
   * Shared by grid puzzles (Sudoku, Nonogram); the meaning of 0 is up to the caller.
   */
  interface Props {
    onDigit: (digit: number) => void;
    onPrev: () => void;
    onNext: () => void;
    prevLabel?: string;
    nextLabel?: string;
  }

  let {
    onDigit,
    onPrev,
    onNext,
    prevLabel = 'Předchozí pole',
    nextLabel = 'Další pole'
  }: Props = $props();
</script>

<Chassis columns={7} keyHeight="52px" class="digit-keypad">
  <Keycap class="digit-nav digit-prev" ariaLabel={prevLabel} title={prevLabel} onPress={onPrev}>
    <CaretLeft size={22} weight="bold" />
  </Keycap>

  {#each [1, 2, 3, 4, 5] as digit (digit)}
    <Keycap label={String(digit)} ariaLabel="Číslice {digit}" onPress={() => onDigit(digit)} />
  {/each}

  <Keycap class="digit-nav digit-next" ariaLabel={nextLabel} title={nextLabel} onPress={onNext}>
    <CaretRight size={22} weight="bold" />
  </Keycap>

  {#each [6, 7, 8, 9, 0] as digit (digit)}
    <Keycap label={String(digit)} ariaLabel="Číslice {digit}" onPress={() => onDigit(digit)} />
  {/each}
</Chassis>

<style>
  /* Keycap and Chassis render the elements, so the placement has to reach into them */
  :global(.chassis.digit-keypad .digit-nav) {
    grid-row: span 2;
    height: 100%;
    color: var(--color-accent-primary);
  }

  :global(.chassis.digit-keypad .digit-prev) {
    grid-column: 1;
  }

  :global(.chassis.digit-keypad .digit-next) {
    grid-column: 7;
    grid-row: 1 / span 2;
  }
</style>
