<script lang="ts">
  interface Props {
    text: string;
    /** When true the hint blurs and fades out (there is content to show) */
    hidden?: boolean;
    class?: string;
  }

  let { text, hidden = false, class: customClass = '' }: Props = $props();
</script>

<div
  class="empty-hint {customClass}"
  class:is-hidden={hidden}
  aria-hidden={hidden}
>
  <p class="empty-hint-text">{text}</p>
</div>

<style>
  .empty-hint {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    max-width: 320px;
    padding: 0 var(--space-sm);
    color: var(--color-text-muted);
    user-select: none;
    -webkit-user-select: none;
    pointer-events: none;
    box-sizing: border-box;
    z-index: 10;
    opacity: 1;
    filter: blur(0px);
    transform: scale(1) translateZ(0);
    will-change: opacity, filter, transform;
    transition:
      opacity 0.7s ease-in-out,
      filter 0.7s ease-in-out,
      transform 0.7s ease-in-out;
  }

  .empty-hint.is-hidden {
    opacity: 0;
    filter: blur(14px);
    transform: scale(0.96) translateZ(0);
    pointer-events: none;
  }

  .empty-hint-text {
    font-family: var(--font-sans);
    font-size: calc(12px * var(--font-scale));
    line-height: 1.4;
    color: var(--color-text-muted);
    margin: 0;
    text-align: center;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    max-width: 100%;
  }
</style>
