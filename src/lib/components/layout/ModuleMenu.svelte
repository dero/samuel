<script lang="ts">
  import { navigation } from '../../state/navigation.svelte';
  import { settings } from '../../state/settings.svelte';
  import { pasteFromClipboard } from '../../utils/clipboard';
  import BottomSheet from '../ui/BottomSheet.svelte';
  import SlideToAction from '../ui/SlideToAction.svelte';
  import { ClipboardText, List } from 'phosphor-svelte';

  interface Props {
    hasAlphabet?: boolean;
    alphabetHint?: string;
    onReset?: () => void;
    onPaste?: (text: string) => void;
    children?: import('svelte').Snippet;
  }

  let { onReset, onPaste, children }: Props = $props();

  function handleResetAction() {
    if (onReset) onReset();
    setTimeout(() => {
      navigation.closeSubView();
    }, 280);
  }

  async function handlePasteClick() {
    settings.vibrate(25);
    const text = await pasteFromClipboard();
    if (text && onPaste) {
      onPaste(text);
      navigation.closeSubView();
    }
  }
</script>

<BottomSheet
  open={navigation.subView === 'menu' && !!navigation.activeModuleId}
  title="Menu modulu"
  icon={List}
  maxWidth="480px"
  onClose={() => navigation.closeSubView()}
>
  {#if children}
    <div class="menu-section custom-options">
      {@render children()}
    </div>
  {/if}

  <div class="menu-section actions">
    <div class="section-label">Rychlé akce</div>
    <button type="button" class="action-btn" onclick={handlePasteClick}>
      <span class="btn-icon"><ClipboardText size={20} weight="duotone" /></span>
      <span>Vložit ze schránky</span>
    </button>

    <SlideToAction
      onAction={handleResetAction}
      showLabel={true}
      label="Vyčistit modul"
      confirmedLabel="Vyčištěno"
      ariaLabel="Podržte pro vyčištění modulu"
      holdDuration={500}
      variant="menu"
    />
  </div>
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

  .action-btn {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    font-size: var(--text-base);
    font-weight: 600;
    min-height: var(--tap-min-size);
    color: var(--color-text-primary);
    transition: background-color 0.12s ease, border-color 0.12s ease;
    box-sizing: border-box;
    width: 100%;
  }
  .action-btn:active {
    background-color: var(--color-surface-active);
  }

  .btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
</style>
