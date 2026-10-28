<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import RefList from '../../components/reference/RefList.svelte';
  import RefSection from '../../components/reference/RefSection.svelte';
  import type { RefHelpData, RefTool } from '../../components/reference/refTypes';
  import { PHONE_GRID, getPhoneKeyLetters } from './mobileData';

  const keys = PHONE_GRID.map(({ digit, keyId }) => ({
    digit,
    chars: getPhoneKeyLetters(keyId)
      .map((c) => (c === ' ' ? '␣' : c))
      .join(' ')
  }));

  type PhoneMode = 'multitap' | 't9';

  interface Props {
    /** Input mode currently active in the module (opens its help). */
    activeTool: PhoneMode;
  }

  let { activeTool }: Props = $props();

  const tools: RefTool<PhoneMode>[] = [
    {
      id: 'multitap',
      label: 'SMS',
      help: {
        controls: [
          ['Klávesa', 'opakované klepnutí přepíná písmena, po 1 s se zapíše'],
          ['`0`', 'mezera']
        ],
        pitfalls: [['Dvě písmena z jedné klávesy', '`AB` = `2`, pauza, `22`. Bez pauzy vznikne `C`.']]
      }
    },
    {
      id: 't9',
      label: 'T9',
      help: {
        controls: [
          ['Klávesa', 'jedno klepnutí na písmeno, slovo dohledá slovník'],
          ['`*`', 'další kandidát slova'],
          ['`0`', 'potvrdí slovo a vloží mezeru'],
          ['`1`', 'potvrdí slovo a vloží tečku']
        ],
        pitfalls: [['Bez slovníku', 'ukáže jen první písmena kláves → stáhnout slovník v Nastavení']]
      }
    }
  ];

  const help: RefHelpData = {
    controls: [
      ['Podržení klávesy', 'vloží samotnou číslici'],
      ['SMS / T9', 'přepíná lišta nad klávesnicí']
    ],
    pitfalls: [
      ['Jiný telefon', '`1`, `0`, `*`, `#` se liší podle výrobce. Písmena na `2`–`9` platí všude.'],
      ['Česká diakritika', 'telefony s češtinou mají na klávesách i `Á`, `Č`… → počty stisků mohou být vyšší']
    ]
  };
</script>

<RefLayout tabs={[{ id: 'keys', label: 'Klávesy' }]} {help} {tools} {activeTool}>
  {#snippet content()}
    <RefSection title="Klávesnice">
      <div class="phone-grid">
        {#each keys as key (key.digit)}
          <div class="phone-key">
            <span class="key-num">{key.digit}</span>
            <span class="key-chars">{key.chars}</span>
          </div>
        {/each}
      </div>
    </RefSection>

    <RefSection title="Zápisy v šifrách">
      <RefList
        items={[
          ['Počet stisků', '`22` = B, `7777` = S, `0` = ␣'],
          ['Klávesa a pořadí', '`7/4` nebo `(7, 4)` = S'],
          ['T9', 'jedna číslice na písmeno: `3662` = DOMA']
        ]}
      />
    </RefSection>
  {/snippet}
</RefLayout>

<style>
  .phone-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    padding: var(--space-sm);
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
  }

  .phone-key {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--space-xs);
    background-color: var(--color-surface-2);
    border-radius: var(--radius-xs);
  }

  .key-num {
    font-family: var(--font-mono);
    font-size: var(--text-base);
    font-weight: 800;
    color: var(--color-text-primary);
  }

  .key-chars {
    font-family: var(--font-mono);
    font-size: var(--text-2xs);
    color: var(--color-text-secondary);
  }
</style>
