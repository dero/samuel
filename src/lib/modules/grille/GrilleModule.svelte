<script lang="ts">
  import { untrack } from 'svelte';
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import HoldToAction from '../../components/ui/HoldToAction.svelte';
  import MenuGroup from '../../components/ui/MenuGroup.svelte';
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
  import { toast } from '../../state/toast.svelte';
  import { navigation } from '../../state/navigation.svelte';
  import { localSettingsService } from '../../services/localSettingsService';

  const modSettings = localSettingsService.forModule('grille');

  // Core state
  let rawInput = $state<string>(modSettings.getString('raw_text', ''));
  // Holes as marked, with the grid size they were marked in
  let storedHoles = $state<string[]>(modSettings.getJSON<string[]>('holes', []));
  let holesSize = $state<number | null>(modSettings.get<number | null>('holes_size', null));

  // Configuration options (each can be non-standard)
  let tapOrderReading = $state<boolean>(modSettings.getBoolean('tap_order', false));
  let rotationCCW = $state<boolean>(modSettings.getBoolean('rotation_ccw', false));
  let writeMode = $state<boolean>(modSettings.getBoolean('write_mode', false));

  // Persistence
  $effect(() => {
    modSettings.update({
      raw_text: rawInput,
      holes: storedHoles,
      holes_size: holesSize,
      tap_order: tapOrderReading,
      rotation_ccw: rotationCCW,
      write_mode: writeMode
    });
  });

  function countCells(n: number): string {
    if (n === 1) return '1 buňka';
    return n >= 2 && n <= 4 ? `${n} buňky` : `${n} buněk`;
  }

  function countHoles(n: number): string {
    if (n === 1) return '1 otvor';
    return n >= 2 && n <= 4 ? `${n} otvory` : `${n} otvorů`;
  }

  // Derived grid tokens and size
  const tokens = $derived(parseGridInput(rawInput));
  const gridSize = $derived(computeGridSize(tokens.length));
  const hasData = $derived(tokens.length > 0);
  const requiredHoles = $derived(getRequiredHolesCount(gridSize));
  // A table read row by row should fill the square exactly
  const fillAttention = $derived(
    !writeMode && hasData && tokens.length !== gridSize * gridSize
      ? `${countCells(tokens.length)}, mřížka ${gridSize}×${gridSize} má ${gridSize * gridSize}`
      : null
  );

  // Data saved before the size was stored belongs to the grid it was loaded with
  untrack(() => {
    if (holesSize === null) holesSize = gridSize;
  });

  // The podklad is saved on every keystroke, so a typo can change the size for a moment.
  // Holes only rest while the size differs and are dropped when the edit is settled.
  const holes = $derived(hasData && holesSize === gridSize ? storedHoles : []);

  function setHoles(next: string[]) {
    storedHoles = next;
    holesSize = gridSize;
  }

  function pruneHoles() {
    if (storedHoles.length === 0 || (hasData && holesSize === gridSize)) return;
    storedHoles = [];
    holesSize = gridSize;
    if (hasData) toast.show(`Otvory smazány, mřížka ${gridSize}×${gridSize}`, { type: 'info' });
  }

  untrack(pruneHoles);

  // Leaving Podklad or Menu (any way) settles the edit
  let previousView = untrack(() => navigation.subView);
  $effect(() => {
    const view = navigation.subView;
    if (view !== previousView && (previousView === 'podklad' || previousView === 'menu')) {
      untrack(pruneHoles);
    }
    previousView = view;
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
      setHoles(holes.filter((k) => k !== key));
    } else {
      if (holes.length >= requiredHoles) {
        toast.show(`Maximum je ${countHoles(requiredHoles)}`, { type: 'warning' });
        return;
      }
      setHoles([...holes, key]);
    }
  }

  function handleClearHoles() {
    setHoles([]);
  }

  // Data and Menu options back to defaults
  function handleReset() {
    rawInput = '';
    storedHoles = [];
    tapOrderReading = false;
    rotationCCW = false;
    writeMode = false;
  }
</script>

<ModuleShell
  title="Mřížka"
  hasAlphabet={false}
  hasWarning={nonStandardCount > 0}
  onReset={handleReset}
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
  bar={{
    empty: !hasData || holes.length === 0,
    hint: !hasData
      ? writeMode
        ? 'Vložte text k zašifrování.'
        : 'Vložte tabulku znaků.'
      : 'Klepnutím do mřížky označte otvory.',
    status: `Otvory ${holes.length} z ${requiredHoles}`
  }}
>
  {#snippet menuOptions()}
    <MenuGroup title="Šifra">
      <NonStandardSettingsBanner
        count={nonStandardCount}
        onResetDefaults={resetToDefaults}
      />

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
    </MenuGroup>
  {/snippet}

  {#snippet reference()}
    <GrilleReference />
  {/snippet}

  {#snippet output()}
    <TranslationCard text={fullText}>
      {#snippet children()}
        {#if writeMode}
          <span class="rotation-segment" style:color={ROTATION_COLORS[0].color}>
            {rotationSegments[0]}
          </span>
        {:else}
          {#each rotationSegments as seg, i (i)}
            {#if seg}
              <span
                class="rotation-segment"
                style:color={ROTATION_COLORS[i].color}
                title="Rotace {ROTATION_COLORS[i].label}"
              >
                {seg}
              </span>
            {/if}
          {/each}
        {/if}
      {/snippet}
    </TranslationCard>
  {/snippet}

  {#snippet input()}
    <div class="grille-panel">
      <GrilleGrid
        {gridSize}
        {gridMatrix}
        {holes}
        {rotationCCW}
        {tapOrderReading}
        onToggleHole={handleToggleHole}
      />

      <HoldToAction
        label="Vymazat otvory"
        showLabel
        confirmedLabel="Vymazáno"
        ariaLabel="Podržte pro vymazání otvorů"
        tapWarning="Podržte pro vymazání otvorů"
        disabled={holes.length === 0}
        onAction={handleClearHoles}
      />
    </div>
  {/snippet}
</ModuleShell>

<style>
  .grille-panel {
    display: flex;
    flex-direction: column;
    gap: var(--zone-input-gap);
    width: 100%;
    box-sizing: border-box;
  }

  .rotation-segment {
    font-weight: 700;
  }
</style>
