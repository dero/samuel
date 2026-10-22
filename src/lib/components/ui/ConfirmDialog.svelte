<script lang="ts">
  import { settings } from '../../state/settings.svelte';

  interface Props {
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'primary' | 'success' | 'danger';
    onConfirm: () => void;
    onCancel: () => void;
  }

  let {
    open,
    title,
    message,
    confirmText = 'Přijmout',
    cancelText = 'Zrušit',
    confirmVariant = 'primary',
    onConfirm,
    onCancel
  }: Props = $props();

  function handleConfirm() {
    settings.vibrate(30);
    onConfirm();
  }

  function handleCancel() {
    settings.vibrate(20);
    onCancel();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!open) return;
    if (e.key === 'Escape') {
      handleCancel();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div
    class="dialog-backdrop"
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-label={title}
    onclick={(e) => {
      if (e.target === e.currentTarget) handleCancel();
    }}
  >
    <div class="dialog-card">
      <div class="dialog-header">
        <h3 class="dialog-title">{title}</h3>
      </div>

      <div class="dialog-body">
        <p class="dialog-message">{message}</p>
      </div>

      <div class="dialog-actions">
        <button
          type="button"
          class="dialog-btn btn-cancel"
          onclick={handleCancel}
        >
          {cancelText}
        </button>

        <button
          type="button"
          class="dialog-btn btn-confirm"
          class:is-success={confirmVariant === 'success'}
          class:is-danger={confirmVariant === 'danger'}
          onclick={handleConfirm}
        >
          {confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .dialog-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.78);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    padding: 16px;
    animation: fadeIn 0.15s ease-out;
  }

  .dialog-card {
    width: 100%;
    max-width: 320px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-medium);
    border-radius: var(--radius-sm);
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.9);
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    animation: popIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .dialog-title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .dialog-message {
    margin: 0;
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  .dialog-actions {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 8px;
    margin-top: 6px;
  }

  .dialog-btn {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-xs);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    border: none;
    touch-action: manipulation;
    transition: all 0.12s ease;
  }

  .btn-cancel {
    background-color: var(--color-surface-2);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border-subtle);
  }

  .btn-cancel:hover {
    background-color: var(--color-surface-3);
    color: var(--color-text-primary);
  }

  .btn-cancel:active {
    background-color: var(--color-surface-active);
  }

  .btn-confirm {
    background-color: var(--color-accent-primary);
    color: #000000;
  }

  .btn-confirm.is-success {
    background-color: var(--color-accent-success);
    color: #ffffff;
  }

  .btn-confirm.is-danger {
    background-color: var(--color-accent-danger);
    color: #ffffff;
  }

  .btn-confirm:hover {
    filter: brightness(1.1);
  }

  .btn-confirm:active {
    filter: brightness(0.9);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes popIn {
    from {
      transform: scale(0.95);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
