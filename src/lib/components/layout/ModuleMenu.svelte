<script lang="ts">
  import { navigation } from '../../state/navigation.svelte';
  import BottomSheet from '../ui/BottomSheet.svelte';
  import HoldToAction from '../ui/HoldToAction.svelte';
  import { List } from 'phosphor-svelte';

  interface Props {
    title?: string;
    hasAlphabet?: boolean;
    alphabetHint?: string;
    onReset?: () => void;
    children?: import('svelte').Snippet;
  }

  let { title, onReset, children }: Props = $props();

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
  {#if children}
    <div class="menu-section custom-options">
      {@render children()}
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
