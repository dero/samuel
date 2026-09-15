<script lang="ts">
  import { X } from 'phosphor-svelte';
  import { settings } from '../../state/settings.svelte';

  interface Props {
    open: boolean;
    title: string;
    icon?: any;
    badge?: string | number;
    maxWidth?: string;
    height?: string;
    scrollable?: boolean;
    padding?: boolean;
    onClose: () => void;
    children?: import('svelte').Snippet;
    headerActions?: import('svelte').Snippet;
  }

  let {
    open,
    title,
    icon: IconComponent,
    badge,
    maxWidth = '520px',
    height,
    scrollable = true,
    padding = true,
    onClose,
    children,
    headerActions
  }: Props = $props();

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      settings.vibrate(15);
      onClose();
    }
  }

  function handleCloseClick() {
    settings.vibrate(20);
    onClose();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="sheet-backdrop" onclick={handleBackdropClick}>
    <div
      class="sheet-panel"
      style:max-width={maxWidth}
      style:height={height || null}
      onclick={(e) => e.stopPropagation()}
    >
      <header class="sheet-header">
        <div class="sheet-title-group">
          {#if IconComponent}
            <span class="sheet-title-icon">
              <IconComponent size={20} weight="duotone" />
            </span>
          {/if}
          <span class="sheet-title">{title}</span>
          {#if badge !== undefined && badge !== ''}
            <span class="sheet-badge">{badge}</span>
          {/if}
        </div>

        <div class="sheet-actions">
          {#if headerActions}
            {@render headerActions()}
          {/if}
          <button
            type="button"
            class="sheet-close-btn"
            aria-label="Zavřít panel"
            onclick={handleCloseClick}
          >
            <X size={20} weight="bold" />
          </button>
        </div>
      </header>

      <div
        class="sheet-body"
        class:is-scrollable={scrollable}
        class:has-padding={padding}
      >
        {#if children}
          {@render children()}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .sheet-backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.72);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: 210;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  @media (min-width: 600px) {
    .sheet-backdrop {
      align-items: center;
      padding: var(--space-xl);
    }
  }

  .sheet-panel {
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    width: 100%;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: sheetSlideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: var(--shadow-sheet);
  }

  @media (min-width: 600px) {
    .sheet-panel {
      border-radius: var(--radius-lg);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.85);
    }
  }

  @keyframes sheetSlideUp {
    from {
      transform: translateY(100%);
      opacity: 0.7;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .sheet-header {
    height: var(--header-height);
    padding: 0 var(--space-lg);
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--color-border-subtle);
    background-color: var(--color-surface-1);
    flex-shrink: 0;
  }

  .sheet-title-group {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-width: 0;
  }

  .sheet-title-icon {
    display: flex;
    align-items: center;
    color: var(--color-accent-primary);
    flex-shrink: 0;
  }

  .sheet-title {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sheet-badge {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-muted);
    background-color: var(--color-surface-2);
    padding: 2px 8px;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border-subtle);
    flex-shrink: 0;
  }

  .sheet-actions {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .sheet-close-btn {
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

  .sheet-close-btn:active {
    color: #ffffff;
    background-color: var(--color-surface-active);
  }

  .sheet-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .sheet-body.is-scrollable {
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    gap: var(--space-md);
  }

  .sheet-body.has-padding {
    padding: var(--space-lg);
  }
</style>
