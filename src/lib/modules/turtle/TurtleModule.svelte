<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import type { ModuleBarConfig } from '../../components/layout/ModuleBar.svelte';
  import Chassis from '../../components/ui/Chassis.svelte';
  import Keycap from '../../components/ui/Keycap.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import MenuGroup from '../../components/ui/MenuGroup.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import NonStandardSettingsBanner from '../../components/ui/NonStandardSettingsBanner.svelte';
  import TurtleCanvas from './TurtleCanvas.svelte';
  import TurtleReference from './TurtleReference.svelte';
  import TurtleEasterEgg from './TurtleEasterEgg.svelte';
  import DrawingUtilityRow from './DrawingUtilityRow.svelte';
  import {
    ArrowUp,
    ArrowDown,
    ArrowCounterClockwise,
    ArrowClockwise,
    MapPin
  } from 'phosphor-svelte';
  import { type TurtleGranularity, GRANULARITY_PRESETS } from './turtleTypes';
  import { parseTurtleField, replayTurtle } from './turtleEngine';
  import {
    appendPress,
    removeLastPress,
    countSteps,
    describeDrawing,
    invalidAttention,
    type DrawingCommand
  } from './drawingNotation';
  import { parseNotation, serializeNotation } from '../../utils/notation';
  import { toast } from '../../state/toast.svelte';
  import { localSettingsService } from '../../services/localSettingsService';

  const modSettings = localSettingsService.forModule('turtle');

  const NOTATION_EXAMPLE = 'V3,P90,V,L45,T,V,M';

  // The notation is the data: the drawing is replayed from it, so every option recomputes it
  let fields = $state.raw<string[]>(modSettings.getJSON<string[]>('fields', []));

  const storedGranularity = modSettings.getNumber('granularity', 90) as TurtleGranularity;
  let granularity = $state<TurtleGranularity>(
    GRANULARITY_PRESETS.includes(storedGranularity) ? storedGranularity : 90
  );
  let initialHeadingEast = $state<boolean>(modSettings.getBoolean('initial_heading_east', false));
  let showDashes = $state<boolean>(modSettings.getBoolean('show_dashes', true));
  // Off by default: unit steps at non-right angles land between grid dots.
  // New key, so the old always-persisted `show_grid: true` does not override the default.
  let showGrid = $state<boolean>(modSettings.getBoolean('grid_visible', false));
  let showTurtle = $state<boolean>(modSettings.getBoolean('show_turtle', true));

  $effect(() => {
    modSettings.setJSON('fields', fields);
    modSettings.update({
      granularity,
      initial_heading_east: initialHeadingEast,
      show_dashes: showDashes,
      grid_visible: showGrid,
      show_turtle: showTurtle
    });
  });

  const commands = $derived(fields.map(parseTurtleField));
  const invalidPieces = $derived(fields.filter((_, i) => commands[i] === null));
  const drawing = $derived(replayTurtle(commands, initialHeadingEast ? 90 : 0));
  const canUndo = $derived(commands.some((cmd) => cmd !== null));

  const bar = $derived<ModuleBarConfig>({
    empty: fields.length === 0,
    hint: 'Kreslete klávesou Vpřed a otočkami.',
    status: `${describeDrawing(countSteps(commands), drawing.markers.length)} · směr ${drawing.heading}°`,
    warning: invalidPieces.length > 0 ? `Neplatné části zápisu: ${invalidPieces.length}` : null
  });

  const granularityOptions: SegmentOption[] = GRANULARITY_PRESETS.map((preset) => ({
    id: String(preset),
    label: `${preset}°`
  }));

  const nonStandardCount = $derived(
    (initialHeadingEast ? 1 : 0) + (!showDashes ? 1 : 0) + (showGrid ? 1 : 0)
  );

  const FORWARD: DrawingCommand = { kind: 'move', code: 'V', count: 1 };
  const BACKWARD: DrawingCommand = { kind: 'move', code: 'Z', count: 1 };
  const PEN: DrawingCommand = { kind: 'pen' };
  const MARKER: DrawingCommand = { kind: 'marker' };

  function press(cmd: DrawingCommand) {
    fields = appendPress(fields, cmd, parseTurtleField);
  }

  function handleUndo() {
    fields = removeLastPress(fields, parseTurtleField);
  }

  function handleClearAll() {
    fields = [];
  }

  function resetDisplayDefaults() {
    initialHeadingEast = false;
    showDashes = true;
    showGrid = false;
    showTurtle = true;
  }

  // Data and Menu options back to defaults; the turn angle is a variant and stays
  function handleReset() {
    handleClearAll();
    resetDisplayDefaults();
  }
</script>

<ModuleShell
  hasWarning={nonStandardCount > 0}
  onReset={handleReset}
  podklad={{
    kind: 'text',
    required: false,
    empty: fields.length === 0,
    title: 'Zápis',
    description:
      'V vpřed, Z zpět, L a P otočka o úhel, T pero, M značka; číslo za pohybem je počet kroků.',
    example: NOTATION_EXAMPLE,
    placeholder: `Např. ${NOTATION_EXAMPLE}`,
    autocapitalize: 'characters',
    attention: invalidAttention(invalidPieces),
    value: serializeNotation(fields),
    onSave: (val) => {
      fields = parseNotation(val);
    }
  }}
  {bar}
>
  {#snippet menuOptions()}
    <NonStandardSettingsBanner
      count={nonStandardCount}
      onResetDefaults={() => {
        resetDisplayDefaults();
        toast.show('Výchozí nastavení obnoveno', { type: 'success' });
      }}
    />

    <MenuGroup title="Kreslení">
      <OptionRow
        label="Výchozí směr: Východ (90°)"
        hint="Želva startuje otočená doprava místo nahoru"
        checked={initialHeadingEast}
        isNonStandard={initialHeadingEast}
        onChange={(v) => (initialHeadingEast = v)}
      />
    </MenuGroup>

    <MenuGroup title="Zobrazení">
      <OptionRow
        label="Zobrazit přejezdy perem"
        hint="Čárkovaná stopa při zvednutém peru"
        checked={showDashes}
        isNonStandard={!showDashes}
        onChange={(v) => (showDashes = v)}
      />

      <OptionRow
        label="Zobrazit mřížku"
        hint="Bodová síť; krok pod úhlem jiným než 90° nekončí na tečce"
        checked={showGrid}
        isNonStandard={showGrid}
        onChange={(v) => (showGrid = v)}
      />

      <OptionRow
        label="Zobrazit dekorativní želvičku"
        hint="Oživí prázdné místo v klávesnici"
        checked={showTurtle}
        onChange={(v) => (showTurtle = v)}
      />
    </MenuGroup>
  {/snippet}

  {#snippet reference()}
    <TurtleReference />
  {/snippet}

  {#snippet output()}
    <TurtleCanvas state={drawing} {showDashes} {showGrid} />
  {/snippet}

  {#snippet variants()}
    <SegmentedControl
      options={granularityOptions}
      value={String(granularity)}
      size="sm"
      ariaLabel="Úhel otočky"
      onChange={(id) => (granularity = Number(id) as TurtleGranularity)}
    />
  {/snippet}

  {#snippet input()}
    <div class="turtle-keypad">
      <Chassis columns={3} keyHeight="52px">
        {#if showTurtle}
          <TurtleEasterEgg />
        {:else}
          <div class="grid-filler" aria-hidden="true"></div>
        {/if}

        <Keycap sublabel="Vpřed" ariaLabel="Krok vpřed" onPress={() => press(FORWARD)}>
          <ArrowUp size={22} weight="bold" />
        </Keycap>

        <Keycap
          sublabel="Značka {drawing.nextMarkerId}"
          ariaLabel="Položit značku {drawing.nextMarkerId}"
          haptic={25}
          onPress={() => press(MARKER)}
        >
          <MapPin size={22} weight="bold" />
        </Keycap>

        <Keycap
          sublabel="Vlevo {granularity}°"
          title="Otočit vlevo o {granularity}°"
          ariaLabel="Otočit vlevo o {granularity} stupňů"
          onPress={() => press({ kind: 'turn', code: 'L', angle: granularity })}
        >
          <ArrowCounterClockwise size={22} weight="bold" />
        </Keycap>

        <Keycap sublabel="Vzad" ariaLabel="Krok vzad" onPress={() => press(BACKWARD)}>
          <ArrowDown size={22} weight="bold" />
        </Keycap>

        <Keycap
          sublabel="Vpravo {granularity}°"
          title="Otočit vpravo o {granularity}°"
          ariaLabel="Otočit vpravo o {granularity} stupňů"
          onPress={() => press({ kind: 'turn', code: 'P', angle: granularity })}
        >
          <ArrowClockwise size={22} weight="bold" />
        </Keycap>
      </Chassis>

      <DrawingUtilityRow
        penDown={drawing.penDown}
        hasData={fields.length > 0}
        {canUndo}
        onClear={handleClearAll}
        onTogglePen={() => press(PEN)}
        onUndo={handleUndo}
      />
    </div>
  {/snippet}
</ModuleShell>

<style>
  .turtle-keypad {
    display: flex;
    flex-direction: column;
    gap: var(--zone-input-gap);
    width: 100%;
    user-select: none;
    -webkit-user-select: none;
  }

  .grid-filler {
    background-color: var(--color-surface-2);
    opacity: 0.35;
    pointer-events: none;
  }
</style>
