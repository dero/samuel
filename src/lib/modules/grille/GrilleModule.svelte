<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import TextEntrySheet from '../../components/ui/TextEntrySheet.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import NonStandardSettingsBanner from '../../components/ui/NonStandardSettingsBanner.svelte';
  import GrilleGrid from './GrilleGrid.svelte';
  import GrilleReference from './GrilleReference.svelte';
  import {
    parseGridInput,
    computeGridSize,
    buildGridMatrix,
    getRequiredHolesCount,
    getRotatedHolesForStep,
    readThroughHoles,
    executeWriteMode
  } from './grilleSolver';
  import { ROTATION_COLORS } from './grilleData';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import { localSettingsService } from '../../services/localSettingsService';
  import {
    PencilSimple,
    X
  } from 'phosphor-svelte';

  const modSettings = localSettingsService.forModule('grille');

  // Core state
  let rawInput = $state<string>(modSettings.getString('raw_text', ''));
  let holes = $state<string[]>(modSettings.getJSON<string[]>('holes', []));

  // Configuration options (each can be non-standard)
  let tapOrderReading = $state<boolean>(modSettings.getBoolean('tap_order', false));
  let rotationCCW = $state<boolean>(modSettings.getBoolean('rotation_ccw', false));
  let writeMode = $state<boolean>(modSettings.getBoolean('write_mode', false));

  // UI sheets
  let showTextSheet = $state<boolean>(false);

  // Persistence
  $effect(() => {
    modSettings.update({
      raw_text: rawInput,
      holes,
      tap_order: tapOrderReading,
      rotation_ccw: rotationCCW,
      write_mode: writeMode
    });
  });

  // Derived grid tokens and size
  const tokens = $derived(parseGridInput(rawInput));
  const gridSize = $derived(computeGridSize(tokens.length));
  const hasData = $derived(tokens.length > 0);
  const requiredHoles = $derived(getRequiredHolesCount(gridSize));

  // Reset holes when grid size changes or data is cleared
  let prevGridSize = $state<number | null>(null);
  $effect(() => {
    if (!hasData) {
      holes = [];
    } else if (prevGridSize !== null && gridSize !== prevGridSize) {
      if (holes.length > 0) {
        holes = [];
        toast.show(`Mřížka přizpůsobena na ${gridSize}×${gridSize}`, { type: 'success' });
      }
    }
    prevGridSize = gridSize;
  });

  // Write mode distribution simulation
  const writeResult = $derived.by(() => {
    if (!writeMode || !hasData || holes.length === 0) {
      return {
        grid: Array.from({ length: gridSize }, () => Array(gridSize).fill('')),
        resultText: ''
      };
    }
    return executeWriteMode(
      tokens,
      holes,
      gridSize,
      rotationCCW ? 'ccw' : 'cw',
      tapOrderReading
    );
  });

  // Matrix representation (in write mode, filled via mask distribution; in read mode, row by row)
  const gridMatrix = $derived.by<string[][]>(() => {
    if (writeMode) {
      return writeResult.grid;
    }
    return buildGridMatrix(tokens, gridSize);
  });

  // 4 rotation segments calculation
  const rotationSegments = $derived.by<string[]>(() => {
    if (holes.length === 0 || !hasData) {
      return ['', '', '', ''];
    }

    if (writeMode) {
      return [writeResult.resultText, '', '', ''];
    }

    const segments: string[] = [];
    const dir = rotationCCW ? 'ccw' : 'cw';

    for (let step = 0; step < 4; step++) {
      const stepHoles = getRotatedHolesForStep(holes, gridSize, step, dir);
      const text = readThroughHoles(gridMatrix, stepHoles, gridSize, tapOrderReading);
      segments.push(text);
    }

    return segments;
  });

  const fullText = $derived(rotationSegments.join(''));

  // Non-standard settings count
  const nonStandardCount = $derived(
    (tapOrderReading ? 1 : 0) +
    (rotationCCW ? 1 : 0) +
    (writeMode ? 1 : 0)
  );

  function resetToDefaults() {
    tapOrderReading = false;
    rotationCCW = false;
    writeMode = false;
    toast.show('Výchozí nastavení obnoveno', { type: 'success' });
  }

  function handleToggleHole(r: number, c: number) {
    const key = `${r},${c}`;
    if (holes.includes(key)) {
      holes = holes.filter((k) => k !== key);
    } else {
      if (holes.length >= requiredHoles) {
        toast.show(`Maximum je ${requiredHoles} otvorů`, { type: 'warning' });
        return;
      }
      holes = [...holes, key];
    }
  }

  function handleResetHoles() {
    holes = [];
    toast.show('Otvory vymazány', { type: 'success' });
  }

  function handleClearAll() {
    settings.vibrate(35);
    rawInput = '';
    holes = [];
  }
</script>

<ModuleShell
  title="Mřížka"
  hasAlphabet={false}
  hasWarning={nonStandardCount > 0}
  onReset={handleClearAll}
>
  {#snippet menuOptions()}
    <NonStandardSettingsBanner
      count={nonStandardCount}
      onResetDefaults={resetToDefaults}
    />

    <div class="menu-group">
      <div class="menu-group-title">Šifra</div>

      <OptionRow
        label="Číst v pořadí klepnutí"
        hint="Místo po řádcích"
        checked={tapOrderReading}
        isNonStandard={tapOrderReading}
        onChange={(v) => (tapOrderReading = v)}
      />

      <OptionRow
        label="Otáčet proti směru ↺"
        hint="Proti směru hodinových ručiček"
        checked={rotationCCW}
        isNonStandard={rotationCCW}
        onChange={(v) => (rotationCCW = v)}
      />

      <OptionRow
        label="Šifrovat"
        hint="Text se vepíše do otvorů, výsledkem je tabulka"
        checked={writeMode}
        isNonStandard={writeMode}
        onChange={(v) => (writeMode = v)}
      />
    </div>
  {/snippet}

  {#snippet reference()}
    <GrilleReference />
  {/snippet}

  {#snippet output()}
    <div class="grille-output-stage">
      <TranslationCard
        text={fullText}
        emptyHint={writeMode
          ? 'Zadejte text a označte otvory.'
          : 'Vložte tabulku a označte otvory.'}
      >
        {#snippet children()}
          {#if fullText}
            {#if writeMode}
              <span class="rotation-segment rotation-0">{rotationSegments[0]}</span>
            {:else}
              {#each rotationSegments as seg, i}
                {#if seg}
                  <span
                    class="rotation-segment {ROTATION_COLORS[i].className}"
                    title="Rotace {ROTATION_COLORS[i].label}"
                  >
                    {seg}
                  </span>
                {/if}
              {/each}
            {/if}
          {/if}
        {/snippet}
      </TranslationCard>
    </div>
  {/snippet}

  {#snippet input()}
    <div class="zone-input-flow">
      <!-- 1. Interactive N×N Grid -->
      <GrilleGrid
        {gridSize}
        {gridMatrix}
        {holes}
        {rotationCCW}
        {tapOrderReading}
        {hasData}
        onToggleHole={handleToggleHole}
        onResetHoles={handleResetHoles}
      />

      <!-- 2. Text input row (cipher-input-trigger) -->
      <div class="input-row">
        <button
          type="button"
          class="cipher-input-trigger font-mono"
          onclick={() => {
            settings.vibrate(20);
            showTextSheet = true;
          }}
          title={writeMode ? 'Klepnutím zadat text k zašifrování' : 'Klepnutím zadat nebo upravit podkladová data'}
          aria-label={writeMode ? 'Klepnutím zadat text k zašifrování' : 'Klepnutím zadat nebo upravit podkladová data'}
        >
          {#if rawInput}
            <span class="trigger-text">{rawInput}</span>
          {:else}
            <span class="trigger-placeholder">
              {writeMode ? 'Text k zašifrování…' : 'Obsah tabulky…'}
            </span>
          {/if}
        </button>

        {#if rawInput}
          <button
            type="button"
            class="input-clear-btn"
            onclick={() => {
              settings.vibrate(15);
              rawInput = '';
            }}
            title="Vymazat vstup"
            aria-label="Vymazat vstup"
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
      </div>
    </div>
  {/snippet}
</ModuleShell>

<!-- Text Entry Sheet -->
<TextEntrySheet
  open={showTextSheet}
  title={writeMode ? 'Text k zašifrování' : 'Obsah tabulky'}
  value={rawInput}
  placeholder={writeMode
    ? 'Text k zašifrování…'
    : 'Např. ABCDEF… nebo AB, CD, EF…'}
  onSave={(val) => {
    rawInput = val;
  }}
  onClose={() => {
    showTextSheet = false;
  }}
/>

<style>
  .zone-input-flow {
    display: flex;
    flex-direction: column;
    gap: var(--zone-input-gap, 8px);
    width: 100%;
    box-sizing: border-box;
  }

  .grille-output-stage {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    gap: 4px;
    box-sizing: border-box;
  }

  /* Rotation colored segments inside TranslationCard */
  .rotation-segment {
    font-weight: 700;
  }

  .rotation-segment.rotation-0 {
    color: #f59e0b;
  }

  .rotation-segment.rotation-1 {
    color: #00d2ff;
  }

  .rotation-segment.rotation-2 {
    color: #10b981;
  }

  .rotation-segment.rotation-3 {
    color: #a78bfa;
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

  .font-mono {
    font-family: var(--font-mono, monospace);
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

  .input-sheet-btn {
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

  .input-sheet-btn:hover {
    color: var(--color-accent-primary);
    background-color: var(--color-surface-active);
  }

  .input-sheet-btn:active {
    transform: scale(0.96);
  }

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
