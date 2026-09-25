<script lang="ts">
  import { onDestroy } from 'svelte';
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import TextEntrySheet from '../../components/ui/TextEntrySheet.svelte';
  import StatusBar from '../../components/ui/StatusBar.svelte';
  import MonogramsView from './MonogramsView.svelte';
  import FrequencyReference from './FrequencyReference.svelte';
  import IocDetailModal from './IocDetailModal.svelte';
  import FrequencyToolbar from './FrequencyToolbar.svelte';
  import { analyzeFrequency, type FrequencyOptions } from './frequencySolver';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import { navigation } from '../../state/navigation.svelte';
  import { localSettingsService } from '../../services/localSettingsService';
  import {
    ClipboardText,
    ArrowRight,
    ArrowsClockwise,
    Trash,
    Info
  } from 'phosphor-svelte';
  import EmptyHint from '../../components/ui/EmptyHint.svelte';

  const modSettings = localSettingsService.forModule('freq');

  // State
  let rawText = $state<string>(modSettings.getString('raw_text', ''));
  let removeDiacritics = $state<boolean>(modSettings.getBoolean('remove_diacritics', false));
  let removeSymbols = $state<boolean>(modSettings.getBoolean('remove_symbols', true));
  let sortBy = $state<'freq' | 'alpha'>(
    (modSettings.getString('sort_by', 'freq') as 'freq' | 'alpha') || 'freq'
  );

  let showTextSheet = $state<boolean>(false);
  let showIocModal = $state<boolean>(false);
  let isResetConfirming = $state<boolean>(false);
  let resetConfirmTimer: ReturnType<typeof setTimeout> | null = null;

  function clearResetConfirmTimer() {
    if (resetConfirmTimer) {
      clearTimeout(resetConfirmTimer);
      resetConfirmTimer = null;
    }
  }

  onDestroy(() => {
    clearResetConfirmTimer();
  });

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
  }

  async function handlePasteText() {
    settings.vibrate(20);
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        rawText = clip;
        toast.show('✓ Text vložen ze schránky', { type: 'success' });
      }
    } catch {
      toast.show('Nelze číst schránku', { type: 'danger' });
    }
  }

  function transferToSubstitution() {
    if (!rawText.trim()) {
      toast.show('Nejprve zadejte text', { type: 'danger' });
      return;
    }
    settings.vibrate(35);
    localSettingsService.forModule('substitution').setString('ciphertext', rawText);
    navigation.openModule('substitution');
    toast.show('✓ Text přenesen do Substituce', { type: 'success' });
  }

  function transferToShifts() {
    if (!rawText.trim()) {
      toast.show('Nejprve zadejte text', { type: 'danger' });
      return;
    }
    settings.vibrate(35);
    localSettingsService.forModule('shifts').setString('text', rawText);
    navigation.openModule('shifts');
    toast.show('✓ Text přenesen do Posunů', { type: 'success' });
  }

  function triggerResetConfirmation() {
    if (isResetConfirming) {
      clearResetConfirmTimer();
      handleReset();
      isResetConfirming = false;
      toast.show('Frekvence vyčištěna', { type: 'success' });
    } else {
      settings.vibrate(30);
      isResetConfirming = true;
      clearResetConfirmTimer();
      resetConfirmTimer = setTimeout(() => {
        isResetConfirming = false;
        resetConfirmTimer = null;
      }, 3000);
    }
  }
</script>

<ModuleShell
  title="Frekvence"
  hasAlphabet={false}
  onReset={handleReset}
  onPaste={handlePasteText}
>
  <!-- TOP ZONE: Output (Letter frequency histogram and status bar) -->
  {#snippet output()}
    <div class="freq-output-stage">
      <!-- Contextual tooltip: seated directly above input zone, dissolves on input -->
      <EmptyHint
        text="Vložte šifrový text pro zobrazení četnosti znaků."
        hidden={!!rawText.trim()}
      />

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
              Text neobsahuje žádné znaky odpovídající nastavení (např. pouze písmena).
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
      {rawText}
      onSortChange={(s) => {
        sortBy = s;
      }}
      onOpenEditor={() => {
        settings.vibrate(20);
        showTextSheet = true;
      }}
      onClearText={() => {
        settings.vibrate(15);
        rawText = '';
      }}
      onPasteText={handlePasteText}
      onTransferToSubstitution={transferToSubstitution}
    />
  {/snippet}

  <!-- Contextual Menu Options -->
  {#snippet menuOptions()}
    <div class="menu-group">
      <div class="menu-group-title">Nastavení analýzy</div>
      <OptionRow
        label="Ignoruj diakritiku"
        hint="Převést znaky s háčky a čárkami na základní latinku (A–Z)"
        checked={removeDiacritics}
        onChange={(val) => {
          removeDiacritics = val;
        }}
      />

      <OptionRow
        label="Ignoruj interpunkci"
        hint="Analyzovat pouze písmena, ignorovat interpunkci, čísla a mezery"
        checked={removeSymbols}
        onChange={(val) => {
          removeSymbols = val;
        }}
      />
    </div>

    <div class="menu-group">
      <div class="menu-group-title">Akce se šifrou</div>
      <button
        type="button"
        class="menu-btn"
        onclick={handlePasteText}
      >
        <ClipboardText size={18} weight="bold" />
        <span>Vložit ze schránky</span>
      </button>

      <button
        type="button"
        class="menu-btn"
        onclick={transferToSubstitution}
        disabled={!rawText.trim()}
      >
        <ArrowRight size={18} weight="bold" />
        <span>Přenést text do Substituce</span>
      </button>

      <button
        type="button"
        class="menu-btn"
        onclick={transferToShifts}
        disabled={!rawText.trim()}
      >
        <ArrowsClockwise size={18} weight="bold" />
        <span>Přenést text do Posunů</span>
      </button>

      <button
        type="button"
        class="menu-btn danger"
        onclick={triggerResetConfirmation}
      >
        <Trash size={18} weight="bold" />
        <span>{isResetConfirming ? 'Opravdu vymazat text?' : 'Vyčistit modul'}</span>
      </button>
    </div>
  {/snippet}

  <!-- Reference Modal -->
  {#snippet reference()}
    <FrequencyReference />
  {/snippet}
</ModuleShell>

<!-- Multi-line Text Entry Sheet with In-Sheet Option Toggles -->
<TextEntrySheet
  open={showTextSheet}
  title="Šifrový text"
  value={rawText}
  placeholder="Vložte nebo napište šifrový text k frekvenční analýze..."
  onSave={(val) => {
    rawText = val;
  }}
  onClose={() => {
    showTextSheet = false;
  }}
>
  {#snippet options()}
    <div class="sheet-filter-toggles-row">
      <label class="sheet-toggle-label">
        <input
          type="checkbox"
          bind:checked={removeDiacritics}
          class="sheet-checkbox"
        />
        <span>Ignoruj diakritiku</span>
      </label>

      <label class="sheet-toggle-label">
        <input
          type="checkbox"
          bind:checked={removeSymbols}
          class="sheet-checkbox"
        />
        <span>Ignoruj interpunkci</span>
      </label>
    </div>
  {/snippet}
</TextEntrySheet>

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
    font-size: 11px;
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
    font-size: 10.5px;
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
    font-size: 13px;
    line-height: 1.4;
  }

  /* Sheet filter toggles */
  .sheet-filter-toggles-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 12px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
  }

  .sheet-toggle-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-primary);
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
  }

  .sheet-checkbox {
    width: 16px;
    height: 16px;
    accent-color: var(--color-accent-primary);
    cursor: pointer;
  }

  /* Menu groups */
  .menu-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
  }

  .menu-group-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    margin-bottom: 2px;
  }

  .menu-btn {
    appearance: none;
    border: 1px solid var(--color-border-subtle);
    background-color: var(--color-surface-2);
    color: var(--color-text-primary);
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s, color 0.15s;
  }

  .menu-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .menu-btn.danger {
    color: var(--color-accent-danger, #ef4444);
    border-color: rgba(239, 68, 68, 0.3);
  }

</style>
