<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
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
  import type { TurtleState } from '../turtle/turtleTypes';
  import { createInitialState, stepDirection, togglePen, addMarker, undo } from '../turtle/turtleEngine';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import { localSettingsService } from '../../services/localSettingsService';

  const modSettings = localSettingsService.forModule('plotter');

  // Configuration & Persistent State
  let showDashes = $state<boolean>(modSettings.getBoolean('show_dashes', true));
  let showGrid = $state<boolean>(modSettings.getBoolean('show_grid', true));

  // Persistence effect
  $effect(() => {
    modSettings.update({
      show_dashes: showDashes,
      show_grid: showGrid
    });
  });

  // Active plotter state (shares the turtle engine; heading = last step direction)
  let plotterState = $state<TurtleState>(createInitialState(0));

  // Non-standard settings indicator
  const nonStandardCount = $derived((!showDashes ? 1 : 0) + (!showGrid ? 1 : 0));

  function resetToDefaults() {
    showDashes = true;
    showGrid = true;
    toast.show('Výchozí nastavení obnoveno', { type: 'success' });
  }

  function handleDirection(dx: number, dy: number, heading: number) {
    settings.vibrate(20);
    plotterState = stepDirection(plotterState, dx, dy, heading);
  }

  function handleAddMarker() {
    settings.vibrate(25);
    plotterState = addMarker(plotterState);
  }

  function handleTogglePen() {
    settings.vibrate(20);
    plotterState = togglePen(plotterState);
  }

  function handleUndo() {
    plotterState = undo(plotterState);
  }

  function handleClearAll() {
    plotterState = createInitialState(0);
    toast.show('Plátno vymazáno', { type: 'success' });
  }
</script>

<ModuleShell
  title="Plotr"
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
      <div class="menu-group-title">Zobrazení</div>

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
    </div>
  {/snippet}

  {#snippet reference()}
    <PlotterReference />
  {/snippet}

  {#snippet output()}
    <TurtleCanvas state={plotterState} {showDashes} {showGrid} />
  {/snippet}

  {#snippet input()}
    <div class="zone-input-flow">
      <!-- 1. Keypad Stage: 3×3 D-pad -->
      <div class="plotter-chassis">
        <div class="dpad-grid">
          <!-- Row 1 -->
          <button
            type="button"
            class="keycap dpad-key"
            onpointerdown={(e) => {
              e.preventDefault();
              handleDirection(-1, 1, 315);
            }}
            title="Severozápad (SZ)"
            aria-label="Severozápad"
          >
            <ArrowUpLeft size={18} weight="bold" />
            <span class="key-label">SZ</span>
          </button>

          <button
            type="button"
            class="keycap dpad-key"
            onpointerdown={(e) => {
              e.preventDefault();
              handleDirection(0, 1, 0);
            }}
            title="Sever (S)"
            aria-label="Sever"
          >
            <ArrowUp size={18} weight="bold" />
            <span class="key-label">S</span>
          </button>

          <button
            type="button"
            class="keycap dpad-key"
            onpointerdown={(e) => {
              e.preventDefault();
              handleDirection(1, 1, 45);
            }}
            title="Severovýchod (SV)"
            aria-label="Severovýchod"
          >
            <ArrowUpRight size={18} weight="bold" />
            <span class="key-label">SV</span>
          </button>

          <!-- Row 2 -->
          <button
            type="button"
            class="keycap dpad-key"
            onpointerdown={(e) => {
              e.preventDefault();
              handleDirection(-1, 0, 270);
            }}
            title="Západ (Z)"
            aria-label="Západ"
          >
            <ArrowLeft size={18} weight="bold" />
            <span class="key-label">Z</span>
          </button>

          <!-- Center: Waypoint Marker -->
          <button
            type="button"
            class="keycap dpad-key marker-keycap"
            onpointerdown={(e) => {
              e.preventDefault();
              handleAddMarker();
            }}
            title="Položit značku {plotterState.nextMarkerId}"
            aria-label="Položit značku {plotterState.nextMarkerId}"
          >
            <MapPin size={18} weight="fill" class="marker-pin-icon" />
            <span class="key-label">Značka {plotterState.nextMarkerId}</span>
          </button>

          <button
            type="button"
            class="keycap dpad-key"
            onpointerdown={(e) => {
              e.preventDefault();
              handleDirection(1, 0, 90);
            }}
            title="Východ (V)"
            aria-label="Východ"
          >
            <ArrowRight size={18} weight="bold" />
            <span class="key-label">V</span>
          </button>

          <!-- Row 3 -->
          <button
            type="button"
            class="keycap dpad-key"
            onpointerdown={(e) => {
              e.preventDefault();
              handleDirection(-1, -1, 225);
            }}
            title="Jihozápad (JZ)"
            aria-label="Jihozápad"
          >
            <ArrowDownLeft size={18} weight="bold" />
            <span class="key-label">JZ</span>
          </button>

          <button
            type="button"
            class="keycap dpad-key"
            onpointerdown={(e) => {
              e.preventDefault();
              handleDirection(0, -1, 180);
            }}
            title="Jih (J)"
            aria-label="Jih"
          >
            <ArrowDown size={18} weight="bold" />
            <span class="key-label">J</span>
          </button>

          <button
            type="button"
            class="keycap dpad-key"
            onpointerdown={(e) => {
              e.preventDefault();
              handleDirection(1, -1, 135);
            }}
            title="Jihovýchod (JV)"
            aria-label="Jihovýchod"
          >
            <ArrowDownRight size={18} weight="bold" />
            <span class="key-label">JV</span>
          </button>
        </div>
      </div>

      <!-- 2. Bottom Utility Row (42px fixed, 3 columns) -->
      <DrawingUtilityRow
        state={plotterState}
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

  .plotter-chassis {
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

  .dpad-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 38px);
    gap: 2px;
    width: 100%;
  }

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

  :global(.marker-pin-icon) {
    color: var(--color-accent-warning);
  }
</style>
