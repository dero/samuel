<script lang="ts">
  import RefSection from '../../components/reference/RefSection.svelte';

  const DIRECTIONS = [
    { code: 'S', name: 'sever, nahoru', angle: '0°', delta: '0, +1' },
    { code: 'SV', name: 'severovýchod', angle: '45°', delta: '+1, +1' },
    { code: 'V', name: 'východ, doprava', angle: '90°', delta: '+1, 0' },
    { code: 'JV', name: 'jihovýchod', angle: '135°', delta: '+1, −1' },
    { code: 'J', name: 'jih, dolů', angle: '180°', delta: '0, −1' },
    { code: 'JZ', name: 'jihozápad', angle: '225°', delta: '−1, −1' },
    { code: 'Z', name: 'západ, doleva', angle: '270°', delta: '−1, 0' },
    { code: 'SZ', name: 'severozápad', angle: '315°', delta: '−1, +1' }
  ];
</script>

<RefSection title="Směry" note="Úhel od severu po směru hodinových ručiček. Posun X, Y.">
  <div class="ref-table-wrap">
    <table class="ref-table">
      <thead>
        <tr>
          <th class="col-code"></th>
          <th>Směr</th>
          <th class="col-val">Úhel</th>
          <th class="col-val">Posun</th>
        </tr>
      </thead>
      <tbody>
        {#each DIRECTIONS as dir (dir.code)}
          <tr>
            <td class="col-code dir-code">{dir.code}</td>
            <td>{dir.name}</td>
            <td class="col-val">{dir.angle}</td>
            <td class="col-val">{dir.delta}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</RefSection>

<style>
  .dir-code {
    font-weight: 700;
    color: var(--color-accent-primary);
  }
</style>
