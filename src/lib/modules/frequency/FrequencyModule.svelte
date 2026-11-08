<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import StatusBar from '../../components/ui/StatusBar.svelte';
  import MonogramsView from './MonogramsView.svelte';
  import FrequencyReference from './FrequencyReference.svelte';
  import IocDetailModal from './IocDetailModal.svelte';
  import FrequencyToolbar from './FrequencyToolbar.svelte';
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

  // Actions
  function handleReset() {
    settings.vibrate(35);
    rawText = '';
    removeDiacritics = false;
    removeSymbols = true;
    sortBy = 'freq';
    toast.show('Modul frekvence resetován', { type: 'success' });
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
    example: 'WKLV LV D VHFUHW',
    value: rawText,
    onSave: (val) => {
      rawText = val;
    }
  }}
>
  <!-- TOP ZONE: Output (Letter frequency histogram and status bar) -->
  {#snippet output()}
    <div class="freq-output-stage">
      {#if rawText.trim()}
        <!-- Active Analysis: Simplified 1-line status bar -->
        <StatusBar
          onclick={() => {
            settings.vibrate(15);
            showIocModal = true;
          }}
          title="Klepnutím zobrazit vysvětlení a hodnotu Indexu koincidence"
          ariaLabel="Klepnutím zobrazit vysvětlení a hodnotu Indexu koincidence"
        >
          {#snippet left()}
            <span class="status-counts font-mono">
              {analysis.totalChars} znaků • {analysis.uniqueChars} různých
            </span>
          {/snippet}

          {#snippet right()}
            <span class="status-badge-wrap">
              <span
                class="nature-pill font-mono"
                class:nature-mono={analysis.ioc.classification === 'mono'}
                class:nature-poly={analysis.ioc.classification === 'poly'}
                class:nature-high={analysis.ioc.classification === 'high'}
                class:nature-low={analysis.ioc.classification === 'low'}
              >
                {#if analysis.ioc.classification === 'mono'}
                  ✓ Přirozený text
                {:else if analysis.ioc.classification === 'poly'}
                  ~ Polyalfabetická
                {:else if analysis.ioc.classification === 'high'}
                  ! Repetitivní
                {:else}
                  Méně dat
                {/if}
              </span>
              <Info size={14} weight="bold" class="status-info-icon" />
            </span>
          {/snippet}
        </StatusBar>

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

  <!-- BOTTOM ZONE: Sub-toolbar & Input controls -->
  {#snippet input()}
    <FrequencyToolbar
      {sortBy}
      onSortChange={(s) => {
        sortBy = s;
      }}
    />
  {/snippet}

  <!-- Contextual Menu Options -->
  {#snippet menuOptions()}
    <div class="menu-group">
      <div class="menu-group-title">Analýza</div>
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
    </div>
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

  .status-counts {
    font-size: calc(11px * var(--font-scale));
    font-weight: 700;
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .status-badge-wrap {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
  }

  .nature-pill {
    font-size: calc(10.5px * var(--font-scale));
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 4px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    color: var(--color-text-primary);
    white-space: nowrap;
  }

  .nature-mono {
    border-color: rgba(16, 185, 129, 0.45);
    background-color: rgba(16, 185, 129, 0.12);
    color: #34d399;
  }

  .nature-poly {
    border-color: rgba(59, 130, 246, 0.45);
    background-color: rgba(59, 130, 246, 0.12);
    color: #60a5fa;
  }

  .nature-high {
    border-color: rgba(245, 158, 11, 0.45);
    background-color: rgba(245, 158, 11, 0.12);
    color: #fbbf24;
  }

  .nature-low {
    border-color: var(--color-border-subtle);
    color: var(--color-text-muted);
  }

  :global(.status-info-icon) {
    color: var(--color-text-muted);
    opacity: 0.8;
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

  /* Menu groups */
  .menu-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
  }

  .menu-group-title {
    font-size: calc(11px * var(--font-scale));
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    margin-bottom: 2px;
  }
</style>
