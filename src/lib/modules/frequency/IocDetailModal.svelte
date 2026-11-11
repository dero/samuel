<script lang="ts">
  import BottomSheet from '../../components/ui/BottomSheet.svelte';
  import { Info } from 'phosphor-svelte';
  import type { FrequencyAnalysisResult } from './frequencySolver';
  import { IOC_EXPECTED } from './frequencyData';

  interface Props {
    open: boolean;
    analysis: FrequencyAnalysisResult;
    onClose: () => void;
  }

  let { open, analysis, onClose }: Props = $props();
</script>

<BottomSheet
  {open}
  title="Statistika textu"
  icon={Info}
  {onClose}
>
  <div class="ioc-modal-content">
    <div class="ioc-score-header">
      <div class="ioc-score-number font-mono">{analysis.ioc.ioc.toFixed(4)}</div>
      <div
        class="ioc-classification-badge font-mono"
        class:nature-mono={analysis.ioc.classification === 'mono'}
        class:nature-poly={analysis.ioc.classification === 'poly'}
        class:nature-high={analysis.ioc.classification === 'high'}
        class:nature-low={analysis.ioc.classification === 'low'}
      >
        {analysis.ioc.label}
      </div>
    </div>

    <p class="ioc-description-text">{analysis.ioc.description}</p>

    <div class="ioc-summary-grid font-mono">
      <div class="ioc-summary-card">
        <span class="summary-card-label">Celkem znaků</span>
        <span class="summary-card-val">{analysis.totalChars}</span>
      </div>
      <div class="ioc-summary-card">
        <span class="summary-card-label">Různých znaků</span>
        <span class="summary-card-val">{analysis.uniqueChars}</span>
      </div>
    </div>

    <div class="ioc-scale-guide">
      <div class="scale-guide-title">Orientační IoC</div>
      <div class="scale-guide-row">
        <span class="scale-val font-mono">~ {IOC_EXPECTED.csUnaccented.toFixed(3)}</span>
        <span class="scale-desc">Čeština bez diakritiky, substituce, posun</span>
      </div>
      <div class="scale-guide-row">
        <span class="scale-val font-mono">~ {IOC_EXPECTED.csDiacritics42.toFixed(3)}</span>
        <span class="scale-desc">Čeština s diakritikou</span>
      </div>
      <div class="scale-guide-row">
        <span class="scale-val font-mono">~ 0.038 – 0.045</span>
        <span class="scale-desc">Vigenère s delším heslem</span>
      </div>
      <div class="scale-guide-row">
        <span class="scale-val font-mono">{IOC_EXPECTED.uniform26}</span>
        <span class="scale-desc">Náhodný text</span>
      </div>
    </div>
  </div>
</BottomSheet>

<style>
  .font-mono {
    font-family: var(--font-mono, monospace);
  }

  .ioc-modal-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 4px 2px 12px;
  }

  .ioc-score-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 8px 12px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
  }

  .ioc-score-number {
    font-size: 29px;
    font-weight: 700;
    color: var(--color-accent-primary);
  }

  .ioc-classification-badge {
    font-size: 14.5px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 4px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
  }

  .nature-mono {
    border-color: rgba(16, 185, 129, 0.45);
    background-color: rgba(16, 185, 129, 0.12);
    color: #34d399;
  }

  .nature-poly {
    border-color: rgba(59, 130, 246, 0.45);
    background-color: rgba(59, 130, 246, 0.12);
    color: #60a5fa;
  }

  .nature-high {
    border-color: rgba(245, 158, 11, 0.45);
    background-color: rgba(245, 158, 11, 0.12);
    color: #fbbf24;
  }

  .nature-low {
    border-color: var(--color-border-subtle);
    color: var(--color-text-muted);
  }

  .ioc-description-text {
    margin: 0;
    font-size: 15.5px;
    line-height: 1.45;
    color: var(--color-text-secondary);
  }

  .ioc-summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .ioc-summary-card {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 10px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
  }

  .summary-card-label {
    font-size: 12.5px;
    color: var(--color-text-muted);
  }

  .summary-card-val {
    font-size: 17px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .ioc-scale-guide {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
  }

  .scale-guide-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 2px;
  }

  .scale-guide-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
    font-size: 14.5px;
  }

  .scale-val {
    font-weight: 700;
    color: var(--color-accent-primary);
    min-width: 52px;
  }

  .scale-desc {
    color: var(--color-text-secondary);
    line-height: 1.35;
  }
</style>
