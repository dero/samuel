<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import { versionService } from '../../services/versionService.svelte';
  import type { OcrItem, TableStructure, OcrLayoutMode } from './types';
  import OcrWorker from './ocr.worker?worker';
  import {
    Scan,
    DownloadSimple,
    SpinnerGap,
    Trash,
    Copy,
    CheckCircle,
    Table,
    TextAlignLeft,
    Sparkle,
    Eye,
    EyeSlash,
    ArrowClockwise,
    ArrowCounterClockwise
  } from 'phosphor-svelte';

  let worker: Worker | null = null;
  let fileInputEl = $state<HTMLInputElement | null>(null);

  let isProcessing = $state(false);
  let progressStep = $state('');
  let isDragging = $state(false);

  let userRotation = $state(0);
  let currentFileBuffer = $state<ArrayBuffer | null>(null);

  let imagePreviewUrl = $state<string | null>(null);
  let imageNaturalWidth = $state(0);
  let imageNaturalHeight = $state(0);

  let recognizedText = $state('');
  let recognizedLines = $state<OcrItem[][]>([]);
  let tableStructure = $state<TableStructure | null>(null);
  let confidenceScore = $state(0);

  let layoutMode = $state<OcrLayoutMode>('auto');
  let showBoundingBoxes = $state(false);
  let copyFeedback = $state<string | null>(null);

  let enableUnwarp = $state(true);
  let unwarpedPreviewUrl = $state<string | null>(null);
  let showOriginal = $state(false);

  let displayImageUrl = $derived((unwarpedPreviewUrl && !showOriginal) ? unwarpedPreviewUrl : imagePreviewUrl);

  // Effective mode: if auto, choose table if tableStructure.isTable, else text
  let effectiveMode = $derived.by(() => {
    if (layoutMode === 'auto') {
      return tableStructure?.isTable ? 'table' : 'text';
    }
    return layoutMode;
  });

  onMount(() => {
    // Instantiate background OCR worker
    try {
      worker = new OcrWorker();
      worker.onmessage = handleWorkerMessage;
      worker.onerror = (err) => {
        console.error('OCR worker error:', err);
        isProcessing = false;
        toast.show('Chyba Web Workeru pro OCR', { type: 'danger' });
      };
    } catch (err) {
      console.error('Failed to start OCR worker:', err);
    }

    // Support clipboard paste for images
    window.addEventListener('paste', handleWindowPaste);
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('paste', handleWindowPaste);
    }
    worker?.terminate();
    worker = null;
  });

  function handleWorkerMessage(e: MessageEvent) {
    const data = e.data;
    if (data.type === 'progress') {
      progressStep = data.message || 'Zpracovávám…';
    } else if (data.type === 'result') {
      isProcessing = false;
      recognizedText = data.text;
      recognizedLines = data.lines;
      tableStructure = data.table;
      confidenceScore = data.confidence;
      if (data.unwarpedPreviewUrl) {
        unwarpedPreviewUrl = data.unwarpedPreviewUrl;
      }
      if (data.effectiveRotation !== undefined && userRotation === 0 && data.effectiveRotation !== 0) {
        userRotation = data.effectiveRotation;
      }
      settings.vibrate(30);
      toast.show('Rozpoznávání dokončeno', { type: 'success', duration: 2000 });
    } else if (data.type === 'error') {
      isProcessing = false;
      settings.vibrate(50);
      toast.show(data.error || 'Chyba při rozpoznávání', { type: 'danger' });
    }
  }

  function handleFileSelected(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      processFile(target.files[0]);
    }
  }

  function handleWindowPaste(e: ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          settings.vibrate(20);
          processFile(file);
          break;
        }
      }
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        settings.vibrate(20);
        processFile(file);
      } else {
        toast.show('Vyberte prosím obrázek', { type: 'warning' });
      }
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave() {
    isDragging = false;
  }

  async function processFile(file: File) {
    userRotation = 0;
    recognizedText = '';
    recognizedLines = [];
    tableStructure = null;
    showBoundingBoxes = false;
    unwarpedPreviewUrl = null;
    showOriginal = false;
    const buffer = await file.arrayBuffer();
    currentFileBuffer = buffer;

    // Decode with EXIF orientation correction for preview
    try {
      const bmp = await createImageBitmap(new Blob([buffer]), { imageOrientation: 'from-image' });
      const canvas = document.createElement('canvas');
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(bmp, 0, 0);
      imagePreviewUrl = canvas.toDataURL('image/jpeg', 0.92);
      imageNaturalWidth = bmp.width;
      imageNaturalHeight = bmp.height;
      bmp.close();
    } catch {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        imagePreviewUrl = loadEvt.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  function rotateImage(delta: number) {
    settings.vibrate(20);
    userRotation = ((userRotation + delta) % 360 + 360) % 360;
    unwarpedPreviewUrl = null;
    showOriginal = false;
    if (recognizedLines.length > 0) {
      recognizedLines = [];
      showBoundingBoxes = false;
    }
  }

  function startRecognition() {
    if (!currentFileBuffer) return;
    if (!versionService.state.isOcrInstalled) {
      settings.vibrate(50);
      toast.show('Nejprve stáhněte offline OCR balíček výše', { type: 'warning' });
      return;
    }
    settings.vibrate(25);
    isProcessing = true;
    progressStep = 'Připravuji obrázek…';
    recognizedText = '';
    recognizedLines = [];
    tableStructure = null;

    if (!worker) {
      worker = new OcrWorker();
      worker.onmessage = handleWorkerMessage;
    }

    worker.postMessage({
      id: String(Date.now()),
      type: 'recognize',
      imageBuffer: currentFileBuffer,
      userRotation,
      enableUnwarp
    });
  }

  function triggerFilePicker() {
    settings.vibrate(20);
    fileInputEl?.click();
  }

  function clearCurrent() {
    settings.vibrate(20);
    imagePreviewUrl = null;
    unwarpedPreviewUrl = null;
    showOriginal = false;
    recognizedText = '';
    recognizedLines = [];
    tableStructure = null;
    if (fileInputEl) fileInputEl.value = '';
  }

  async function handleDownloadModels() {
    settings.vibrate(20);
    try {
      await versionService.downloadOcr();
      toast.show('OCR modely úspěšně staženy', { type: 'success' });
    } catch (err: any) {
      toast.show(`Chyba: ${err?.message || 'Nepodařilo se stáhnout'}`, { type: 'danger' });
    }
  }

  async function copyToClipboard(textToCopy: string, formatName: string) {
    if (!textToCopy) return;
    settings.vibrate(25);
    try {
      await navigator.clipboard.writeText(textToCopy);
      copyFeedback = formatName;
      setTimeout(() => {
        if (copyFeedback === formatName) copyFeedback = null;
      }, 2000);
      toast.show(`Zkopírováno (${formatName})`, { type: 'success', duration: 1500 });
    } catch {
      toast.show('Kopírování do schránky se nezdařilo', { type: 'danger' });
    }
  }

  function copyWithoutSpaces() {
    const raw = effectiveMode === 'table' && tableStructure
      ? tableStructure.grid.flat().join('')
      : recognizedText.replace(/\s+/g, '');
    copyToClipboard(raw, 'bez mezer');
  }
</script>

<div class="ocr-wrapper">
  <!-- Offline Model Download Banner if not installed -->
  {#if !versionService.state.isOcrInstalled}
    <section class="download-banner">
      <div class="banner-header">
        <Scan size={24} weight="duotone" class="banner-icon" />
        <div class="banner-text">
          <h2 class="banner-title">Offline OCR modely</h2>
          <p class="banner-desc">
            Pro čtení textu z fotek přímo v terénu bez internetu je potřeba stáhnout offline balíček (~105 MB).
          </p>
        </div>
      </div>

      <button
        type="button"
        class="action-btn download-btn"
        disabled={versionService.state.status === 'downloading_ocr'}
        onclick={handleDownloadModels}
      >
        {#if versionService.state.status === 'downloading_ocr'}
          <SpinnerGap size={18} class="spin" />
          <span>Stahuji OCR modely ({versionService.state.progress} %)...</span>
        {:else}
          <DownloadSimple size={18} weight="bold" />
          <span>Stáhnout OCR modely do paměti (~105 MB)</span>
        {/if}
      </button>
    </section>
  {/if}

  <!-- Photo Picker Zone -->
  <section class="photo-section">
    <input
      type="file"
      accept="image/*"
      class="hidden-file-input"
      bind:this={fileInputEl}
      onchange={handleFileSelected}
    />

    {#if !imagePreviewUrl}
      <!-- Empty Dropzone / Tap to pick -->
      <button
        type="button"
        class="picker-dropzone"
        class:is-dragging={isDragging}
        onclick={triggerFilePicker}
        ondrop={handleDrop}
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
      >
        <div class="dropzone-icon">
          <Scan size={38} weight="duotone" />
        </div>
        <div class="dropzone-label">Vyberte fotografii z galerie</div>
        <div class="dropzone-sub">Nebo fotku přetáhněte sem / vložte ze schránky (Ctrl+V)</div>
      </button>
    {:else}
      <!-- Image Preview Header Card -->
      <div class="preview-card">
        <div class="preview-stage">
          <div
            class="preview-rotatable"
            style="transform: rotate({userRotation}deg); transition: transform 0.2s ease;"
          >
            <img src={displayImageUrl} alt="Předloha k rozpoznání" class="preview-img" />

            {#if unwarpedPreviewUrl && !showOriginal}
              <div class="unwarp-badge">UVDoc narovnáno</div>
            {/if}

            <!-- Optional Bounding Box Overlay -->
            {#if showBoundingBoxes && recognizedLines.length > 0 && imageNaturalWidth > 0}
              <div class="bounding-boxes-layer" aria-hidden="true">
                {#each recognizedLines.flat() as item}
                  <div
                    class="box-rect"
                    style="
                      left: {(item.box.x / (userRotation % 180 !== 0 ? imageNaturalHeight : imageNaturalWidth)) * 100}%;
                      top: {(item.box.y / (userRotation % 180 !== 0 ? imageNaturalWidth : imageNaturalHeight)) * 100}%;
                      width: {(item.box.width / (userRotation % 180 !== 0 ? imageNaturalHeight : imageNaturalWidth)) * 100}%;
                      height: {(item.box.height / (userRotation % 180 !== 0 ? imageNaturalWidth : imageNaturalHeight)) * 100}%;
                    "
                    title="{item.text} ({Math.round(item.confidence * 100)} %)"
                  ></div>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <!-- Clean responsive toolbar -->
        <div class="preview-toolbar">
          <div class="tool-group rotate-group">
            <span class="tool-label">Otočit:</span>
            <button
              type="button"
              class="tool-btn"
              onclick={() => rotateImage(-90)}
              title="Otočit o 90° doleva"
            >
              <ArrowCounterClockwise size={15} weight="bold" />
              <span>-90°</span>
            </button>

            <button
              type="button"
              class="tool-btn"
              onclick={() => rotateImage(90)}
              title="Otočit o 90° doprava"
            >
              <ArrowClockwise size={15} weight="bold" />
              <span>+90°</span>
            </button>
          </div>

          <div class="tool-group actions-group">
            <button
              type="button"
              class="tool-btn"
              class:active={enableUnwarp}
              onclick={() => {
                settings.vibrate(20);
                enableUnwarp = !enableUnwarp;
              }}
              title="Vyrovnat zakřivení papíru a vlnění řádků pomocí UVDoc"
            >
              <span>UVDoc</span>
            </button>

            {#if unwarpedPreviewUrl}
              <button
                type="button"
                class="tool-btn"
                class:active={showOriginal}
                onclick={() => {
                  settings.vibrate(20);
                  showOriginal = !showOriginal;
                }}
                title="Přepnout mezi původní a narovnanou fotkou"
              >
                <span>{showOriginal ? 'Původní' : 'Narovnaná'}</span>
              </button>
            {/if}

            {#if recognizedLines.length > 0}
              <button
                type="button"
                class="tool-btn"
                class:active={showBoundingBoxes}
                onclick={() => {
                  settings.vibrate(20);
                  showBoundingBoxes = !showBoundingBoxes;
                }}
                title="Zobrazit detekované rámečky na fotce"
              >
                {#if showBoundingBoxes}
                  <EyeSlash size={15} />
                  <span>Skrýt</span>
                {:else}
                  <Eye size={15} />
                  <span>Rámečky</span>
                {/if}
              </button>
            {/if}

            <button type="button" class="tool-btn" onclick={triggerFilePicker} title="Zvolit jinou fotku">
              Změnit
            </button>

            <button
              type="button"
              class="tool-btn danger"
              onclick={clearCurrent}
              aria-label="Odstranit fotku"
              title="Odstranit fotku"
            >
              <Trash size={15} />
              <span>Smazat</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Action Button to Trigger Recognition -->
      <button
        type="button"
        class="action-btn run-ocr-btn"
        disabled={isProcessing}
        onclick={startRecognition}
      >
        {#if isProcessing}
          <SpinnerGap size={20} class="spin" />
          <span>{progressStep || 'Rozpoznávám text (PP-OCRv6)…'}</span>
        {:else if recognizedText || (tableStructure && tableStructure.rowCount > 0)}
          <ArrowClockwise size={20} weight="bold" />
          <span>Znovu rozpoznat text</span>
        {:else}
          <Scan size={20} weight="bold" />
          <span>Rozpoznat text</span>
        {/if}
      </button>
    {/if}
  </section>

  <!-- Recognition Result Section -->
  {#if recognizedText || (tableStructure && tableStructure.rowCount > 0)}
    <section class="results-section">
      <!-- Toolbar & Detection Meta -->
      <div class="results-toolbar">
        <div class="meta-badge">
          {#if tableStructure?.isTable}
            <span class="type-pill table">
              <Table size={14} weight="bold" />
              <span>Tabulka ({tableStructure.colCount} sloupce, {tableStructure.rowCount} řádků)</span>
            </span>
          {:else}
            <span class="type-pill text">
              <TextAlignLeft size={14} weight="bold" />
              <span>Volný text</span>
            </span>
          {/if}
        </div>

        <!-- Mode switcher: Auto | Text | Tabulka -->
        <div class="mode-segmented" role="tablist">
          <button
            type="button"
            class="mode-tab"
            class:active={layoutMode === 'auto'}
            onclick={() => {
              settings.vibrate(20);
              layoutMode = 'auto';
            }}
          >
            <Sparkle size={13} weight="bold" />
            <span>Auto</span>
          </button>

          <button
            type="button"
            class="mode-tab"
            class:active={layoutMode === 'text'}
            onclick={() => {
              settings.vibrate(20);
              layoutMode = 'text';
            }}
          >
            <TextAlignLeft size={13} weight="bold" />
            <span>Text</span>
          </button>

          <button
            type="button"
            class="mode-tab"
            class:active={layoutMode === 'table'}
            onclick={() => {
              settings.vibrate(20);
              layoutMode = 'table';
            }}
          >
            <Table size={13} weight="bold" />
            <span>Tabulka</span>
          </button>
        </div>
      </div>

      <!-- Result Content Box -->
      <div class="result-display-card">
        {#if effectiveMode === 'table' && tableStructure && tableStructure.grid.length > 0}
          <!-- Structured Table Grid View -->
          <div class="table-scroll-container">
            <table class="ocr-grid">
              <tbody>
                {#each tableStructure.grid as row, rIdx}
                  <tr class="grid-row">
                    {#each row as cell, cIdx}
                      <td class="grid-cell" class:empty-cell={!cell}>
                        {cell || '—'}
                      </td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <!-- Plain / Formatted Text View -->
          <div class="text-scroll-container">
            <pre class="ocr-text-output">{recognizedText || tableStructure?.plainText}</pre>
          </div>
        {/if}
      </div>

      <!-- Bottom Quick Copy Actions -->
      <div class="actions-bar">
        {#if effectiveMode === 'table' && tableStructure}
          <button
            type="button"
            class="copy-btn primary"
            onclick={() => copyToClipboard(tableStructure!.tsv, 'TSV tabulka')}
          >
            {#if copyFeedback === 'TSV tabulka'}
              <CheckCircle size={16} weight="fill" />
              <span>Zkopírováno!</span>
            {:else}
              <Copy size={16} weight="bold" />
              <span>Kopírovat tabulku (TSV)</span>
            {/if}
          </button>

          <button
            type="button"
            class="copy-btn secondary"
            onclick={() => copyToClipboard(tableStructure!.plainText, 'Text')}
          >
            {#if copyFeedback === 'Text'}
              <CheckCircle size={16} weight="fill" />
              <span>Zkopírováno!</span>
            {:else}
              <TextAlignLeft size={16} weight="bold" />
              <span>Text</span>
            {/if}
          </button>
        {:else}
          <button
            type="button"
            class="copy-btn primary"
            onclick={() => copyToClipboard(recognizedText, 'Text')}
          >
            {#if copyFeedback === 'Text'}
              <CheckCircle size={16} weight="fill" />
              <span>Zkopírováno!</span>
            {:else}
              <Copy size={16} weight="bold" />
              <span>Kopírovat text</span>
            {/if}
          </button>
        {/if}

        <button
          type="button"
          class="copy-btn tertiary"
          title="Zkopírovat všechna písmena v kuse bez mezer (vhodné pro šifrovací pomůcky)"
          onclick={copyWithoutSpaces}
        >
          {#if copyFeedback === 'bez mezer'}
            <CheckCircle size={16} weight="fill" />
            <span>Zkopírováno!</span>
          {:else}
            <span>Bez mezer</span>
          {/if}
        </button>
      </div>
    </section>
  {/if}
</div>

<style>
  .ocr-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    max-width: 680px;
    margin: 0 auto;
    padding: var(--space-md) var(--space-md) var(--space-xl) var(--space-md);
    box-sizing: border-box;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    gap: var(--space-md);
  }

  /* Download Banner */
  .download-banner {
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .banner-header {
    display: flex;
    align-items: flex-start;
    gap: var(--space-md);
  }

  :global(.banner-icon) {
    color: var(--color-accent-primary);
    flex-shrink: 0;
    margin-top: 2px;
  }

  .banner-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .banner-title {
    font-size: var(--text-base);
    font-weight: 700;
    margin: 0;
  }

  .banner-desc {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: 1.4;
    margin: 0;
  }

  .action-btn {
    width: 100%;
    min-height: 44px;
    background-color: var(--color-accent-primary);
    color: var(--color-text-inverse);
    font-size: var(--text-sm);
    font-weight: 700;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    transition: opacity 0.12s, transform 0.05s;
  }

  .action-btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  .action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Photo Section */
  .photo-section {
    width: 100%;
  }

  .hidden-file-input {
    display: none;
  }

  .picker-dropzone {
    width: 100%;
    min-height: 160px;
    background-color: var(--color-surface-1);
    border: 2px dashed var(--color-border-medium);
    border-radius: var(--radius-md);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    padding: var(--space-lg);
    cursor: pointer;
    box-sizing: border-box;
    transition: border-color 0.15s, background-color 0.15s;
  }

  .picker-dropzone:active,
  .picker-dropzone.is-dragging {
    background-color: var(--color-surface-active);
    border-color: var(--color-accent-primary);
  }

  .dropzone-icon {
    color: var(--color-accent-primary);
  }

  .dropzone-label {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text-primary);
    text-align: center;
  }

  .dropzone-sub {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-align: center;
    max-width: 320px;
  }

  /* Preview Card */
  .preview-card {
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .preview-stage {
    position: relative;
    max-height: 260px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #000000;
  }

  .preview-rotatable {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: 100%;
    max-height: 260px;
  }

  .preview-img {
    max-width: 100%;
    max-height: 260px;
    object-fit: contain;
    display: block;
  }

  .unwarp-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    background-color: rgba(16, 185, 129, 0.85);
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: var(--radius-sm);
    letter-spacing: 0.03em;
    backdrop-filter: blur(4px);
    pointer-events: none;
    z-index: 2;
  }

  .bounding-boxes-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .box-rect {
    position: absolute;
    border: 1.5px solid var(--color-accent-primary);
    background-color: rgba(0, 210, 255, 0.15);
    border-radius: 2px;
    box-sizing: border-box;
  }

  /* Preview Toolbar */
  .preview-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    background-color: var(--color-surface-2);
    border-top: 1px solid var(--color-border-subtle);
  }

  .tool-group {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .tool-label {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    font-weight: 600;
    margin-right: 2px;
  }

  .tool-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 32px;
    padding: 0 9px;
    border-radius: var(--radius-sm);
    font-size: var(--text-xs);
    font-weight: 600;
    background-color: var(--color-surface-1);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-subtle);
    cursor: pointer;
    transition: background-color 0.12s, border-color 0.12s, transform 0.05s;
    touch-action: manipulation;
  }

  .tool-btn:hover {
    background-color: var(--color-surface-2);
  }

  .tool-btn:active {
    background-color: var(--color-surface-active);
    transform: scale(0.96);
  }

  .tool-btn.active {
    background-color: var(--color-accent-primary);
    color: var(--color-text-inverse);
    border-color: var(--color-accent-primary);
  }

  .tool-btn.danger {
    color: #f87171;
  }

  .tool-btn.danger:hover,
  .tool-btn.danger:active {
    background-color: rgba(239, 68, 68, 0.12);
    border-color: rgba(239, 68, 68, 0.3);
  }

  .run-ocr-btn {
    margin-top: var(--space-xs);
    min-height: 48px;
    font-size: var(--text-base);
    background-color: var(--color-accent-primary);
    box-shadow: 0 2px 8px rgba(0, 210, 255, 0.15);
  }


  /* Results Section */
  .results-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    flex: 1;
  }

  .results-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
  }

  .type-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: var(--text-xs);
    font-weight: 700;
    padding: 4px 10px;
    border-radius: var(--radius-full);
  }

  .type-pill.table {
    background-color: var(--color-accent-primary-subtle);
    color: var(--color-accent-primary);
    border: 1px solid rgba(0, 210, 255, 0.3);
  }

  .type-pill.text {
    background-color: var(--color-surface-2);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border-subtle);
  }

  /* Segmented mode switcher */
  .mode-segmented {
    display: flex;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: 2px;
    gap: 2px;
  }

  .mode-tab {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: none;
    border: none;
    border-radius: var(--radius-xs);
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: background-color 0.12s, color 0.12s;
  }

  .mode-tab.active {
    background-color: var(--color-accent-primary);
    color: #000000;
  }

  /* Result Display Card */
  .result-display-card {
    background-color: #000000;
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    min-height: 140px;
    overflow: hidden;
    position: relative;
  }

  .text-scroll-container {
    padding: var(--space-md);
    max-height: 380px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .ocr-text-output {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: 1.5;
    color: var(--color-text-primary);
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
    user-select: text;
    -webkit-user-select: text;
  }

  .table-scroll-container {
    overflow-x: auto;
    max-height: 380px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .ocr-grid {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }

  .grid-row:nth-child(even) {
    background-color: var(--color-surface-1);
  }

  .grid-cell {
    padding: 8px 12px;
    border: 1px solid var(--color-border-subtle);
    white-space: nowrap;
    user-select: text;
    -webkit-user-select: text;
  }

  .grid-cell.empty-cell {
    color: var(--color-text-muted);
    text-align: center;
  }

  /* Actions Bar */
  .actions-bar {
    display: flex;
    gap: var(--space-xs);
  }

  .copy-btn {
    flex: 1;
    min-height: 44px;
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    border: none;
    transition: transform 0.05s, opacity 0.12s;
  }

  .copy-btn:active {
    transform: scale(0.98);
  }

  .copy-btn.primary {
    background-color: var(--color-accent-primary);
    color: #000000;
  }

  .copy-btn.secondary {
    background-color: var(--color-surface-2);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-subtle);
  }

  .copy-btn.tertiary {
    flex: 0 0 auto;
    padding: 0 14px;
    background-color: var(--color-surface-1);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border-subtle);
    font-size: var(--text-xs);
  }

  :global(.spin) {
    animation: spin 0.9s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
