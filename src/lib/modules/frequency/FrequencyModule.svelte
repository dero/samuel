<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import MenuGroup from '../../components/ui/MenuGroup.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import MonogramsView from './MonogramsView.svelte';
  import FrequencyReference from './FrequencyReference.svelte';
  import IocDetailModal from './IocDetailModal.svelte';
  import { analyzeFrequency, type FrequencyOptions } from './frequencySolver';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import { localSettingsService } from '../../services/localSettingsService';
  import { Info } from 'phosphor-svelte';

  const modSettings = localSettingsService.forModule('freq');

  // State
  let rawText = $state<string>(modSettings.getString('raw_text', ''));
  let removeDiacritics = $state<boolean>(modSettings.getBoolean('remove_diacritics', false));
  let removeSymbols = $state<boolean>(modSettings.getBoolean('remove_symbols', true));
  let sortBy = $state<'freq' | 'alpha'>(
    (modSettings.getString('sort_by', 'freq') as 'freq' | 'alpha') || 'freq'
  );

  let showIocModal = $state<boolean>(false);

  // Persistence
  $effect(() => {
    modSettings.setString('raw_text', rawText);
    modSettings.setBoolean('remove_diacritics', removeDiacritics);
    modSettings.setBoolean('remove_symbols', removeSymbols);
    modSettings.setString('sort_by', sortBy);
  });

  // Solver analysis
  const analysisOptions = $derived<FrequencyOptions>({
    removeDiacritics,
    removeSymbols
  });

  const analysis = $derived.by(() => {
    return analyzeFrequency(rawText, analysisOptions);
  });

  const SORT_OPTIONS: SegmentOption<'freq' | 'alpha'>[] = [
    { id: 'freq', label: 'Četnost ▾' },
    { id: 'alpha', label: 'Abecedně' }
  ];

  const IOC_LABELS = {
    mono: { label: 'Přirozený text', tone: 'success' },
    poly: { label: 'Polyalfabetická', tone: 'accent' },
    high: { label: 'Repetitivní', tone: 'warning' },
    low: { label: 'Méně dat', tone: 'neutral' }
  } as const;

  const iocLabel = $derived(IOC_LABELS[analysis.ioc.classification]);

  // Actions
  function handleReset() {
    rawText = '';
    removeDiacritics = false;
    removeSymbols = true;
    sortBy = 'freq';
    toast.show('Nástroj resetován', { type: 'success' });
  }
</script>

<ModuleShell
  title="Frekvence"
  hasAlphabet={false}
  onReset={handleReset}
  podklad={{
    kind: 'text',
    required: true,
    empty: !rawText.trim(),
    title: 'Šifrový text',
    description: 'Spočítá četnost písmen a podle indexu koincidence odhadne typ šifry.',
    format: 'Šifrový text, mezery a interpunkce nevadí.',
    example: 'WKLV LV D VHFUHW',
    value: rawText,
    onSave: (val) => {
      rawText = val;
    }
  }}
  bar={{
    empty: !rawText.trim(),
    hint: 'Vložte šifrový text.',
    status: `${analysis.totalChars} zn. · ${analysis.uniqueChars} různých`,
    action: rawText.trim()
      ? {
          label: iocLabel.label,
          tone: iocLabel.tone,
          icon: Info,
          title: 'Vysvětlení a hodnota Indexu koincidence',
          onClick: () => {
            showIocModal = true;
          }
        }
      : undefined
  }}
>
  <!-- TOP ZONE: Output (Letter frequency histogram) -->
  {#snippet output()}
    <div class="freq-output-stage">
      {#if rawText.trim()}
        <!-- Scrollable Letter Histogram -->
        <div class="histogram-wrapper">
          {#if analysis.monograms.length === 0}
            <div class="empty-histogram-msg">
              Žádné znaky k analýze.
            </div>
          {:else}
            <MonogramsView
              monograms={analysis.monograms}
              totalChars={analysis.totalChars}
              {sortBy}
            />
          {/if}
        </div>
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
      ariaLabel="Řazení frekvenční analýzy"
    />
  {/snippet}

  <!-- Contextual Menu Options -->
  {#snippet menuOptions()}
    <MenuGroup title="Analýza">
      <OptionRow
        label="Ignorovat diakritiku"
        hint="Č → C, Á → A…"
        checked={removeDiacritics}
        onChange={(val) => {
          removeDiacritics = val;
        }}
      />

      <OptionRow
        label="Ignorovat interpunkci"
        hint="Jen písmena, bez číslic a mezer"
        checked={removeSymbols}
        onChange={(val) => {
          removeSymbols = val;
        }}
      />
    </MenuGroup>
  {/snippet}

  <!-- Reference Modal -->
  {#snippet reference()}
    <FrequencyReference />
  {/snippet}
</ModuleShell>

<!-- IoC Detail Modal -->
<IocDetailModal
  open={showIocModal}
  {analysis}
  onClose={() => {
    showIocModal = false;
  }}
/>

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

  .histogram-wrapper {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background-color: #000000;
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .empty-histogram-msg {
    padding: 24px;
    text-align: center;
    color: var(--color-text-secondary);
    font-size: calc(13px * var(--font-scale));
    line-height: 1.4;
  }

</style>
