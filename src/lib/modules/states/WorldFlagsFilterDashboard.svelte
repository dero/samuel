<script lang="ts">
  import Chassis from '../../components/ui/Chassis.svelte';
  import Keycap from '../../components/ui/Keycap.svelte';
  import {
    WORLD_CONTINENTS,
    WORLD_FLAG_COLORS,
    WORLD_FLAG_FEATURES,
    type WorldContinent,
    type WorldFlagColorId,
    type WorldFlagFeatureId
  } from './worldFlagsData';

  interface Props {
    selectedContinents: WorldContinent[];
    selectedFeatures: WorldFlagFeatureId[];
    selectedColors: WorldFlagColorId[];
    onToggleContinent: (continent: WorldContinent) => void;
    onToggleFeature: (feature: WorldFlagFeatureId) => void;
    onToggleColor: (color: WorldFlagColorId) => void;
  }

  let {
    selectedContinents,
    selectedFeatures,
    selectedColors,
    onToggleContinent,
    onToggleFeature,
    onToggleColor
  }: Props = $props();

  // Six rows of 36 px keep the flag grid at 180 px on a 320 × 540 screen
  const KEY_HEIGHT = '36px';
</script>

<Chassis columns={WORLD_CONTINENTS.length} keyHeight={KEY_HEIGHT}>
  {#each WORLD_CONTINENTS as cont (cont.id)}
    {@const isActive = selectedContinents.includes(cont.id)}
    <Keycap
      selected={isActive}
      title={cont.name}
      ariaLabel="{cont.name}: {isActive ? 'vybráno' : 'nevybráno'}"
      onPress={() => onToggleContinent(cont.id)}
    >
      <span class="filter-label">{cont.name}</span>
    </Keycap>
  {/each}
</Chassis>

<Chassis columns={3} keyHeight={KEY_HEIGHT}>
  {#each WORLD_FLAG_COLORS as col (col.id)}
    {@const isActive = selectedColors.includes(col.id)}
    <Keycap
      selected={isActive}
      title={col.name}
      ariaLabel="{col.name}: {isActive ? 'vybráno' : 'nevybráno'}"
      onPress={() => onToggleColor(col.id)}
    >
      <!-- The swatch is content; on/off is the Keycap's own fill and ring -->
      <span class="filter-label color-label">
        <span class="color-swatch" style:background-color={col.hex} style:border-color={col.borderHex}></span>
        {col.name}
      </span>
    </Keycap>
  {/each}
</Chassis>

<Chassis columns={4} keyHeight={KEY_HEIGHT}>
  {#each WORLD_FLAG_FEATURES as feat (feat.id)}
    {@const isActive = selectedFeatures.includes(feat.id)}
    <Keycap
      selected={isActive}
      title={feat.name}
      ariaLabel="{feat.name}: {isActive ? 'vybráno' : 'nevybráno'}"
      onPress={() => onToggleFeature(feat.id)}
    >
      <span class="filter-label">{feat.name}</span>
    </Keycap>
  {/each}
</Chassis>

<style>
  /* Dense rows on 320 px (five continents, four features): capped by width, DESIGN_SYSTEM §9 */
  .filter-label {
    max-width: 100%;
    padding: 0 var(--space-2xs);
    overflow: hidden;
    font-family: var(--font-sans);
    font-size: min(var(--text-xs), 3.6vw, 60cqh);
    font-weight: 700;
    line-height: 1.15;
    text-align: center;
    box-sizing: border-box;
  }

  .color-label {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    white-space: nowrap;
  }

  .color-swatch {
    width: 0.9em;
    height: 0.9em;
    flex-shrink: 0;
    border: 2px solid;
    border-radius: 50%;
    box-sizing: border-box;
  }
</style>
