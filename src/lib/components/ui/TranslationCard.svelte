<script lang="ts">
  import { tick } from 'svelte';
  import { copyToClipboard } from '../../utils/clipboard';

  interface Props {
    text: string;
    label?: string;
    placeholder?: string;
    showBadges?: boolean;
    class?: string;
  }

  let {
    text = '',
    placeholder = 'Zde se zobrazí přeložený text...',
    class: customClass = ''
  }: Props = $props();

  let textEl = $state<HTMLDivElement | null>(null);

  $effect(() => {
    // When text changes, auto-scroll to the bottom of the container
    if (text && textEl) {
      tick().then(() => {
        if (textEl) {
          textEl.scrollTop = textEl.scrollHeight;
        }
      });
    }
  });

  async function handleCopy() {
    if (!text.trim()) return;
    await copyToClipboard(text);
  }
</script>

<div class="output-container {customClass}">
  <!-- Decoded Text Card (Click-to-copy, OLED black, minimal) -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="result-card"
    class:is-clickable={text.trim().length > 0}
    onclick={handleCopy}
    title="Klepnutím zkopírujete do schránky"
  >
    <div
      bind:this={textEl}
      class="result-text"
      class:empty={!text.trim()}
    >
      {text || placeholder}
    </div>
  </div>
</div>

<style>
  .output-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    flex: 1;
    min-height: 0;
    position: relative;
  }

  .result-card {
    background-color: var(--color-bg);
    border: none;
    border-radius: var(--radius-sm);
    padding: var(--space-xs) 0;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: var(--output-min-height);
    overflow: hidden;
    transition: opacity 0.15s ease;
    user-select: text;
    box-sizing: border-box;
  }

  .result-card.is-clickable {
    cursor: pointer;
  }

  .result-card.is-clickable:active {
    opacity: 0.7;
  }

  .result-text {
    font-family: var(--font-mono);
    font-size: clamp(20px, 3vh, 26px);
    font-weight: 700;
    color: var(--color-text-primary);
    line-height: 1.35;
    overflow-y: auto;
    word-break: break-word;
    flex: 1;
  }

  .result-text.empty {
    color: var(--color-text-muted);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: 400;
    opacity: 0.6;
  }
</style>
