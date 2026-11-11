<script lang="ts" module>
  export interface InterlinearToken {
    /** Primary glyph / text (e.g. decoded character 'J' or target base value '21') */
    primary: string;
    /** Optional subscript for primary text (e.g. '10', '3', '16') */
    primarySub?: string | number;
    /** Secondary / source glyph or annotation (e.g. '7', '.-', '⅃·') */
    secondary?: string;
    /** Optional subscript for secondary text (e.g. '10', '2') */
    secondarySub?: string | number;
    /** Whether this token is a word separator / space */
    isSpace?: boolean;
    /** Whether this token has an error (e.g. invalid digit) */
    isError?: boolean;
    /** Tooltip or explanation for the error */
    errorText?: string;
    /** Whether this is a pending (in-progress) token */
    isPending?: boolean;
    /** Optional custom css class */
    className?: string;
  }
</script>

<script lang="ts">
  interface Props {
    tokens: InterlinearToken[];
    pendingToken?: InterlinearToken | null;
    size?: 'sm' | 'md' | 'lg';
    scalePrimaryBy?: 'both' | 'primary';
    class?: string;
  }

  let {
    tokens = [],
    pendingToken = null,
    size = 'md',
    scalePrimaryBy = 'primary',
    class: customClass = ''
  }: Props = $props();
</script>

<div class="interlinear-container size-{size} {customClass}">
  {#each tokens as token, idx (token.isPending ? 'pending' : idx)}
    {#if token.isSpace}
      <span class="interlinear-space" aria-hidden="true">
        <span class="space-symbol">␣</span>
      </span>
    {:else}
      {@const hasSecondary = Boolean(token.secondary || token.secondarySub != null)}
      {@const secSubStr = token.secondarySub != null ? String(token.secondarySub) : ''}
      {@const primLen = token.primary.length}
      {@const secLen = (token.secondary ? token.secondary.length : 0) + Math.ceil(secSubStr.length * 0.7)}
      {@const effPrimLen = scalePrimaryBy === 'both' ? Math.max(primLen, secLen) : primLen}
      {@const primTier = effPrimLen <= 3 ? 'short' : effPrimLen <= 6 ? 'medium' : effPrimLen <= 11 ? 'dense' : effPrimLen <= 18 ? 'long' : 'xlong'}
      {@const secTier = secLen <= 6 ? 'short' : secLen <= 12 ? 'dense' : 'long'}
      <span
        class="interlinear-cell tier-{primTier} sec-tier-{secTier} {token.className || ''}"
        class:is-pending={token.isPending}
        class:is-error={token.isError}
        class:has-secondary={hasSecondary}
        style="--prim-len: {primLen}; --sec-len: {secLen};"
        data-prim-len={primLen}
        title={token.errorText || undefined}
      >
        <span class="cell-top">
          <span class="cell-primary font-mono">{token.primary}{#if token.primarySub != null}<span class="cell-sub">{token.primarySub}</span>{/if}</span>
        </span>
        {#if hasSecondary}
          <span class="cell-bottom">
            <span class="cell-secondary font-mono">{token.secondary ?? ''}{#if token.secondarySub != null}<span class="cell-sub">{token.secondarySub}</span>{/if}</span>
          </span>
        {/if}
      </span>
    {/if}
  {/each}

  {#if pendingToken}
    {#if pendingToken.isSpace}
      <span class="interlinear-space is-pending" aria-hidden="true">
        <span class="space-symbol">␣</span>
      </span>
    {:else}
      {@const hasSecondary = Boolean(pendingToken.secondary || pendingToken.secondarySub != null)}
      {@const secSubStr = pendingToken.secondarySub != null ? String(pendingToken.secondarySub) : ''}
      {@const primLen = pendingToken.primary.length}
      {@const secLen = (pendingToken.secondary ? pendingToken.secondary.length : 0) + Math.ceil(secSubStr.length * 0.7)}
      {@const effPrimLen = scalePrimaryBy === 'both' ? Math.max(primLen, secLen) : primLen}
      {@const primTier = effPrimLen <= 3 ? 'short' : effPrimLen <= 6 ? 'medium' : effPrimLen <= 11 ? 'dense' : effPrimLen <= 18 ? 'long' : 'xlong'}
      {@const secTier = secLen <= 6 ? 'short' : secLen <= 12 ? 'dense' : 'long'}
      <span
        class="interlinear-cell is-pending tier-{primTier} sec-tier-{secTier} {pendingToken.className || ''}"
        class:is-error={pendingToken.isError}
        class:has-secondary={hasSecondary}
        style="--prim-len: {primLen}; --sec-len: {secLen};"
        data-prim-len={primLen}
        title={pendingToken.errorText || undefined}
      >
        <span class="cell-top">
          <span class="cell-primary font-mono">{pendingToken.primary}{#if pendingToken.primarySub != null}<span class="cell-sub">{pendingToken.primarySub}</span>{/if}</span>
        </span>
        {#if hasSecondary}
          <span class="cell-bottom">
            <span class="cell-secondary font-mono">{pendingToken.secondary ?? ''}{#if pendingToken.secondarySub != null}<span class="cell-sub">{pendingToken.secondarySub}</span>{/if}</span>
          </span>
        {/if}
      </span>
    {/if}
  {/if}
</div>

<style>
  .interlinear-container {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    align-content: flex-start;
    gap: 6px 4px;
    width: 100%;
    user-select: text;
    -webkit-user-select: text;
    padding: 2px 0;
    box-sizing: border-box;
  }

  .interlinear-space {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 38px;
    color: var(--color-text-muted);
    opacity: 0.35;
    user-select: none;
    flex-shrink: 0;
  }

  .space-symbol {
    font-size: 13px;
    line-height: 1;
    font-family: var(--font-mono);
  }

  .interlinear-cell {
    display: inline-flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: stretch;
    min-width: 24px;
    max-width: 100%;
    height: 38px;
    padding: 0;
    border-radius: var(--radius-xs);
    background-color: var(--color-surface-1, #121212);
    border: 1px solid var(--color-border-medium, #424242);
    box-sizing: border-box;
    transition: background-color 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease;
    user-select: text;
    -webkit-user-select: text;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    flex-shrink: 0;
  }

  .interlinear-cell::-webkit-scrollbar {
    display: none;
  }

  .cell-top {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    flex: 1 1 0;
    min-height: 0;
    padding: 0 5px;
    background-color: #000000;
    border-top-left-radius: calc(var(--radius-xs) - 1px);
    border-top-right-radius: calc(var(--radius-xs) - 1px);
    border-bottom: 1px solid var(--color-border-subtle, #2e2e2e);
    box-sizing: border-box;
    white-space: nowrap;
  }

  .interlinear-cell:not(.has-secondary) .cell-top {
    border-bottom: none;
    border-bottom-left-radius: calc(var(--radius-xs) - 1px);
    border-bottom-right-radius: calc(var(--radius-xs) - 1px);
    height: 100%;
  }

  .cell-bottom {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    flex: 0 0 13px;
    padding: 0 5px;
    background-color: var(--color-surface-1, #121212);
    border-bottom-left-radius: calc(var(--radius-xs) - 1px);
    border-bottom-right-radius: calc(var(--radius-xs) - 1px);
    box-sizing: border-box;
    white-space: nowrap;
  }

  .cell-primary {
    display: inline-flex;
    align-items: baseline;
    justify-content: center;
    font-size: 21.5px;
    font-weight: 700;
    line-height: 1;
    color: var(--color-text-primary);
    text-align: center;
    letter-spacing: -0.3px;
    white-space: nowrap;
  }

  .cell-secondary {
    display: inline-flex;
    align-items: baseline;
    justify-content: center;
    font-size: 11.5px;
    font-weight: 500;
    line-height: 1;
    color: var(--color-text-secondary);
    opacity: 0.85;
    text-align: center;
    letter-spacing: -0.2px;
    white-space: nowrap;
  }

  .cell-sub {
    font-size: 0.6em;
    font-weight: 600;
    line-height: 1;
    color: inherit;
    opacity: 0.78;
    margin-left: 1.5px;
    transform: translateY(0.18em);
    letter-spacing: -0.3px;
    white-space: nowrap;
    user-select: text;
  }

  .cell-secondary .cell-sub {
    font-size: 0.72em;
    opacity: 0.75;
    transform: translateY(0.14em);
    margin-left: 1px;
  }

  /* Adaptive length tiers for cell-primary */
  .tier-short .cell-primary {
    font-size: 21.5px;
  }

  .tier-medium .cell-primary {
    font-size: 17px;
    letter-spacing: -0.2px;
  }

  .tier-dense .cell-primary {
    font-size: 14.5px;
    letter-spacing: -0.3px;
  }

  .tier-long .cell-primary {
    font-size: 12px;
    letter-spacing: -0.4px;
  }

  .tier-xlong .cell-primary {
    font-size: 10px;
    letter-spacing: -0.5px;
    font-weight: 800;
  }

  /* Adaptive length tiers for cell-secondary (governed strictly by secondary length) */
  .sec-tier-dense .cell-secondary {
    font-size: 10px;
  }
  .sec-tier-long .cell-secondary {
    font-size: 9px;
    letter-spacing: -0.3px;
  }

  /* Pending (active buffer) cell */
  .interlinear-cell.is-pending {
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 8px var(--color-accent-primary-glow);
  }

  .interlinear-cell.is-pending .cell-top {
    background-color: #000000;
    border-bottom-color: rgba(0, 210, 255, 0.25);
  }

  .interlinear-cell.is-pending .cell-bottom {
    background-color: var(--color-accent-primary-subtle);
  }

  .interlinear-cell.is-pending .cell-primary,
  .interlinear-cell.is-pending .cell-secondary {
    color: var(--color-accent-primary);
    opacity: 1;
  }

  /* Error cell */
  .interlinear-cell.is-error {
    border-color: var(--color-accent-danger);
  }

  .interlinear-cell.is-error .cell-top {
    background-color: #000000;
    border-bottom-color: rgba(239, 68, 68, 0.25);
  }

  .interlinear-cell.is-error .cell-bottom {
    background-color: var(--color-accent-danger-subtle);
  }

  .interlinear-cell.is-error .cell-primary {
    color: var(--color-accent-danger);
  }

  .interlinear-cell.is-error .cell-secondary {
    color: var(--color-accent-danger);
    opacity: 0.85;
  }

  /* Sizing variants */
  .size-sm .interlinear-cell {
    min-width: 20px;
    height: 32px;
  }
  .size-sm .interlinear-space {
    height: 32px;
  }
  .size-sm .cell-bottom {
    flex: 0 0 11px;
  }
  .size-sm .cell-primary {
    font-size: 18px;
  }
  .size-sm .cell-secondary {
    font-size: 10px;
  }

  .size-lg .interlinear-cell {
    min-width: 28px;
    height: 44px;
  }
  .size-lg .interlinear-space {
    height: 44px;
  }
  .size-lg .cell-bottom {
    flex: 0 0 15px;
  }
  .size-lg .cell-primary {
    font-size: 26.5px;
  }
  .size-lg .cell-secondary {
    font-size: 12.5px;
  }

  /* Special tokens (Morse Stop and Space) */
  .interlinear-cell.token-stop .cell-primary {
    color: var(--color-accent-warning, #f59e0b);
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.5px;
  }
  .interlinear-cell.token-stop .cell-secondary {
    color: var(--color-accent-warning, #f59e0b);
    opacity: 0.75;
    font-weight: 700;
  }

  .interlinear-cell.token-space {
    opacity: 0.85;
  }
  .interlinear-cell.token-space .cell-primary {
    color: var(--color-text-muted);
    font-size: 17px;
    opacity: 0.7;
  }
  .interlinear-cell.token-space .cell-secondary {
    opacity: 0.5;
  }
</style>
