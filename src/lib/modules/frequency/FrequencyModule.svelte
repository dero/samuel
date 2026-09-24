<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import TextEntrySheet from '../../components/ui/TextEntrySheet.svelte';
  import BottomSheet from '../../components/ui/BottomSheet.svelte';
  import MonogramsView from './MonogramsView.svelte';
  import FrequencyReference from './FrequencyReference.svelte';
  import { analyzeFrequency, type FrequencyOptions } from './frequencySolver';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import { navigation } from '../../state/navigation.svelte';
  import { localSettingsService } from '../../services/localSettingsService';
  import {
    PencilSimple,
    ClipboardText,
    ArrowRight,
    ArrowsClockwise,
    Trash,
    X,
    Info
  } from 'phosphor-svelte';

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

  // Sub-toolbar segmented options
  const SORT_SEGMENT_OPTIONS: SegmentOption<'freq' | 'alpha'>[] = [
    { id: 'freq', label: 'Podle četnosti ▾' },
    { id: 'alpha', label: 'Abecedně (A–Z)' }
  ];

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
      handleReset();
      isResetConfirming = false;
      toast.show('Frekvence vyčištěna', { type: 'success' });
    } else {
      settings.vibrate(30);
      isResetConfirming = true;
      setTimeout(() => {
        isResetConfirming = false;
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
      {#if !rawText.trim()}
        <!-- Empty State Prompt -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="empty-hint-card"
          onclick={() => {
            settings.vibrate(20);
            showTextSheet = true;
          }}
        >
          <div class="empty-icon">📊</div>
          <div class="empty-title">Frekvenční analýza</div>
          <div class="empty-desc">
            Vložte šifrový text do spodního řádku nebo klepněte sem pro otevření editoru.
          </div>
        </div>
      {:else}
        <!-- Active Analysis: Simplified 1-line status bar -->
        <button
          type="button"
          class="status-summary-bar"
          onclick={() => {
            settings.vibrate(15);
            showIocModal = true;
          }}
          title="Klepnutím zobrazit vysvětlení a hodnotu Indexu koincidence"
          aria-label="Klepnutím zobrazit vysvětlení a hodnotu Indexu koincidence"
        >
          <span class="status-counts font-mono">
            {analysis.totalChars} znaků • {analysis.uniqueChars} různých
          </span>

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
        </button>

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
    <div class="zone-input-flow">
      <!-- 1. Sub-Toolbar: Sort segmented control (36 px) -->
      <div class="subtoolbar-container">
        <SegmentedControl
          options={SORT_SEGMENT_OPTIONS}
          value={sortBy}
          size="sm"
          onChange={(s) => {
            sortBy = s;
          }}
          ariaLabel="Řazení frekvenční analýzy"
        />
      </div>

      <!-- 2. Single-line Input Row (42 px) - Click opens TextEntrySheet, never inline keyboard -->
      <div class="input-row">
        <button
          type="button"
          class="cipher-input-trigger font-mono"
          onclick={() => {
            settings.vibrate(20);
            showTextSheet = true;
          }}
          title="Klepnutím zadat nebo upravit šifrový text"
          aria-label="Klepnutím zadat nebo upravit šifrový text"
        >
          {#if rawText}
            <span class="trigger-text">{rawText}</span>
          {:else}
            <span class="trigger-placeholder">Klepnutím zadat text...</span>
          {/if}
        </button>
        {#if rawText}
          <button
            type="button"
            class="input-clear-btn"
            onclick={() => {
              settings.vibrate(15);
              rawText = '';
            }}
            title="Vymazat text"
            aria-label="Vymazat text"
          >
            <X size={15} weight="bold" />
          </button>
        {/if}
        <button
          type="button"
          class="input-sheet-btn"
          onclick={() => {
            settings.vibrate(20);
            showTextSheet = true;
          }}
          title="Otevřít textový editor"
          aria-label="Otevřít textový editor"
        >
          <PencilSimple size={16} weight="bold" />
        </button>
        <button
          type="button"
          class="input-paste-btn"
          onclick={handlePasteText}
          title="Vložit text ze schránky"
          aria-label="Vložit text ze schránky"
        >
          <ClipboardText size={17} weight="bold" />
        </button>
      </div>

      <!-- 3. Bottom Action Row: Transfer text to Substitution -->
      <div class="bottom-actions-row">
        <button
          type="button"
          class="action-transfer-btn primary"
          onclick={transferToSubstitution}
          disabled={!rawText.trim()}
          title="Přenést text přímo do modulu Substituce"
        >
          <span>Přenést do Substituce</span>
          <ArrowRight size={15} weight="bold" />
        </button>
      </div>
    </div>
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
<BottomSheet
  open={showIocModal}
  title="Statistika textu & IoC"
  icon={Info}
  onClose={() => {
    showIocModal = false;
  }}
>
  <div class="ioc-modal-content">
    <div class="ioc-score-header">
      <div class="ioc-score-number font-mono">{analysis.ioc.ioc.toFixed(4)}</div>
      <div
        class="ioc-classification-badge font-mono"
        class:nature-mono={analysis.ioc.classification === 'mono'}
        class:nature-poly={analysis.ioc.classification === 'poly'}
        class:nature-high={analysis.ioc.classification === 'high'}
        class:nature-low={analysis.ioc.classification === 'low'}
      >
        {analysis.ioc.label}
      </div>
    </div>

    <p class="ioc-description-text">{analysis.ioc.description}</p>

    <div class="ioc-summary-grid font-mono">
      <div class="ioc-summary-card">
        <span class="summary-card-label">Celkem znaků</span>
        <span class="summary-card-val">{analysis.totalChars}</span>
      </div>
      <div class="ioc-summary-card">
        <span class="summary-card-label">Různých symbolů</span>
        <span class="summary-card-val">{analysis.uniqueChars}</span>
      </div>
    </div>

    <div class="ioc-scale-guide">
      <div class="scale-guide-title">Orientační hodnoty Indexu koincidence:</div>
      <div class="scale-guide-row">
        <span class="scale-val font-mono">~ 0.060</span>
        <span class="scale-desc">Čeština bez diakritiky (přirozený text, substituce, posun)</span>
      </div>
      <div class="scale-guide-row">
        <span class="scale-val font-mono">~ 0.048</span>
        <span class="scale-desc">Čeština s diakritikou (42 písmen)</span>
      </div>
      <div class="scale-guide-row">
        <span class="scale-val font-mono">~ 0.038 – 0.045</span>
        <span class="scale-desc">Polyalfabetická šifra (Vigenère s delším heslem)</span>
      </div>
      <div class="scale-guide-row">
        <span class="scale-val font-mono">0.0385</span>
        <span class="scale-desc">Uniformní náhodný šum (1 / 26)</span>
      </div>
    </div>
  </div>
</BottomSheet>

<style>
  .freq-output-stage {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-sizing: border-box;
  }

  .empty-hint-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 24px;
    background-color: #000000;
    border: 1px dashed var(--color-border-subtle);
    border-radius: var(--radius-md);
    cursor: pointer;
    gap: 8px;
    box-sizing: border-box;
    transition: border-color 0.15s;
  }

  .empty-hint-card:hover {
    border-color: var(--color-border-focus);
  }

  .empty-icon {
    font-size: 32px;
    margin-bottom: 2px;
  }

  .empty-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .empty-desc {
    font-size: 12px;
    color: var(--color-text-secondary);
    max-width: 280px;
    line-height: 1.4;
  }

  /* Single-line Status Bar */
  .status-summary-bar {
    appearance: none;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 32px;
    padding: 0 8px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    margin-bottom: 6px;
    flex-shrink: 0;
    gap: 8px;
    cursor: pointer;
    box-sizing: border-box;
    transition: background-color 0.12s ease;
  }

  .status-summary-bar:hover {
    background-color: var(--color-surface-3);
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

  .zone-input-flow {
    display: flex;
    flex-direction: column;
    gap: var(--zone-input-gap, 8px);
    width: 100%;
    box-sizing: border-box;
  }

  .subtoolbar-container {
    height: 36px;
    display: flex;
    align-items: center;
    overflow: hidden;
    flex-shrink: 0;
  }

  /* Single-line Input Row */
  .input-row {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    min-height: 42px;
    height: 42px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: 3px 6px;
    box-sizing: border-box;
    transition: border-color 0.12s ease;
  }

  .input-row:focus-within {
    border-color: var(--color-border-focus);
    box-shadow: 0 0 8px rgba(0, 210, 255, 0.15);
  }

  .cipher-input-trigger {
    flex: 1;
    min-width: 0;
    height: 100%;
    background: transparent;
    border: none;
    outline: none;
    display: flex;
    align-items: center;
    text-align: left;
    padding: 0 4px;
    cursor: pointer;
    overflow: hidden;
  }

  .trigger-text {
    color: var(--color-text-primary);
    font-size: var(--text-base);
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.5px;
  }

  .trigger-placeholder {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    font-family: var(--font-sans);
    font-weight: 400;
  }

  .input-clear-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    border-radius: var(--radius-xs);
    flex-shrink: 0;
    transition: color 0.1s ease, background-color 0.1s ease;
  }

  .input-clear-btn:hover {
    color: var(--color-text-primary);
    background-color: var(--color-surface-3);
  }

  .input-sheet-btn,
  .input-paste-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    background-color: var(--color-surface-3);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs);
    color: var(--color-text-secondary);
    cursor: pointer;
    flex-shrink: 0;
    transition: background-color 0.1s ease, color 0.1s ease, transform 0.08s ease;
  }

  .input-sheet-btn:hover,
  .input-paste-btn:hover {
    color: var(--color-accent-primary);
    background-color: var(--color-surface-active);
  }

  .input-sheet-btn:active,
  .input-paste-btn:active {
    transform: scale(0.96);
  }

  .bottom-actions-row {
    display: flex;
    gap: 8px;
    height: 38px;
    flex-shrink: 0;
  }

  .action-transfer-btn {
    flex: 1;
    appearance: none;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background-color: var(--color-surface-3);
    color: var(--color-accent-primary);
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transition: background-color 0.1s ease, transform 0.08s ease;
  }

  .action-transfer-btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  .action-transfer-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
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

  /* IoC Detail Modal Styles */
  .ioc-modal-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 4px 2px 12px;
  }

  .ioc-score-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 8px 12px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
  }

  .ioc-score-number {
    font-size: 24px;
    font-weight: 700;
    color: var(--color-accent-primary);
  }

  .ioc-classification-badge {
    font-size: 12px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 4px;
  }

  .ioc-description-text {
    margin: 0;
    font-size: 13px;
    line-height: 1.45;
    color: var(--color-text-secondary);
  }

  .ioc-summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .ioc-summary-card {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 10px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
  }

  .summary-card-label {
    font-size: 10.5px;
    color: var(--color-text-muted);
  }

  .summary-card-val {
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .ioc-scale-guide {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
  }

  .scale-guide-title {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 2px;
  }

  .scale-guide-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
    font-size: 12px;
  }

  .scale-val {
    font-weight: 700;
    color: var(--color-accent-primary);
    min-width: 52px;
  }

  .scale-desc {
    color: var(--color-text-secondary);
    line-height: 1.35;
  }
</style>
