<script lang="ts">
  import { untrack } from 'svelte';
  import { ArrowRight, ClipboardText, ImageSquare, WarningCircle } from 'phosphor-svelte';
  import Keycap from '../ui/Keycap.svelte';
  import SplitBottomRow from '../ui/SplitBottomRow.svelte';
  import PodkladMethodButton from './PodkladMethodButton.svelte';
  import { podklad, PODKLAD_METHODS, type PodkladConfig } from '../../state/podklad.svelte';
  import { navigation } from '../../state/navigation.svelte';
  import { pasteFromClipboard, copyToClipboard } from '../../utils/clipboard';
  import { toast } from '../../state/toast.svelte';

  /** Podklad tab of the lower panel. Text is saved on every edit, so the output above stays live. */
  interface Props {
    config: PodkladConfig;
  }

  let { config }: Props = $props();

  // The panel mounts when the tab opens; afterwards the draft owns the text and keeps the cursor
  let draft = $state(untrack(() => (config.kind === 'image' ? '' : config.value)));
  let textareaEl = $state<HTMLTextAreaElement | null>(null);

  function save() {
    if (config.kind !== 'image') config.onSave(draft);
  }

  // The clipboard replaces the whole podklad, never mixes into it. Replacing text that is
  // there would lose it, so that takes the hold on Smazat first (irreversible = hold).
  async function handlePaste() {
    if (draft) {
      toast.show('Nejdřív podržte Smazat', { type: 'info' });
      return;
    }
    const text = await pasteFromClipboard();
    if (!text) return;
    draft = text;
    save();
  }

  // An example and the format, two lines, so the empty editor teaches its own notation
  const placeholderText = $derived.by(() => {
    if (config.kind === 'image') return '';
    const example = config.placeholder ?? (config.example ? `Např. ${config.example}` : 'Napište nebo vložte text…');
    const format = config.format ?? config.description;
    return format ? `${example}\n${format}` : example;
  });

  function handleCopy() {
    copyToClipboard(draft);
  }

  function handleClear() {
    draft = '';
    save();
  }

  // The keyboard either shrinks the window (Android, resizes-content) or only overlays it (iOS):
  // both shrink the visual viewport. Its height before the focus is the reference.
  const KEYBOARD_MIN = 120;
  let viewportBefore = 0;

  // Read at each change rather than tracked from focus events, which a browser may defer
  const isEditorFocused = () => !!textareaEl && document.activeElement === textareaEl;

  $effect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      const editorFocused = isEditorFocused();
      // Keeps the editor above the OS keyboard where the browser only overlays it
      podklad.keyboardInset = Math.max(
        0,
        Math.round(window.innerHeight - viewport.height - viewport.offsetTop)
      );
      if (!editorFocused) viewportBefore = viewport.height;
      podklad.keyboardOpen = editorFocused && viewportBefore - viewport.height > KEYBOARD_MIN;
    };
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', update);
      podklad.keyboardInset = 0;
      podklad.keyboardOpen = false;
    };
  });
</script>

{#if config.kind === 'image'}
  {@const image = config}
  <div class="podklad-image">
    <!-- The frame takes every pixel above the keys: the photo is what the player checks here -->
    <div class="image-frame" class:is-empty={!image.preview}>
      {#if image.preview}
        <img src={image.preview} alt={image.title} />
      {:else}
        <span class="image-placeholder">
          <ImageSquare size={40} weight="duotone" />
          <span>{image.empty ? 'Zatím žádná fotka' : 'Načítám fotku…'}</span>
        </span>
      {/if}
    </div>

    <!-- Bottom row 1+2: [Smazat] [Vyfotit | Z galerie] -->
    <SplitBottomRow
      clearLabel="Smazat"
      clearAriaLabel="Podržte pro smazání fotografie"
      tapWarning="Podržte pro smazání"
      clearDisabled={image.empty}
      onClear={() => image.onClear()}
    >
      {#snippet pair()}
        {#each PODKLAD_METHODS.image as method (method.id)}
          <PodkladMethodButton
            {method}
            onFile={(file) => {
              image.onFile(file);
              navigation.closeSubView();
            }}
          />
        {/each}
      {/snippet}
    </SplitBottomRow>
  </div>
{:else}
  <div class="podklad-editor">
    <textarea
      bind:this={textareaEl}
      bind:value={draft}
      class="editor-text font-mono"
      placeholder={placeholderText}
      aria-label={config.title}
      autocomplete="off"
      autocapitalize={config.autocapitalize ?? 'characters'}
      spellcheck="false"
      oninput={save}
      onfocus={() => window.scrollTo(0, 0)}
    ></textarea>

    {#if config.attention}
      <!-- The reason behind the dot on the Podklad tab -->
      <p class="editor-attention" role="status">
        <WarningCircle size={14} weight="bold" />
        <span>{config.attention}</span>
      </p>
    {/if}

    <!-- Bottom row 1+2: [Smazat] [Ze schránky | Do schránky]; clipboard needs a finished tap.
         Hidden while the OS keyboard is open: it has its own clipboard, and keys right above
         the keyboard get hit by mistake. -->
    {#if !podklad.keyboardOpen}
    <SplitBottomRow
      clearLabel="Smazat"
      clearAriaLabel="Podržte pro smazání textu"
      tapWarning="Podržte pro smazání"
      clearDisabled={!draft}
      onClear={handleClear}
    >
      {#snippet pair()}
        <!-- The arrow reads left to right: out of the clipboard, into the clipboard -->
        <Keycap
          pressOn="click"
          sublabel="Ze schránky"
          ariaLabel="Nahradit text obsahem schránky"
          onPress={handlePaste}
        >
          <span class="key-icons">
            <ClipboardText size={16} weight="bold" />
            <ArrowRight size={12} weight="bold" />
          </span>
        </Keycap>
        <Keycap
          pressOn="click"
          sublabel="Do schránky"
          ariaLabel="Zkopírovat text do schránky"
          disabled={!draft}
          onPress={handleCopy}
        >
          <span class="key-icons">
            <ArrowRight size={12} weight="bold" />
            <ClipboardText size={16} weight="bold" />
          </span>
        </Keycap>
      {/snippet}
    </SplitBottomRow>
    {/if}
  </div>
{/if}

<style>
  .podklad-editor,
  .podklad-image {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    width: 100%;
    min-height: 0;
  }

  .editor-text {
    flex: 1 1 0;
    width: 100%;
    /* Two lines at least: a tall keyboard on a small phone leaves little else */
    min-height: calc(2 * 1.4em + 2 * var(--space-sm) + 2px);
    padding: var(--space-sm) var(--space-md);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-medium);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: var(--text-base);
    font-weight: 600;
    line-height: 1.4;
    box-sizing: border-box;
    resize: none;
    outline: none;
  }

  .editor-text:focus {
    border-color: var(--color-border-focus);
  }

  .editor-text::placeholder {
    color: var(--color-text-secondary);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: 400;
  }

  .editor-attention {
    flex: none;
    display: flex;
    align-items: flex-start;
    gap: var(--space-xs);
    margin: 0;
    font-size: var(--text-xs);
    line-height: 1.35;
    color: var(--color-accent-warning);
  }

  .editor-attention :global(svg) {
    flex: none;
    margin-top: 1px;
  }

  .key-icons {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }

  .image-frame {
    flex: 1 1 0;
    min-height: 96px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-bg-canvas);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  /* Dashed: a place waiting for a photo, not a broken one */
  .image-frame.is-empty {
    border-style: dashed;
    border-color: var(--color-border-medium);
  }

  .image-frame img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .image-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

</style>
