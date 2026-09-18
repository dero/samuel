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
    top: calc(env(safe-area-inset-top, 0px) + 8px);
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 1000;
    pointer-events: none;
    max-width: calc(100vw - 24px);
    width: max-content;
  }

  .toast {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: 7px 18px;
    border-radius: var(--radius-full);
    background: rgba(18, 18, 22, 0.94);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.14);
    color: var(--color-text-primary);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.8), 0 0 1px rgba(255, 255, 255, 0.2);
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.2px;
    animation: islandDrop 0.28s cubic-bezier(0.16, 1.2, 0.3, 1);
  }

  .toast.success {
    border-color: rgba(16, 185, 129, 0.5);
    color: var(--color-accent-success);
  }

  .toast.danger {
    border-color: rgba(239, 68, 68, 0.5);
    color: var(--color-accent-danger);
  }

  .toast.warning {
    border-color: rgba(245, 158, 11, 0.5);
    color: var(--color-accent-warning);
  }

  .toast.info {
    border-color: rgba(0, 210, 255, 0.5);
    color: var(--color-accent-primary);
  }

  .toast-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 80vw;
  }

  .undo-btn {
    font-size: var(--text-2xs);
    font-weight: 700;
    color: var(--color-accent-warning);
    text-decoration: underline;
    padding: 2px 4px;
    background: none;
    border: none;
    cursor: pointer;
  }
  .undo-btn:active {
    opacity: 0.8;
  }

  @keyframes islandDrop {
    0% {
      opacity: 0;
      transform: translateY(-24px) scale(0.85);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
</style>
