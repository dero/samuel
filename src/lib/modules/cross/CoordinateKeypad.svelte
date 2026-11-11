<script lang="ts">
  import Chassis from '../../components/ui/Chassis.svelte';
  import Keycap from '../../components/ui/Keycap.svelte';
  import type { CrossAxis } from './crossData';

  interface Props {
    axes: CrossAxis[];
    /** Chosen value per axis, `null` while the axis is open. */
    selected: (number | null)[];
    onChange: (next: (number | null)[]) => void;
  }

  let { axes, selected, onChange }: Props = $props();

  function toggle(axisIdx: number, value: number) {
    onChange(selected.map((cur, i) => (i === axisIdx ? (cur === value ? null : value) : cur)));
  }
</script>

<div class="coordinate-keypad">
  <Chassis columns={3} keyHeight="var(--control-min-height)">
    {#each [0, 1, 2] as row}
      {#each axes as axis, axisIdx}
        {@const opt = axis.options[row]}
        <Keycap
          size="s"
          label={`${opt.label} ${opt.sub}`}
          title={`${axis.label}: ${opt.label}`}
          ariaLabel={`${axis.label} ${opt.label}`}
          selected={selected[axisIdx] === opt.value}
          onPress={() => toggle(axisIdx, opt.value)}
        />
      {/each}
    {/each}
  </Chassis>
</div>

<style>
  .coordinate-keypad {
    width: 100%;
  }
</style>
