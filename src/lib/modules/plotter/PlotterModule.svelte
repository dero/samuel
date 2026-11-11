<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import type { ModuleBarConfig } from '../../components/layout/ModuleBar.svelte';
  import Chassis from '../../components/ui/Chassis.svelte';
  import Keycap from '../../components/ui/Keycap.svelte';
  import MenuGroup from '../../components/ui/MenuGroup.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import NonStandardSettingsBanner from '../../components/ui/NonStandardSettingsBanner.svelte';
  import TurtleCanvas from '../turtle/TurtleCanvas.svelte';
  import DrawingUtilityRow from '../turtle/DrawingUtilityRow.svelte';
  import PlotterReference from './PlotterReference.svelte';
  import {
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUpLeft,
    ArrowUpRight,
    ArrowDownLeft,
    ArrowDownRight,
    MapPin
  } from 'phosphor-svelte';
  import {
    PLOTTER_DIRECTIONS,
    parsePlotterField,
    replayPlotter,
    type CompassDirection
  } from './plotterEngine';
  import {
    appendPress,
    removeLastPress,
    countSteps,
    describeDrawing,
    invalidAttention,
    type DrawingCommand
  } from '../turtle/drawingNotation';
  import { parseNotation, serializeNotation } from '../../utils/notation';
  import { toast } from '../../state/toast.svelte';
  import { localSettingsService } from '../../services/localSettingsService';

  const modSettings = localSettingsService.forModule('plotter');

  const NOTATION_EXAMPLE = 'S3,V,JV,T,Z,M';

  const DIRECTION_ICONS: Record<string, typeof ArrowUp> = {
    SZ: ArrowUpLeft,
    S: ArrowUp,
    SV: ArrowUpRight,
    Z: ArrowLeft,
    V: ArrowRight,
    JZ: ArrowDownLeft,
    J: ArrowDown,
    JV: ArrowDownRight
  };

  // The 3 × 3 pad: four directions, the marker in the centre, four directions
  const TOP_DIRECTIONS = PLOTTER_DIRECTIONS.slice(0, 4);
  const BOTTOM_DIRECTIONS = PLOTTER_DIRECTIONS.slice(4);

  // The notation is the data: the drawing is replayed from it
  let fields = $state.raw<string[]>(modSettings.getJSON<string[]>('fields', []));
  let showDashes = $state<boolean>(modSettings.getBoolean('show_dashes', true));
  let showGrid = $state<boolean>(modSettings.getBoolean('show_grid', true));

  $effect(() => {
    modSettings.setJSON('fields', fields);
    modSettings.update({
      show_dashes: showDashes,
      show_grid: showGrid
    });
  });

  const commands = $derived(fields.map(parsePlotterField));
  const invalidPieces = $derived(fields.filter((_, i) => commands[i] === null));
  const drawing = $derived(replayPlotter(commands));
  const canUndo = $derived(commands.some((cmd) => cmd !== null));

  const bar = $derived<ModuleBarConfig>({
    empty: fields.length === 0,
    hint: 'Kreslete klepnutím na světovou stranu.',
    status: describeDrawing(countSteps(commands), drawing.markers.length),
    warning: invalidPieces.length > 0 ? `Neplatné části zápisu: ${invalidPieces.length}` : null
  });

  const nonStandardCount = $derived((!showDashes ? 1 : 0) + (!showGrid ? 1 : 0));

  function press(cmd: DrawingCommand) {
    fields = appendPress(fields, cmd, parsePlotterField);
  }

  function handleUndo() {
    fields = removeLastPress(fields, parsePlotterField);
  }

  function handleClearAll() {
    fields = [];
  }

  function resetDisplayDefaults() {
    showDashes = true;
    showGrid = true;
  }

  function handleReset() {
    handleClearAll();
    resetDisplayDefaults();
  }
</script>

{#snippet directionKey(dir: CompassDirection)}
  {@const Icon = DIRECTION_ICONS[dir.code]}
  <Keycap
    sublabel={dir.code}
    title="{dir.name} ({dir.code})"
    ariaLabel={dir.name}
    onPress={() => press({ kind: 'move', code: dir.code, count: 1 })}
  >
    <Icon size={22} weight="bold" />
  </Keycap>
{/snippet}

<ModuleShell
  hasWarning={nonStandardCount > 0}
  onReset={handleReset}
  podklad={{
    kind: 'text',
    required: false,
    empty: fields.length === 0,
    title: 'Zápis',
    description:
      'Světové strany S, SV, V, JV, J, JZ, Z, SZ, T pero, M značka; číslo za směrem je počet kroků.',
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
        hint="Decentní bodová síť souřadnic na pozadí"
        checked={showGrid}
        isNonStandard={!showGrid}
        onChange={(v) => (showGrid = v)}
      />
    </MenuGroup>
  {/snippet}

  {#snippet reference()}
    <PlotterReference />
  {/snippet}

  {#snippet output()}
    <TurtleCanvas state={drawing} {showDashes} {showGrid} />
  {/snippet}

  {#snippet input()}
    <div class="plotter-keypad">
      <Chassis columns={3} keyHeight="52px">
        {#each TOP_DIRECTIONS as dir (dir.code)}
          {@render directionKey(dir)}
        {/each}

        <Keycap
          sublabel="Značka {drawing.nextMarkerId}"
          ariaLabel="Položit značku {drawing.nextMarkerId}"
          haptic={25}
          onPress={() => press({ kind: 'marker' })}
        >
          <MapPin size={22} weight="bold" />
        </Keycap>

        {#each BOTTOM_DIRECTIONS as dir (dir.code)}
          {@render directionKey(dir)}
        {/each}
      </Chassis>

      <DrawingUtilityRow
        penDown={drawing.penDown}
        hasData={fields.length > 0}
        {canUndo}
        onClear={handleClearAll}
        onTogglePen={() => press({ kind: 'pen' })}
        onUndo={handleUndo}
      />
    </div>
  {/snippet}
</ModuleShell>

<style>
  .plotter-keypad {
    display: flex;
    flex-direction: column;
    gap: var(--zone-input-gap);
    width: 100%;
    user-select: none;
    -webkit-user-select: none;
  }
</style>
