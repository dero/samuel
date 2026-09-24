<script lang="ts">
  import Header from './lib/components/layout/Header.svelte';
  import LauncherOverlay from './lib/components/layout/LauncherOverlay.svelte';
  import LandscapeWarning from './lib/components/layout/LandscapeWarning.svelte';
  import ToastContainer from './lib/components/ui/ToastContainer.svelte';
  import SettingsModule from './lib/modules/settings/SettingsModule.svelte';
  import HelpModule from './lib/modules/help/HelpModule.svelte';
  import MorseModule from './lib/modules/morse/MorseModule.svelte';
  import BrailleModule from './lib/modules/braille/BrailleModule.svelte';
  import SemaphoreModule from './lib/modules/semaphore/SemaphoreModule.svelte';
  import FlagsModule from './lib/modules/flags/FlagsModule.svelte';
  import CrossModule from './lib/modules/cross/CrossModule.svelte';
  import PolybiusModule from './lib/modules/polybius/PolybiusModule.svelte';
  import MobileModule from './lib/modules/mobile/MobileModule.svelte';
  import NumbersModule from './lib/modules/numbers/NumbersModule.svelte';
  import ShiftsModule from './lib/modules/shifts/ShiftsModule.svelte';
  import SubstitutionModule from './lib/modules/substitution/SubstitutionModule.svelte';
  import GenericModulePlaceholder from './lib/modules/GenericModulePlaceholder.svelte';
  import { navigation } from './lib/state/navigation.svelte';
  import { onMount } from 'svelte';
  import { versionService } from './lib/services/versionService.svelte';

  onMount(() => {
    versionService.checkUpdates();
  });

  function handleGlobalContextMenu(e: MouseEvent) {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // 1. Text inputs, textareas, and editable areas must allow context menu
    if (target.closest('input, textarea, [contenteditable="true"]')) {
      return;
    }

    // 2. Translation card (output field) must allow context menu for text selection / copying
    if (
      target.closest(
        '.translation-card, .output-container, .result-card, .result-text, [data-allow-contextmenu]'
      )
    ) {
      return;
    }

    // 3. Reference screens and bottom sheets must allow context menu for copying text/tables
    // (except on interactive buttons inside them, e.g. close button)
    if (
      target.closest(
        '.bottom-sheet, .bottom-sheet-content, .sheet-body, .reference-content, .ref-wrapper, .modal-content, [data-allow-copy]'
      )
    ) {
      if (target.closest('button, [role="button"]')) {
        e.preventDefault();
        return;
      }
      return;
    }

    // 4. In all other places (buttons, keypads, interactive touch areas, dials, headers, etc.),
    // prevent right-click / context menu so long-press doesn't trigger native context menu
    e.preventDefault();
  }
</script>

<svelte:window oncontextmenu={handleGlobalContextMenu} />

<Header />

<main class="main-content">
  {#if navigation.activeModuleId === 'morse'}
    <MorseModule />
  {:else if navigation.activeModuleId === 'braille'}
    <BrailleModule />
  {:else if navigation.activeModuleId === 'semaphore'}
    <SemaphoreModule />
  {:else if navigation.activeModuleId === 'flags'}
    <FlagsModule />
  {:else if navigation.activeModuleId === 'cross'}
    <CrossModule />
  {:else if navigation.activeModuleId === 'polybius'}
    <PolybiusModule />
  {:else if navigation.activeModuleId === 'mobile'}
    <MobileModule />
  {:else if navigation.activeModuleId === 'numbers'}
    <NumbersModule />
  {:else if navigation.activeModuleId === 'shifts'}
    <ShiftsModule />
  {:else if navigation.activeModuleId === 'substitution'}
    <SubstitutionModule />
  {:else if navigation.activeModuleId === 'settings'}
    <SettingsModule />
  {:else if navigation.activeModuleId === 'help'}
    <HelpModule />
  {:else if navigation.activeModule}
    <GenericModulePlaceholder module={navigation.activeModule} />
  {/if}
</main>

<LauncherOverlay />
<ToastContainer />
<LandscapeWarning />

<style>
  .main-content {
    flex: 1;
    width: 100%;
    height: calc(100% - var(--header-height));
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }
</style>
