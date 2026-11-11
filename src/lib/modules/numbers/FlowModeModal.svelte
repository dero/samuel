<script lang="ts">
  import BottomSheet from '../../components/ui/BottomSheet.svelte';
  import { BASE_CONFIGS, ALL_BASES, type FlowMode } from './numbersData';
  import { settings } from '../../state/settings.svelte';
  import { Check, ArrowsLeftRight, TextAa, Hash } from 'phosphor-svelte';

  interface Props {
    open: boolean;
    title?: string;
    modeType?: 'source' | 'target';
    activeMode: FlowMode;
    alphabetName: string;
    minSourceBase?: number;
    maxDigitChar?: string;
    hasTokens?: boolean;
    sourceTokenType?: 'number' | 'roman' | 'char' | 'none';
    onSelect: (mode: FlowMode) => void;
    onClose: () => void;
  }

  let {
    open,
    title = 'Zvolte režim',
    modeType = 'source',
    activeMode,
    alphabetName,
    minSourceBase = 2,
    maxDigitChar = '',
    hasTokens = false,
    sourceTokenType = 'none',
    onSelect,
    onClose
  }: Props = $props();

  function handlePick(mode: FlowMode) {
    settings.vibrate(20);
    onSelect(mode);
    onClose();
  }

  const isCharDisabled = $derived(
    modeType === 'source' && hasTokens && sourceTokenType !== 'char' && sourceTokenType !== 'none'
  );

  const isRomanDisabled = $derived(
    modeType === 'source' && hasTokens && sourceTokenType !== 'roman' && sourceTokenType !== 'none'
  );
</script>

<BottomSheet
  {open}
  {title}
  icon={ArrowsLeftRight}
  maxWidth="480px"
  {onClose}
>
  <div class="flow-mode-container">
    <!-- Category 1: Znak / Text -->
    <div class="category-section">
      <div class="category-title">Znaky & Abeceda</div>
      <button
        type="button"
        class="mode-row"
        class:is-selected={activeMode === 'char'}
        disabled={isCharDisabled}
        onclick={() => handlePick('char')}
      >
        <div class="mode-left">
          <div class="mode-icon-box">
            <TextAa size={22} weight="bold" />
          </div>
          <div class="mode-info">
            <div class="mode-name">
              Písmeno
              {#if isCharDisabled}
                <span class="disabled-icon" aria-hidden="true">❌</span>
              {/if}
            </div>
            <div class="mode-desc" class:is-warning={isCharDisabled}>
              {isCharDisabled ? 'Nutno smazat vstup' : alphabetName}
            </div>
          </div>
        </div>

        {#if activeMode === 'char'}
          <div class="check-icon">
            <Check size={20} weight="bold" />
          </div>
        {/if}
      </button>
    </div>

    <!-- Category 2: Římská čísla -->
    <div class="category-section">
      <div class="category-title">Nepoziční soustavy</div>
      <div class="bases-list">
        <!-- 1. Kanonická -->
        <button
          type="button"
          class="mode-row"
          class:is-selected={activeMode === 'roman'}
          disabled={isRomanDisabled}
          onclick={() => handlePick('roman')}
        >
          <div class="mode-left">
            <div class="mode-icon-box">
              <span class="font-mono mode-glyph">Ř</span>
            </div>
            <div class="mode-info">
              <div class="mode-name">
                Římská kanonická
                {#if isRomanDisabled}
                  <span class="disabled-icon" aria-hidden="true">❌</span>
                {/if}
              </div>
              <div class="mode-desc" class:is-warning={isRomanDisabled}>
                {isRomanDisabled ? 'Nutno smazat vstup' : '1–3999, jen platné tvary'}
              </div>
            </div>
          </div>

          {#if activeMode === 'roman'}
            <div class="check-icon">
              <Check size={20} weight="bold" />
            </div>
          {/if}
        </button>

        <!-- 2. Volná (Jen pro vstup) -->
        <button
          type="button"
          class="mode-row"
          class:is-selected={activeMode === 'roman_loose'}
          disabled={modeType === 'target' || isRomanDisabled}
          onclick={() => handlePick('roman_loose')}
        >
          <div class="mode-left">
            <div class="mode-icon-box">
              <span class="font-mono mode-glyph">Ř+</span>
            </div>
            <div class="mode-info">
              <div class="mode-name">
                Římská volná
                {#if modeType === 'target'}
                  <span class="disabled-tag">Jen vstup</span>
                {:else if isRomanDisabled}
                  <span class="disabled-icon" aria-hidden="true">❌</span>
                {/if}
              </div>
              <div class="mode-desc" class:is-warning={modeType === 'source' && isRomanDisabled}>
                {modeType === 'target'
                  ? 'Výstup je vždy kanonický'
                  : isRomanDisabled
                    ? 'Nutno smazat vstup'
                    : 'Přijme i IIII, IC, IL…'}
              </div>
            </div>
          </div>

          {#if activeMode === 'roman_loose'}
            <div class="check-icon">
              <Check size={20} weight="bold" />
            </div>
          {/if}
        </button>
      </div>
    </div>

    <!-- Category 3: Poziční soustavy -->
    <div class="category-section">
      <div class="category-title">Poziční soustavy</div>
      <div class="bases-list">
        {#each ALL_BASES as b}
          {@const cfg = BASE_CONFIGS[b]}
          {@const isSelected = activeMode === b}
          {@const isDiffType = modeType === 'source' && hasTokens && sourceTokenType !== 'number' && sourceTokenType !== 'none'}
          {@const isBaseTooSmall = modeType === 'source' && hasTokens && sourceTokenType === 'number' && b < minSourceBase}
          {@const isBaseDisabled = isDiffType || isBaseTooSmall}
          <button
            type="button"
            class="mode-row"
            class:is-selected={isSelected}
            disabled={isBaseDisabled}
            onclick={() => handlePick(b)}
          >
            <div class="mode-left">
              <span class="base-badge">{b}</span>
              <div class="mode-info">
                <div class="mode-name">
                  {cfg.name} ({cfg.shortName})
                  {#if isBaseDisabled}
                    <span class="disabled-icon" aria-hidden="true">❌</span>
                  {/if}
                </div>
                <div class="mode-desc" class:is-warning={isBaseDisabled}>
                  {isBaseDisabled
                    ? 'Nutno smazat vstup'
                    : `Číslice ${cfg.digits[0]}–${cfg.digits[cfg.digits.length - 1]}`}
                </div>
              </div>
            </div>

            {#if isSelected}
              <div class="check-icon">
                <Check size={20} weight="bold" />
              </div>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  </div>
</BottomSheet>

<style>
  .flow-mode-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-xs) 0;
  }

  .category-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
  }

  .category-title {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--color-text-secondary);
    padding: 0 var(--space-xs);
    margin-bottom: 2px;
  }

  .bases-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
  }

  .mode-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 48px;
    padding: var(--space-sm) var(--space-md);
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    cursor: pointer;
    text-align: left;
    transition: background-color 0.12s ease, border-color 0.12s ease;
    box-sizing: border-box;
  }

  .mode-row:active {
    background-color: var(--color-surface-active);
  }

  .mode-row.is-selected {
    background-color: var(--color-surface-3);
    border-color: var(--color-accent-primary);
  }

  .mode-left {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  .mode-icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    background-color: var(--color-surface-3);
    color: var(--color-text-primary);
  }

  .mode-glyph {
    font-size: var(--text-base);
    font-weight: 800;
  }

  .base-badge {
    font-family: var(--font-mono, monospace);
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text-primary);
    min-width: 28px;
    text-align: right;
  }

  .mode-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .mode-name {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .mode-desc {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  .mode-desc.is-warning {
    color: var(--color-accent-warning);
    font-weight: 500;
  }

  .check-icon {
    color: var(--color-accent-primary);
    display: flex;
    align-items: center;
  }

  .disabled-icon {
    display: inline-block;
    font-size: var(--text-xs);
    margin-left: var(--space-2xs);
    vertical-align: middle;
    line-height: 1;
  }

  .mode-row:disabled {
    cursor: not-allowed;
  }

  .mode-row:disabled > * {
    opacity: 0.55;
  }

  .disabled-tag {
    display: inline-block;
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    color: var(--color-text-muted);
    background-color: var(--color-surface-3);
    padding: 1px 6px;
    border-radius: var(--radius-xs);
    margin-left: var(--space-2xs);
    vertical-align: middle;
  }
</style>
