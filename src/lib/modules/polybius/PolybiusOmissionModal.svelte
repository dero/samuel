<script lang="ts">
  import { Check, TextAa, WarningCircle, X } from 'phosphor-svelte';
  import BottomSheet from '../../components/ui/BottomSheet.svelte';
  import { settings } from '../../state/settings.svelte';

  interface Props {
    open: boolean;
    alphabetName: string;
    allLetters: string[];
    initialOmitted: string[];
    targetCapacity: number;
    canDismiss?: boolean;
    onConfirm: (omitted: string[]) => void;
    onClose: () => void;
  }

  let {
    open,
    alphabetName,
    allLetters,
    initialOmitted,
    targetCapacity,
    canDismiss = true,
    onConfirm,
    onClose
  }: Props = $props();

  let draftOmitted = $state<Set<string>>(new Set());

  // Sync draft with initial when opened
  $effect(() => {
    if (open) {
      draftOmitted = new Set(initialOmitted);
    }
  });

  const enabledLetters = $derived(allLetters.filter((l) => !draftOmitted.has(l)));
  const enabledCount = $derived(enabledLetters.length);
  const excessCount = $derived(enabledCount - targetCapacity);
  const canConfirm = $derived(enabledCount <= targetCapacity);

  function handleToggleLetter(e: PointerEvent, char: string) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    settings.vibrate(18);

    const next = new Set(draftOmitted);
    if (next.has(char)) {
      next.delete(char);
    } else {
      next.add(char);
    }
    draftOmitted = next;
  }

  function handleConfirm() {
    if (!canConfirm) return;
    settings.vibrate(28);
    // Keep omitted letters in the order they appear in allLetters
    const sortedOmitted = allLetters.filter((l) => draftOmitted.has(l));
    onConfirm(sortedOmitted);
  }
</script>

<BottomSheet
  {open}
  title="Vynechaná písmena"
  icon={TextAa}
  zIndex={240}
  maxWidth="520px"
  onClose={() => {
    if (canDismiss || canConfirm) {
      onClose();
    }
  }}
>
  <div class="omission-modal-body">
    <div class="info-banner">
      <div class="info-text">
        Abeceda <strong>{alphabetName}</strong> má víc znaků než mřížka {targetCapacity === 25 ? '5×5' : '6×6'}. Klepnutím vyškrtněte nepoužitá písmena.
      </div>
    </div>

    <!-- Status counter badge -->
    <div class="status-counter-row" class:is-warning={excessCount > 0} class:is-valid={canConfirm}>
      <span class="status-icon">
        {#if excessCount > 0}
          <WarningCircle size={18} weight="fill" />
        {:else}
          <Check size={18} weight="bold" />
        {/if}
      </span>
      <div class="status-label">
        {#if excessCount > 0}
          <span><strong>{enabledCount} / {targetCapacity}</strong> · vyřaďte ještě <strong>{excessCount} {excessCount === 1 ? 'znak' : excessCount < 5 ? 'znaky' : 'znaků'}</strong></span>
        {:else if excessCount === 0}
          <span><strong>{enabledCount} / {targetCapacity}</strong></span>
        {:else}
          <span><strong>{enabledCount} / {targetCapacity}</strong> · zbylá pole zůstanou prázdná</span>
        {/if}
      </div>
    </div>

    <!-- Letter grid -->
    <div class="letter-toggle-grid">
      {#each allLetters as char (char)}
        {@const isOmitted = draftOmitted.has(char)}
        <button
          type="button"
          class="letter-toggle-btn"
          class:is-omitted={isOmitted}
          aria-pressed={!isOmitted}
          aria-label={`Písmeno ${char}, ${isOmitted ? 'vynecháno' : 'povoleno'}`}
          onpointerdown={(e) => handleToggleLetter(e, char)}
        >
          <span class="letter-char">{char}</span>
          {#if isOmitted}
            <span class="omitted-badge" aria-hidden="true">
              <X size={12} weight="bold" />
            </span>
          {/if}
        </button>
      {/each}
    </div>

    <!-- Action footer -->
    <div class="modal-action-footer">
      <button
        type="button"
        class="confirm-btn"
        disabled={!canConfirm}
        onclick={handleConfirm}
      >
        <Check size={18} weight="bold" />
        <span>Potvrdit</span>
      </button>
    </div>
  </div>
</BottomSheet>

<style>
  .omission-modal-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    color: var(--color-text-primary);
    padding-bottom: var(--space-sm);
  }

  .info-banner {
    background: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: var(--space-sm) var(--space-md);
    font-size: var(--text-xs);
    line-height: 1.45;
    color: var(--color-text-secondary);
  }

  .info-banner strong {
    color: var(--color-text-primary);
  }

  .status-counter-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: 8px var(--space-md);
    border-radius: var(--radius-sm);
    font-size: var(--text-xs);
    font-weight: 500;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    transition: all 0.2s ease;
  }

  .status-counter-row.is-warning {
    background: rgba(245, 158, 11, 0.12);
    border-color: rgba(245, 158, 11, 0.35);
    color: var(--color-accent-warning);
  }

  .status-counter-row.is-valid {
    background: rgba(16, 185, 129, 0.12);
    border-color: rgba(16, 185, 129, 0.35);
    color: var(--color-accent-success);
  }

  .status-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .status-label strong {
    font-weight: 700;
  }

  .letter-toggle-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
  }

  .letter-toggle-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    height: 48px;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: var(--text-base);
    font-weight: 700;
    cursor: pointer;
    touch-action: none;
    transition: all 0.15s ease;
  }

  .letter-toggle-btn:active {
    transform: scale(0.94);
  }

  .letter-toggle-btn.is-omitted {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.35);
    color: var(--color-text-muted);
  }

  .letter-toggle-btn.is-omitted .letter-char {
    text-decoration: line-through;
    opacity: 0.55;
  }

  .omitted-badge {
    position: absolute;
    top: 2px;
    right: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-accent-danger);
  }

  .modal-action-footer {
    margin-top: var(--space-xs);
    display: flex;
    flex-direction: column;
  }

  .confirm-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    width: 100%;
    min-height: 48px;
    height: 48px;
    background: var(--color-accent-primary);
    color: #000000;
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .confirm-btn:active:not(:disabled) {
    transform: scale(0.98);
    filter: brightness(0.9);
  }

  .confirm-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    background: var(--color-surface-3);
    color: var(--color-text-muted);
  }
</style>
