<script lang="ts">
  interface Props {
    frequencies: Record<string, number>;
  }

  let { frequencies }: Props = $props();

  const entries = $derived(Object.entries(frequencies).sort((a, b) => b[1] - a[1]));
  const half = $derived(Math.ceil(entries.length / 2));
  const rows = $derived(
    entries.slice(0, half).map((left, i) => [left, entries[half + i]] as const)
  );

  function fmt(pct: number): string {
    return `${pct.toFixed(pct < 1 ? 2 : 1)} %`;
  }
</script>

<div class="freq-table-wrapper">
  <table class="freq-table font-mono">
    <thead>
      <tr>
        <th>Znak</th><th>Četnost</th><th>Znak</th><th>Četnost</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as [left, right] (left[0])}
        <tr>
          <td>{left[0]}</td><td>{fmt(left[1])}</td>
          <td>{right?.[0] ?? ''}</td><td>{right ? fmt(right[1]) : ''}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .freq-table-wrapper {
    overflow-x: auto;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border-subtle);
    background-color: var(--color-surface-1);
  }

  .freq-table {
    width: 100%;
    border-collapse: collapse;
    font-size: calc(11px * var(--font-scale));
    text-align: left;
  }

  .freq-table th {
    background-color: var(--color-surface-2);
    color: var(--color-text-secondary);
    padding: 5px 8px;
    font-size: calc(10px * var(--font-scale));
    font-weight: 600;
  }

  .freq-table td {
    padding: 4px 8px;
    border-top: 1px solid var(--color-border-subtle);
  }
</style>
