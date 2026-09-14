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
        <button class="close-btn" onclick={() => navigation.closeSubView()}>✕</button>
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
    background-color: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
    z-index: 210;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
  }

  .ref-panel {
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    width: 100%;
    max-width: 600px;
    height: 85vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.8);
  }

  .ref-header {
    height: 52px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .ref-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-accent-primary);
  }

  .close-btn {
    width: var(--tap-min-size);
    height: var(--tap-min-size);
    font-size: 18px;
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ref-content {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 16px;
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
