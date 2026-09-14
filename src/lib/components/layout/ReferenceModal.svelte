<script lang="ts">
  import { navigation } from '../../state/navigation.svelte';

  interface Props {
    title?: string;
    children?: import('svelte').Snippet;
  }

  let { title, children }: Props = $props();
</script>

{#if navigation.subView === 'ref'}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="ref-backdrop" onclick={() => navigation.closeSubView()}>
    <div class="ref-panel" onclick={(e) => e.stopPropagation()}>
      <div class="ref-header">
        <span class="ref-title">{title ?? (navigation.activeModule?.name ? `Reference: ${navigation.activeModule.name}` : 'Reference')}</span>
        <button class="close-btn" onclick={() => navigation.closeSubView()} aria-label="Zavřít">✕</button>
      </div>

      <div class="ref-content">
        {#if children}
          {@render children()}
        {:else}
          <div class="empty-ref">
            <p>Zde bude referenční přehled a tahák pro tento modul.</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .ref-backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: 210;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  @media (min-width: 600px) {
    .ref-backdrop {
      align-items: center;
      padding: 20px;
    }
  }

  .ref-panel {
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    width: 100%;
    max-width: 680px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: sheetSlideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.6);
  }

  @media (min-width: 600px) {
    .ref-panel {
      border-radius: var(--radius-lg);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8);
    }
  }

  @keyframes sheetSlideUp {
    from {
      transform: translateY(100%);
      opacity: 0.8;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .ref-header {
    height: 52px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--color-border-subtle);
    flex-shrink: 0;
  }

  .ref-title {
    font-size: 17px;
    font-weight: 700;
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .close-btn {
    width: var(--tap-min-size);
    height: var(--tap-min-size);
    font-size: 18px;
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    transition: color 0.12s, background-color 0.12s;
  }

  .close-btn:active {
    color: #ffffff;
    background-color: var(--color-surface-active);
  }

  .ref-content {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 16px;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .empty-ref {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-text-secondary);
    font-size: 14px;
    text-align: center;
  }
</style>
