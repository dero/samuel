<script lang="ts">
  import { navigation } from '../../state/navigation.svelte';
  import BottomSheet from '../ui/BottomSheet.svelte';
  import HoldToAction from '../ui/HoldToAction.svelte';
  import { settings } from '../../state/settings.svelte';
  import { List, BookOpen, CaretRight } from 'phosphor-svelte';

  interface Props {
    title?: string;
    hasAlphabet?: boolean;
    alphabetHint?: string;
    onReset?: () => void;
    options?: import('svelte').Snippet;
  }

  let { title, onReset, options }: Props = $props();

  const menuTitle = $derived(
    title ? `${title}: nastavení` : `${navigation.activeModule.name}: nastavení`
  );

  function handleResetAction() {
    if (onReset) onReset();
    setTimeout(() => {
      navigation.closeSubView();
    }, 280);
  }
</script>

<BottomSheet
  open={navigation.subView === 'menu' && !!navigation.activeModuleId}
  title={menuTitle}
  icon={List}
  maxWidth="480px"
  onClose={() => navigation.closeSubView()}
>
  {#if navigation.activeModule.hasReference !== false}
    <button
      type="button"
      class="reference-link"
      onclick={() => {
        settings.vibrate(20);
        navigation.openRef();
      }}
    >
      <BookOpen size={20} weight="duotone" />
      <span class="reference-link-label">Tahák a návod</span>
      <CaretRight size={16} weight="bold" />
    </button>
  {/if}

  {#if options}
    <div class="menu-section custom-options">
      {@render options()}
    </div>
  {/if}

  {#if onReset}
    <div class="menu-section actions">
      <div class="section-label">Akce</div>
      <HoldToAction
        onAction={handleResetAction}
        showLabel={true}
        label="Reset modulu"
        confirmedLabel="Resetováno"
        ariaLabel="Podržte pro resetování modulu"
        tapWarning="Podržte pro reset modulu"
        holdDuration={500}
        variant="menu"
      />
    </div>
  {/if}
</BottomSheet>

<style>
  .reference-link {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    width: 100%;
    min-height: var(--tap-min-size);
    padding: 0 var(--space-md);
    margin-bottom: var(--space-md);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: var(--text-sm);
    font-weight: 700;
    text-align: left;
    box-sizing: border-box;
    transition: background-color 0.12s ease;
  }

  .reference-link:active {
    background-color: var(--color-surface-active);
  }

  .reference-link :global(svg) {
    flex-shrink: 0;
    color: var(--color-text-secondary);
  }

  .reference-link-label {
    flex: 1;
  }

  .menu-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .section-label {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--color-text-secondary);
  }
</style>
