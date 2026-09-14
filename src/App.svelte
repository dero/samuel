<script lang="ts">
  import Header from './lib/components/layout/Header.svelte';
  import Dashboard from './lib/components/layout/Dashboard.svelte';
  import DashboardMenu from './lib/components/layout/DashboardMenu.svelte';
  import LauncherOverlay from './lib/components/layout/LauncherOverlay.svelte';
  import ToastContainer from './lib/components/ui/ToastContainer.svelte';
  import SettingsModule from './lib/modules/settings/SettingsModule.svelte';
  import HelpModule from './lib/modules/help/HelpModule.svelte';
  import MorseModule from './lib/modules/01-morse/MorseModule.svelte';
  import BrailleModule from './lib/modules/02-braille/BrailleModule.svelte';
  import SemaphoreModule from './lib/modules/03-semaphore/SemaphoreModule.svelte';
  import GenericModulePlaceholder from './lib/modules/GenericModulePlaceholder.svelte';
  import { navigation } from './lib/state/navigation.svelte';
  import { onMount } from 'svelte';
  import { checkUpdatesOnInit } from './lib/db/database.svelte';

  onMount(() => {
    checkUpdatesOnInit();
  });
</script>

<Header />

<main class="main-content">
  {#if !navigation.activeModuleId}
    <Dashboard />
  {:else if navigation.activeModuleId === 'morse'}
    <MorseModule />
  {:else if navigation.activeModuleId === 'braille'}
    <BrailleModule />
  {:else if navigation.activeModuleId === 'semaphore'}
    <SemaphoreModule />
  {:else if navigation.activeModuleId === 'settings'}
    <SettingsModule />
  {:else if navigation.activeModuleId === 'help'}
    <HelpModule />
  {:else if navigation.activeModule}
    <GenericModulePlaceholder module={navigation.activeModule} />
  {/if}
</main>

<DashboardMenu />
<LauncherOverlay />
<ToastContainer />

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
