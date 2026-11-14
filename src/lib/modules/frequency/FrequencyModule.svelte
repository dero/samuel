<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import type { ModuleBarConfig } from '../../components/layout/ModuleBar.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import MenuGroup from '../../components/ui/MenuGroup.svelte';
  import AlphabetSelect from '../../components/ui/AlphabetSelect.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import OverviewView from './OverviewView.svelte';
  import FrequencyReference from './FrequencyReference.svelte';
  import { analyzeTextOverview } from './frequencySolver';
  import { alphabet } from '../../state/alphabet.svelte';
  import { localSettingsService } from '../../services/localSettingsService';

  const modSettings = localSettingsService.forModule('freq');

  const DEFAULT_ALPHABET_ID = 'english-26';

  // State
  let rawText = $state<string>(modSettings.getString('raw_text', ''));
  let alphabetId = $state<string>(
    modSettings.getString('alphabet_id', DEFAULT_ALPHABET_ID)
  );
  let crossWordNgrams = $state<boolean>(
    modSettings.getBoolean('cross_word_ngrams', false)
  );
  let sortBy = $state<'freq' | 'alpha'>(
    (modSettings.getString('sort_by', 'freq') as 'freq' | 'alpha') || 'freq'
  );

  // Persistence
  $effect(() => {
    modSettings.setString('raw_text', rawText);
    modSettings.setString('alphabet_id', alphabetId);
    modSettings.setBoolean('cross_word_ngrams', crossWordNgrams);
    modSettings.setString('sort_by', sortBy);
  });

  const currentLayout = $derived(
    alphabet.getLayout(alphabetId) ?? alphabet.layouts[0]
  );
  const currentLetters = $derived(currentLayout.letters);

  const analysis = $derived(
    analyzeTextOverview(rawText, currentLetters, { crossWordNgrams })
  );

  const SORT_OPTIONS: SegmentOption<'freq' | 'alpha'>[] = [
    { id: 'freq', label: 'Četnost ▾' },
    { id: 'alpha', label: 'Abecedně' }
  ];

  const bar = $derived.by<ModuleBarConfig>(() => {
    if (!rawText.trim()) {
      return { empty: true, hint: 'Vložte text k rozboru.' };
    }
    if (analysis.totalAlphabetChars === 0) {
      return { warning: 'Žádné znaky ze zvolené abecedy.' };
    }
    return {
      empty: false,
      status: `${analysis.totalAlphabetChars} zn. · ${analysis.uniqueAlphabetChars}/${currentLetters.length} · ${analysis.totalWords} sl.`
    };
  });

  function handleReset() {
    rawText = '';
    alphabetId = DEFAULT_ALPHABET_ID;
    crossWordNgrams = false;
  }
</script>

<ModuleShell
  title="Frekvence"
  hasAlphabet={true}
  onReset={handleReset}
  podklad={{
    kind: 'text',
    required: true,
    empty: !rawText.trim(),
    title: 'Text k rozboru',
    description: 'Spočítá znaky zvolené abecedy, samohlásky, dvojice, trojice a délky slov i vět.',
    format: 'Libovolný text nebo šifra.',
    example: 'POKLAD JE ZAKOPAN POD VELKYM DUBEM.',
    value: rawText,
    onSave: (val) => {
      rawText = val;
    }
  }}
  {bar}
>
  {#snippet output()}
    <div class="freq-output-stage">
      {#if rawText.trim()}
        <OverviewView
          {analysis}
          {sortBy}
          alphabetSize={currentLetters.length}
        />
      {/if}
    </div>
  {/snippet}

  {#snippet variants()}
    <SegmentedControl
      options={SORT_OPTIONS}
      value={sortBy}
      size="sm"
      onChange={(s) => {
        sortBy = s;
      }}
      ariaLabel="Řazení znaků abecedy"
    />
  {/snippet}

  {#snippet menuOptions()}
    <MenuGroup title="Abeceda">
      <AlphabetSelect
        value={alphabetId}
        defaultId={DEFAULT_ALPHABET_ID}
        onChange={(id) => {
          alphabetId = id;
        }}
      />
    </MenuGroup>

    <MenuGroup title="N-gramy">
      <OptionRow
        label="Přes hranice slov"
        hint="Počítat dvojice a trojice i přes mezery"
        checked={crossWordNgrams}
        onChange={(val) => {
          crossWordNgrams = val;
        }}
      />
    </MenuGroup>
  {/snippet}

  {#snippet reference()}
    <FrequencyReference />
  {/snippet}
</ModuleShell>

<style>
  .freq-output-stage {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-sizing: border-box;
    position: relative;
  }
</style>
