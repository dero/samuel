<script lang="ts">
  import HoldToAction from '../ui/HoldToAction.svelte';

  /** Content of the Menu tab: the module's options and its reset. */
  interface Props {
    onReset?: () => void;
    options?: import('svelte').Snippet;
  }

  let { onReset, options }: Props = $props();
</script>

<div class="module-menu">
  {#if options}
    <div class="menu-section">
      {@render options()}
    </div>
  {/if}

  {#if onReset}
    <HoldToAction
      onAction={onReset}
      showLabel={true}
      label="Reset nástroje"
      confirmedLabel="Resetováno"
      ariaLabel="Podržte pro resetování nástroje"
      tapWarning="Podržte pro reset nástroje"
      holdDuration={500}
      variant="menu"
    />
  {/if}
</div>

<style>
  .module-menu,
  .menu-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  /* Breathing room under the bar; the first group title must not sit on it */
  .module-menu {
    padding-top: var(--space-sm);
    padding-bottom: var(--space-sm);
  }
</style>
