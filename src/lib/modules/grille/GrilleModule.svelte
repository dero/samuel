<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
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

  const modSettings = localSettingsService.forModule('grille');

  // Core state
  let rawInput = $state<string>(modSettings.getString('raw_text', ''));
  let holes = $state<string[]>(modSettings.getJSON<string[]>('holes', []));

  // Configuration options (each can be non-standard)
  let tapOrderReading = $state<boolean>(modSettings.getBoolean('tap_order', false));
  let rotationCCW = $state<boolean>(modSettings.getBoolean('rotation_ccw', false));
  let writeMode = $state<boolean>(modSettings.getBoolean('write_mode', false));

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
  // A table read row by row should fill the square exactly
  const fillAttention = $derived(
    !writeMode && hasData && tokens.length !== gridSize * gridSize
      ? `${tokens.length} buněk, mřížka ${gridSize}×${gridSize} má ${gridSize * gridSize}`
      : null
  );

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
  podklad={{
    kind: 'grid',
    required: true,
    empty: !hasData,
    title: writeMode ? 'Text k zašifrování' : 'Tabulka znaků',
    description: writeMode
      ? 'Text se vepíše do otvorů mřížky, výsledkem je tabulka.'
      : 'Čtverec 4×4 až 10×10, čte se po řádcích. Čárka odděluje víceznakové buňky.',
    example: writeMode ? 'POKLADNASVERU' : 'ABCD EFGH IJKL MNOP',
    placeholder: writeMode ? 'Text k zašifrování…' : 'Např. ABCDEF… nebo AB, CD, EF…',
    attention: fillAttention,
    value: rawInput,
    onSave: (val) => {
      rawInput = val;
    }
  }}
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
        emptyHint="Označte otvory v mřížce."
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
      <GrilleGrid
        {gridSize}
        {gridMatrix}
        {holes}
        {rotationCCW}
        {tapOrderReading}
        onToggleHole={handleToggleHole}
        onResetHoles={handleResetHoles}
      />
    </div>
  {/snippet}
</ModuleShell>

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
