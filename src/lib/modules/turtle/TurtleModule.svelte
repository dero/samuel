<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
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
  import {
    type TurtleGranularity,
    type TurtleState,
    GRANULARITY_PRESETS
  } from './turtleTypes';
  import {
    createInitialState,
    stepForward,
    stepBackward,
    turn,
    togglePen,
    addMarker,
    undo
  } from './turtleEngine';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import { localSettingsService } from '../../services/localSettingsService';

  const modSettings = localSettingsService.forModule('turtle');

  // Configuration & Persistent State
  let granularity = $state<TurtleGranularity>(
    (modSettings.getNumber('granularity', 90) as TurtleGranularity) || 90
  );
  let initialHeadingEast = $state<boolean>(
    modSettings.getBoolean('initial_heading_east', false)
  );
  let showDashes = $state<boolean>(
    modSettings.getBoolean('show_dashes', true)
  );
  // Off by default: unit steps at non-right angles land between grid dots.
  // New key, so the old always-persisted `show_grid: true` does not override the default.
  let showGrid = $state<boolean>(
    modSettings.getBoolean('grid_visible', false)
  );
  let showTurtle = $state<boolean>(
    modSettings.getBoolean('show_turtle', true)
  );

  // Persistence effect
  $effect(() => {
    modSettings.update({
      granularity,
      initial_heading_east: initialHeadingEast,
      show_dashes: showDashes,
      grid_visible: showGrid,
      show_turtle: showTurtle
    });
  });

  // Active turtle state
  let turtleState = $state<TurtleState>(
    createInitialState(modSettings.getBoolean('initial_heading_east', false) ? 90 : 0)
  );

  // Non-standard settings indicator
  const nonStandardCount = $derived(
    (initialHeadingEast ? 1 : 0) +
    (!showDashes ? 1 : 0) +
    (showGrid ? 1 : 0)
  );

  function resetToDefaults() {
    initialHeadingEast = false;
    showDashes = true;
    showGrid = false;
    showTurtle = true;
    toast.show('Výchozí nastavení obnoveno', { type: 'success' });
  }

  function handleGranularityChange(val: TurtleGranularity) {
    settings.vibrate(15);
    granularity = val;
  }

  // Movement & Keypad handlers
  function handleStepForward() {
    settings.vibrate(20);
    turtleState = stepForward(turtleState, 1);
  }

  function handleStepBackward() {
    settings.vibrate(20);
    turtleState = stepBackward(turtleState, 1);
  }

  function handleTurnLeft() {
    settings.vibrate(20);
    turtleState = turn(turtleState, -granularity);
  }

  function handleTurnRight() {
    settings.vibrate(20);
    turtleState = turn(turtleState, granularity);
  }

  function handleAddMarker() {
    settings.vibrate(25);
    turtleState = addMarker(turtleState);
  }

  function handleTogglePen() {
    settings.vibrate(20);
    turtleState = togglePen(turtleState);
  }

  function handleUndo() {
    turtleState = undo(turtleState);
  }

  function handleClearAll() {
    turtleState = createInitialState(initialHeadingEast ? 90 : 0);
    toast.show('Plátno vymazáno', { type: 'success' });
  }
</script>

<ModuleShell
  title="Želva"
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
      <div class="menu-group-title">Orientace & Zobrazení</div>

      <OptionRow
        label="Výchozí směr: Východ (90°)"
        hint="Želva startuje otočená doprava místo nahoru"
        checked={initialHeadingEast}
        isNonStandard={initialHeadingEast}
        onChange={(v) => {
          initialHeadingEast = v;
          if (turtleState.segments.length === 0 && turtleState.markers.length === 0) {
            turtleState = createInitialState(v ? 90 : 0);
          }
        }}
      />

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
    </div>
  {/snippet}

  {#snippet reference()}
    <TurtleReference />
  {/snippet}

  {#snippet output()}
    <TurtleCanvas state={turtleState} {showDashes} {showGrid} />
  {/snippet}

  {#snippet input()}
    <div class="zone-input-flow">
      <!-- 1. Keypad Stage -->
      <div class="turtle-chassis angles-stage">
        <!-- Row 1: Easter egg / Forward / Marker -->
        <div class="keypad-row-3col movement-row">
          {#if showTurtle}
            <TurtleEasterEgg />
          {:else}
            <div class="grid-filler" aria-hidden="true"></div>
          {/if}

          <button
            type="button"
            class="keycap"
            onpointerdown={(e) => {
              e.preventDefault();
              handleStepForward();
            }}
            title="Krok vpřed"
            aria-label="Krok vpřed"
          >
            <ArrowUp size={18} weight="bold" />
            <span class="key-label">Vpřed</span>
          </button>

          <button
            type="button"
            class="keycap marker-keycap"
            onpointerdown={(e) => {
              e.preventDefault();
              handleAddMarker();
            }}
            title="Položit značku {turtleState.nextMarkerId}"
            aria-label="Položit značku {turtleState.nextMarkerId}"
          >
            <MapPin size={18} weight="fill" class="marker-pin-icon" />
            <span class="key-label">Značka {turtleState.nextMarkerId}</span>
          </button>
        </div>

        <!-- Row 2: Turn Left / Backward / Turn Right -->
        <div class="keypad-row-3col movement-row">
          <button
            type="button"
            class="keycap"
            onpointerdown={(e) => {
              e.preventDefault();
              handleTurnLeft();
            }}
            title="Otočit vlevo o {granularity}°"
            aria-label="Otočit vlevo o {granularity} stupňů"
          >
            <ArrowCounterClockwise size={18} weight="bold" />
            <span class="key-label">Vlevo {granularity}°</span>
          </button>

          <button
            type="button"
            class="keycap"
            onpointerdown={(e) => {
              e.preventDefault();
              handleStepBackward();
            }}
            title="Krok vzad"
            aria-label="Krok vzad"
          >
            <ArrowDown size={18} weight="bold" />
            <span class="key-label">Vzad</span>
          </button>

          <button
            type="button"
            class="keycap"
            onpointerdown={(e) => {
              e.preventDefault();
              handleTurnRight();
            }}
            title="Otočit vpravo o {granularity}°"
            aria-label="Otočit vpravo o {granularity} stupňů"
          >
            <ArrowClockwise size={18} weight="bold" />
            <span class="key-label">Vpravo {granularity}°</span>
          </button>
        </div>

        <!-- Row 3: Granularity preset bar (1, 5, 15, 45, 90°) -->
        <div class="granularity-bar">
          {#each GRANULARITY_PRESETS as preset}
            <button
              type="button"
              class="keycap granularity-key"
              class:is-active={granularity === preset}
              onpointerdown={(e) => {
                e.preventDefault();
                handleGranularityChange(preset);
              }}
              title="Nastavit krok otočky na {preset}°"
              aria-label="Granularita {preset} stupňů"
            >
              {preset}°
            </button>
          {/each}
        </div>
      </div>

      <!-- 2. Bottom Utility Row (42px fixed, 3 columns) -->
      <DrawingUtilityRow
        state={turtleState}
        onClear={handleClearAll}
        onTogglePen={handleTogglePen}
        onUndo={handleUndo}
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

  .turtle-chassis {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 2px;
    background-color: #000000;
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    box-sizing: border-box;
    width: 100%;
    user-select: none;
    touch-action: none;
  }

  .keypad-row-3col {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
    width: 100%;
  }

  .movement-row {
    height: 44px;
  }

  .granularity-bar {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 2px;
    height: 32px;
  }


  /* Keycap Design System Styles */
  .keycap {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    background-color: var(--color-surface-2);
    color: var(--color-text-primary);
    border: none;
    border-radius: 2px;
    padding: 2px 4px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.10), inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    cursor: pointer;
    touch-action: manipulation;
    transition: background-color 70ms ease, box-shadow 70ms ease;
  }

  .keycap:active {
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
  }

  .key-label {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-secondary);
    line-height: 1;
    white-space: nowrap;
  }

  :global(.marker-pin-icon) {
    color: var(--color-accent-warning);
  }

  .grid-filler {
    background-color: var(--color-surface-2);
    opacity: 0.25;
    border-radius: 2px;
  }

  /* Granularity Keys */
  .granularity-key {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-secondary);
    background-color: var(--color-surface-1);
  }

  .granularity-key.is-active {
    background-color: var(--color-surface-active);
    color: var(--color-accent-primary);
    border: 1px solid var(--color-accent-primary);
    box-shadow: inset 0 0 8px rgba(0, 210, 255, 0.2);
    font-weight: 800;
  }






  .menu-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .menu-group-title {
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    padding: var(--space-xs) 0;
  }
</style>
