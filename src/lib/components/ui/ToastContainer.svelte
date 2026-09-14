<script lang="ts">
  import { toast } from '../../state/toast.svelte';
  import { settings } from '../../state/settings.svelte';
</script>

<div class="toast-container" aria-live="polite">
  {#each toast.toasts as t (t.id)}
    <div class="toast" class:success={t.type === 'success'} class:danger={t.type === 'danger'} class:warning={t.type === 'warning'} class:info={t.type === 'info'}>
      <span class="toast-text">{t.text}</span>
      {#if t.undoAction}
        <button
          class="undo-btn"
          onclick={() => {
            settings.vibrate(25);
            t.undoAction?.();
            toast.remove(t.id);
          }}
        >
          {t.undoLabel ?? 'Vrátit zpět'}
        </button>
      {/if}
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    bottom: max(16px, env(safe-area-inset-bottom));
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column-reverse;
    gap: 8px;
    z-index: 300;
    pointer-events: none;
    max-width: 90vw;
    width: max-content;
  }

  .toast {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    border-radius: var(--radius-md);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    color: var(--color-text-primary);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7);
    font-size: 14px;
    font-weight: 500;
    animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .toast.success {
    border-color: var(--color-accent-success);
    background-color: #0c281e;
  }

  .toast.danger {
    border-color: var(--color-accent-danger);
    background-color: #2b1114;
  }

  .toast.warning {
    border-color: var(--color-accent-warning);
    background-color: #2b220e;
  }

  .toast.info {
    border-color: var(--color-accent-primary);
    background-color: #0b222d;
  }

  .undo-btn {
    font-size: 13px;
    font-weight: 700;
    color: var(--color-accent-warning);
    text-decoration: underline;
    padding: 2px 4px;
  }
  .undo-btn:active {
    opacity: 0.8;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
