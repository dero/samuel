<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import RefList from '../../components/reference/RefList.svelte';
  import RefSection from '../../components/reference/RefSection.svelte';
  import type { RefHelpData } from '../../components/reference/refTypes';

  const help: RefHelpData = {
    controls: [
      ['5×5 / 6×6', 'lišta nad čtvercem'],
      ['Řádek a sloupec', 'klepnout na záhlaví v libovolném pořadí, písmeno se vloží samo'],
      ['Písmeno ve čtverci', 'klepnutí ho vloží přímo'],
      ['Popisky souřadnic', 'v menu: `1–5` nebo `A–E`'],
      ['Vynechaná písmena', 'v menu, když má abeceda víc znaků než čtverec']
    ],
    pitfalls: [
      ['Prohozené osy', 'nedává-li text smysl, číst souřadnice jako sloupec, řádek'],
      ['Sloučené I/J', 'v menu vynechat `J`, místo něj se čte `I`'],
      ['Ťukací kód', 'bez `K`, místo něj `C` → v menu vynechat `K`'],
      ['Osy ADFGX', 'popisky `A–E`, převést `A D F G X` → `A B C D E`'],
      ['Osy ADFGVX (6×6)', 'převést `A D F G V X` → `A B C D E F`']
    ]
  };
</script>

<RefLayout tabs={[{ id: 'notation', label: 'Zápisy' }]} {help}>
  {#snippet content()}
    <RefSection title="Zápis souřadnic" note="Vždy řádek, pak sloupec.">
      <RefList
        items={[
          ['Číslice', '`12` = řádek 1, sloupec 2 = B'],
          ['Písmena', '`AB` = řádek A, sloupec B = B'],
          ['Ťukání', '`•• •••` = 2, 3 = H (ťukací kód)'],
          ['Počet znaků', '`|| |||`, `oo ooo` apod. = 2, 3']
        ]}
      />
    </RefSection>

    <RefSection title="Velikosti">
      <RefList
        items={[
          ['5×5', '25 polí, 26 písmen → jedno chybí: obvykle `Q`, jinak sloučené `I/J`'],
          ['6×6', '`A–Z` a číslice `0–9`'],
          ['S CH (27 znaků)', 'v 5×5 chybí dvě písmena → v menu Vynechaná písmena']
        ]}
      />
    </RefSection>
  {/snippet}
</RefLayout>
