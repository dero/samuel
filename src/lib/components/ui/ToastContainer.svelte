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
    top: calc(var(--header-height) + var(--space-xs));
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    z-index: 300;
    pointer-events: none;
    max-width: 90vw;
    width: max-content;
  }

  .toast {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: 8px var(--space-md);
    border-radius: var(--radius-md);
    background-color: var(--color-surface-elevated);
    border: 1px solid var(--color-border-subtle);
    color: var(--color-text-primary);
    box-shadow: var(--shadow-lg);
    font-size: var(--text-sm);
    font-weight: 600;
    animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .toast.success {
    border-color: var(--color-accent-success);
    color: var(--color-accent-success);
  }

  .toast.danger {
    border-color: var(--color-accent-danger);
    color: var(--color-accent-danger);
  }

  .toast.warning {
    border-color: var(--color-accent-warning);
    color: var(--color-accent-warning);
  }

  .toast.info {
    border-color: var(--color-accent-primary);
    color: var(--color-accent-primary);
  }

  .undo-btn {
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-accent-warning);
    text-decoration: underline;
    padding: 2px 4px;
  }
  .undo-btn:active {
    opacity: 0.8;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
