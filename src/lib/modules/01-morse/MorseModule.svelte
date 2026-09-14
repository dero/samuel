<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import MorseReference from './MorseReference.svelte';
  import SlideToAction from '../../components/ui/SlideToAction.svelte';
  import {
    decodeMorse,
    normalizeMorse,
    getPermutations,
    type BruteforceCandidate,
    type PermutationResult
  } from './morseSolver';
  import { morseService } from './morseService.svelte';
  import { settings } from '../../state/settings.svelte';
  import { copyToClipboard } from '../../utils/clipboard';
  import { toast } from '../../state/toast.svelte';
  import { STORAGE_KEYS } from '../../constants';

  // Persistence keys
  const STORAGE_KEY_INPUT = `${STORAGE_KEYS.SETTINGS}_morse_input`;
  const STORAGE_KEY_CH = `${STORAGE_KEYS.SETTINGS}_morse_parse_ch`;
  const STORAGE_KEY_DIGITS = `${STORAGE_KEYS.SETTINGS}_morse_parse_digits`;
  const STORAGE_KEY_OTHER = `${STORAGE_KEYS.SETTINGS}_morse_parse_other`;

  let inputMorse = $state<string>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_INPUT) || '' : ''
  );
  let parseCH = $state<boolean>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_CH) !== 'false' : true
  );
  let parseDigits = $state<boolean>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_DIGITS) !== 'false' : true
  );
  let parseOther = $state<boolean>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_OTHER) !== 'false' : true
  );

  let isPermutationsOpen = $state(false);
  let bruteforceResults = $state<BruteforceCandidate[]>([]);
  let totalFoundCandidates = $state<number>(0);
  let isBruteforceOpen = $state(false);
  let isSolving = $state(false);
  let textareaEl = $state<HTMLTextAreaElement | null>(null);

  // Derived decoding & metadata
  let decodedText = $derived(decodeMorse(inputMorse, { parseCH, parseDigits, parseOther }));
  let permutations = $derived(
    isPermutationsOpen ? getPermutations(inputMorse, { parseCH, parseDigits, parseOther }) : []
  );
  let charCount = $derived(decodedText.replace(/\s+/g, '').length);
  let wordCount = $derived(decodedText.trim() ? decodedText.trim().split(/\s+/).length : 0);
  let cleanMorse = $derived(inputMorse.replace(/[^.-]/g, ''));
  let isEligibleForBruteforce = $derived(cleanMorse.length >= 4);

  // Auto-save input
  $effect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_INPUT, inputMorse);
    }
  });

  // Auto-save parseCH
  $effect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_CH, String(parseCH));
    }
  });

  // Auto-save parseDigits
  $effect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_DIGITS, String(parseDigits));
    }
  });

  // Auto-save parseOther
  $effect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_OTHER, String(parseOther));
    }
  });

  function autoScrollTextarea() {
    if (textareaEl) {
      setTimeout(() => {
        if (textareaEl) {
          textareaEl.scrollTop = textareaEl.scrollHeight;
        }
      }, 0);
    }
  }

  function appendSymbol(sym: '.' | '-') {
    settings.vibrate(20);
    inputMorse += sym;
    autoScrollTextarea();
  }

  function appendSlash() {
    settings.vibrate(20);
    const trimmed = inputMorse.trimEnd();
    if (trimmed.endsWith('//')) {
      return;
    } else if (trimmed.endsWith('/')) {
      // Turn single separator into double separator (word boundary)
      inputMorse = trimmed + '/ ';
    } else if (trimmed.length > 0) {
      inputMorse = trimmed + ' / ';
    }
    autoScrollTextarea();
  }

  function handleBackspace() {
    settings.vibrate(25);
    if (!inputMorse) return;

    if (inputMorse.endsWith(' // ')) {
      inputMorse = inputMorse.slice(0, -4);
    } else if (inputMorse.endsWith(' / ')) {
      inputMorse = inputMorse.slice(0, -3);
    } else {
      inputMorse = inputMorse.slice(0, -1);
    }
    autoScrollTextarea();
  }

  function handleClear() {
    const prevMorse = inputMorse;
    settings.vibrate(30);
    inputMorse = '';
    bruteforceResults = [];
    totalFoundCandidates = 0;
    toast.show('Zadání vymazáno', {
      type: 'info',
      undoAction: () => {
        inputMorse = prevMorse;
      },
      undoLabel: 'Vrátit zpět'
    });
    autoScrollTextarea();
  }

  function openPermutations() {
    settings.vibrate(20);
    isBruteforceOpen = false;
    isPermutationsOpen = true;
  }

  async function runBruteforce() {
    if (!isEligibleForBruteforce) return;
    isPermutationsOpen = false;
    isSolving = true;
    isBruteforceOpen = true;

    try {
      const target = cleanMorse.length >= 4 ? cleanMorse : inputMorse.trim();
      const res = await morseService.solveWithoutSpaces(target, 50);
      bruteforceResults = res.candidates;
      totalFoundCandidates = res.totalFound;
      if (bruteforceResults.length > 0) {
        settings.vibrate([30, 40, 30]);
        toast.show(
          `Nalezeno ${totalFoundCandidates} možností (zobrazeno top ${bruteforceResults.length})`,
          'success'
        );
      } else {
        toast.show('Žádný smysluplný rozpad nenalezen', 'warning');
      }
    } catch (err: any) {
      console.error('Bruteforce solve error:', err);
      toast.show('Chyba při řešení morseovky', 'danger');
    } finally {
      isSolving = false;
    }
  }

  async function handleCopy() {
    if (!decodedText.trim()) return;
    await copyToClipboard(decodedText);
  }

  function applyPermutation(perm: PermutationResult) {
    settings.vibrate(25);
    inputMorse = perm.transformedMorse;
    isPermutationsOpen = false;
    toast.show(`Aplikována varianta: ${perm.name}`, 'info');
    autoScrollTextarea();
  }

  function applyCandidate(candidate: BruteforceCandidate) {
    settings.vibrate(25);
    inputMorse = candidate.spacedMorse;
    isBruteforceOpen = false;
    copyToClipboard(candidate.text);
    toast.show(`Použito řešení: ${candidate.text}`, 'success');
    autoScrollTextarea();
  }

  function handleReset() {
    handleClear();
    isBruteforceOpen = false;
    isPermutationsOpen = false;
    toast.show('Morseovka byla vyčištěna', 'info');
  }

  function handlePaste(text: string) {
    const normalized = normalizeMorse(text);
    if (normalized) {
      inputMorse = normalized;
      toast.show('Kód vložen ze schránky', 'success');
      autoScrollTextarea();
    }
  }
</script>

<ModuleShell onReset={handleReset} onPaste={handlePaste}>
  {#snippet output()}
    <div class="output-container">
      <!-- Decoded Text Card (1-tap copy) -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="result-card"
        class:is-clickable={decodedText.trim().length > 0}
        onclick={handleCopy}
        title="Klepnutím zkopírujete do schránky"
      >
        <div class="result-header">
          <span class="result-label">PŘEKLAD</span>
          <div class="result-badges">
            {#if charCount > 0}
              <span class="badge">{charCount} {charCount === 1 ? 'znak' : charCount < 5 ? 'znaky' : 'znaků'}</span>
              <span class="badge">{wordCount} {wordCount === 1 ? 'slovo' : wordCount < 5 ? 'slova' : 'slov'}</span>
            {/if}
            {#if decodedText.trim().length > 0}
              <span class="copy-hint">📋 Kopírovat</span>
            {/if}
          </div>
        </div>

        <div class="result-text" class:empty={!decodedText.trim()}>
          {decodedText || 'Zde se zobrazí přeložený text...'}
        </div>
      </div>
    </div>
  {/snippet}

  {#snippet input()}
    <div class="keypad-zone">
      <!-- Small Floating Action Buttons above Textarea -->
      <div class="morse-floating-toolbar">
        <button
          class="floating-btn"
          class:active={isPermutationsOpen}
          onclick={openPermutations}
          title="Zobrazit permutace a zrcadlení kódu"
        >
          <span class="floating-icon">⇄</span>
          <span>Permutace</span>
        </button>

        {#if isEligibleForBruteforce}
          <button
            class="floating-btn bruteforce-btn"
            class:active={isBruteforceOpen}
            onclick={runBruteforce}
            title="Rozluštit morseovku bez mezer pomocí slovníku a jazykového modelu"
          >
            <span class="floating-icon">⚡</span>
            <span>Vyřešit bez mezer</span>
          </button>
        {/if}
      </div>

      <!-- 4-line Input Textarea with vertical scrolling -->
      <div class="morse-textarea-container">
        <textarea
          bind:this={textareaEl}
          bind:value={inputMorse}
          rows={4}
          class="morse-textarea"
          placeholder="Zadávejte tečky, čárky a oddělovače..."
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
        ></textarea>
      </div>

      <!-- Utility Row: Slide to Clear and Backspace -->
      <div class="keypad-utility-row">
        <SlideToAction
          disabled={!inputMorse}
          onAction={handleClear}
          label="Vymazat"
          icon="🗑️"
          ariaLabel="Vymazat celý kód tažením"
        />

        <button
          class="utility-btn backspace-btn"
          disabled={!inputMorse}
          onclick={handleBackspace}
          title="Smazat poslední znak nebo oddělovač"
        >
          <span class="btn-icon">⌫</span>
          <span class="btn-label">Backspace</span>
        </button>
      </div>

      <!-- Big dominant keys: Tečka, Čárka, Oddělovač -->
      <div class="keypad-dominant">
        <button
          class="key-btn key-dot"
          onclick={() => appendSymbol('.')}
        >
          <span class="key-symbol">•</span>
          <span class="key-name">Tečka</span>
        </button>

        <button
          class="key-btn key-dash"
          onclick={() => appendSymbol('-')}
        >
          <span class="key-symbol">—</span>
          <span class="key-name">Čárka</span>
        </button>

        <button
          class="key-btn key-slash"
          onclick={appendSlash}
        >
          <span class="key-symbol">/</span>
          <span class="key-name">Oddělovač</span>
        </button>
      </div>
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <div class="menu-option">
      <label class="checkbox-label">
        <input type="checkbox" bind:checked={parseCH} />
        <span class="label-text">Rozpoznávat písmeno CH (----)</span>
      </label>
    </div>
    <div class="menu-option">
      <label class="checkbox-label">
        <input type="checkbox" bind:checked={parseDigits} />
        <span class="label-text">Rozpoznávat číslice (0–9)</span>
      </label>
    </div>
    <div class="menu-option">
      <label class="checkbox-label">
        <input type="checkbox" bind:checked={parseOther} />
        <span class="label-text">Rozpoznávat ostatní znaky (.,?!...)</span>
      </label>
    </div>
  {/snippet}

  {#snippet reference()}
    <MorseReference />
  {/snippet}
</ModuleShell>

<!-- Permutations Bottom Sheet Overlay -->
{#if isPermutationsOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="sheet-backdrop" onclick={() => (isPermutationsOpen = false)}>
    <div class="sheet-panel" onclick={(e) => e.stopPropagation()}>
      <div class="sheet-header">
        <span class="sheet-title">
          <span>⇄ Permutace symbolů</span>
          {#if permutations.length > 0}
            <span class="badge">{permutations.length} variant</span>
          {/if}
        </span>
        <button class="sheet-close-btn" onclick={() => (isPermutationsOpen = false)}>✕</button>
      </div>

      <div class="sheet-body">
        {#if permutations.length === 0}
          <div class="empty-state">Zadejte morseův kód pro zobrazení permutací.</div>
        {:else}
          <div class="perms-list">
            {#each permutations as perm}
              <div class="perm-card" class:is-valid={perm.isValid}>
                <div class="perm-info">
                  <div class="perm-name-row">
                    <span class="perm-name">{perm.name}</span>
                    <span class="perm-mapping">{perm.mapping}</span>
                  </div>
                  <span class="perm-decoded">{perm.decodedText || '(prázdné)'}</span>
                </div>
                <button class="perm-apply-btn" onclick={() => applyPermutation(perm)}>
                  Použít
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Bruteforce Results Bottom Sheet Overlay -->
{#if isBruteforceOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="sheet-backdrop" onclick={() => (isBruteforceOpen = false)}>
    <div class="sheet-panel" onclick={(e) => e.stopPropagation()}>
      <div class="sheet-header">
        <span class="sheet-title">
          <span>⚡ Řešení bez mezer</span>
          {#if bruteforceResults.length > 0}
            <span class="badge">{bruteforceResults.length}{totalFoundCandidates > bruteforceResults.length ? ` z ${totalFoundCandidates}` : ''}</span>
          {/if}
        </span>
        <button class="sheet-close-btn" onclick={() => (isBruteforceOpen = false)}>✕</button>
      </div>

      <div class="sheet-body">
        {#if isSolving}
          <div class="loading-state">
            <div class="loading-spinner"></div>
            <span>Prohledávám strom možností a slovník...</span>
          </div>
        {:else if bruteforceResults.length === 0}
          <div class="empty-state">Nenalezeny žádné smysluplné kombinace slov.</div>
        {:else}
          <div class="candidates-list">
            {#each bruteforceResults as cand, idx}
              <button
                class="candidate-item"
                class:top-rank={idx === 0}
                onclick={() => applyCandidate(cand)}
              >
                <div class="cand-info">
                  <span class="cand-text">{cand.text}</span>
                  <span class="cand-morse">{cand.spacedMorse}</span>
                </div>
                <span class="cand-score">{cand.score}%</span>
              </button>
            {/each}

            {#if totalFoundCandidates > bruteforceResults.length}
              <div class="more-info-banner">
                Zobrazeno top {bruteforceResults.length} z celkem {totalFoundCandidates} nalezených variant. Dalších {totalFoundCandidates - bruteforceResults.length} možností s nižším skóre se nezobrazuje.
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .output-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 8px;
    overflow: hidden;
    position: relative;
  }

  /* Result Card */
  .result-card {
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-height: 80px;
    flex: 1;
    overflow: hidden;
    transition: border-color 0.15s, background-color 0.15s;
    user-select: text;
  }

  .result-card.is-clickable {
    cursor: pointer;
  }

  .result-card.is-clickable:active {
    background-color: var(--color-surface-active);
    border-color: var(--color-border-focus);
  }

  .result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .result-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-text-secondary);
    letter-spacing: 0.8px;
  }

  .result-badges {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .badge {
    font-size: 11px;
    color: var(--color-text-muted);
    background-color: var(--color-surface-2);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
  }

  .copy-hint {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-accent-primary);
  }

  .result-text {
    font-family: var(--font-mono);
    font-size: clamp(18px, 3vh, 26px);
    font-weight: 700;
    color: #ffffff;
    line-height: 1.3;
    overflow-y: auto;
    word-break: break-word;
    flex: 1;
  }

  .result-text.empty {
    color: var(--color-text-muted);
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 400;
  }

  /* Keypad Zone */
  .keypad-zone {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 6px 12px 6px 12px;
  }

  /* Floating Toolbar above Textarea */
  .morse-floating-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 2px 2px 2px;
  }

  .floating-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-secondary);
    transition: all 0.12s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  }

  .floating-btn:active {
    transform: scale(0.96);
    background-color: var(--color-surface-active);
  }

  .floating-btn.active {
    background-color: var(--color-surface-active);
    color: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
  }

  .floating-btn.bruteforce-btn {
    color: var(--color-accent-warning);
    border-color: rgba(245, 158, 11, 0.4);
    background-color: rgba(245, 158, 11, 0.12);
  }

  .floating-btn.bruteforce-btn:active {
    background-color: rgba(245, 158, 11, 0.25);
  }

  .floating-icon {
    font-size: 13px;
  }

  /* 4-line Textarea */
  .morse-textarea-container {
    width: 100%;
    display: flex;
  }

  .morse-textarea {
    width: 100%;
    height: 96px;
    min-height: 96px;
    max-height: 96px;
    padding: 10px 12px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    font-family: var(--font-mono);
    font-size: 17px;
    font-weight: 700;
    line-height: 1.35;
    letter-spacing: 1.5px;
    color: #ffffff;
    resize: none;
    overflow-y: auto;
    word-break: break-all;
    white-space: pre-wrap;
    outline: none;
    transition: border-color 0.15s;
    box-sizing: border-box;
  }

  .morse-textarea:focus {
    border-color: var(--color-border-focus);
  }

  .morse-textarea::placeholder {
    color: var(--color-text-muted);
    font-family: var(--font-sans);
    font-size: 13.5px;
    font-weight: 400;
    letter-spacing: normal;
  }

  /* Keypad Utility Row: Slide to Clear and Backspace */
  .keypad-utility-row {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 8px;
    width: 100%;
    align-items: center;
  }

  .utility-btn {
    height: 42px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background-color 0.12s, border-color 0.12s, transform 0.08s;
  }

  .utility-btn:active:not(:disabled) {
    background-color: var(--color-surface-active);
    transform: scale(0.98);
  }

  .utility-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .utility-btn.backspace-btn {
    color: var(--color-text-primary);
  }

  .btn-icon {
    font-size: 16px;
  }

  .btn-label {
    letter-spacing: 0.2px;
  }

  /* Keypad Dominant Row: Tečka, Čárka, Oddělovač */
  .keypad-dominant {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    width: 100%;
  }

  .key-btn {
    height: clamp(62px, 10vh, 84px);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    transition: background-color 0.1s, border-color 0.1s, transform 0.06s;
    user-select: none;
    -webkit-user-select: none;
  }

  .key-btn:active {
    background-color: var(--color-surface-active);
    border-color: var(--color-border-focus);
    transform: scale(0.96);
  }

  .key-symbol {
    font-family: var(--font-mono);
    font-size: clamp(26px, 4.2vh, 38px);
    font-weight: 900;
    line-height: 1;
    color: #ffffff;
  }

  .key-name {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .key-dot .key-symbol {
    color: var(--color-accent-primary);
  }

  .key-dash .key-symbol {
    color: var(--color-accent-warning);
  }

  .key-slash .key-symbol {
    color: var(--color-text-secondary);
  }

  /* Bottom Sheet Drawers (Matching ModuleMenu style) */
  .sheet-backdrop {
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
    .sheet-backdrop {
      align-items: center;
      padding: 20px;
    }
  }

  .sheet-panel {
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    width: 100%;
    max-width: 520px;
    max-height: 82vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: sheetSlideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.6);
  }

  @media (min-width: 600px) {
    .sheet-panel {
      border-radius: var(--radius-lg);
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

  .sheet-header {
    height: 52px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--color-border-subtle);
    flex-shrink: 0;
  }

  .sheet-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
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
  }

  .sheet-close-btn:active {
    color: #ffffff;
    background-color: var(--color-surface-active);
  }

  .sheet-body {
    padding: 16px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
    min-height: 0;
  }

  .empty-state, .loading-state {
    text-align: center;
    padding: 32px 16px;
    font-size: 14px;
    color: var(--color-text-muted);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .loading-spinner {
    width: 28px;
    height: 28px;
    border: 3px solid rgba(255, 255, 255, 0.15);
    border-top-color: var(--color-accent-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Candidates list */
  .candidates-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .candidate-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    text-align: left;
    transition: background-color 0.12s, border-color 0.12s;
  }

  .candidate-item:active {
    background-color: var(--color-surface-active);
  }

  .candidate-item.top-rank {
    border-color: var(--color-accent-success);
    background-color: rgba(16, 185, 129, 0.1);
  }

  .cand-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
  }

  .cand-text {
    font-family: var(--font-mono);
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
  }

  .candidate-item.top-rank .cand-text {
    color: var(--color-accent-success);
  }

  .cand-morse {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-secondary);
    letter-spacing: 1px;
  }

  .cand-score {
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 700;
    color: var(--color-accent-primary);
    flex-shrink: 0;
  }

  .more-info-banner {
    padding: 10px 14px;
    font-size: 12px;
    color: var(--color-text-muted);
    text-align: center;
    background-color: var(--color-surface-2);
    border-radius: var(--radius-sm);
    border: 1px dashed var(--color-border-subtle);
    margin-top: 4px;
    line-height: 1.4;
  }

  /* Perms list */
  .perms-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .perm-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    gap: 12px;
  }

  .perm-card.is-valid {
    border-left: 3px solid var(--color-accent-success);
  }

  .perm-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
    min-width: 0;
  }

  .perm-name-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
  }

  .perm-name {
    font-size: 13px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .perm-mapping {
    font-size: 11px;
    color: var(--color-text-muted);
  }

  .perm-decoded {
    font-family: var(--font-mono);
    font-size: 15px;
    font-weight: 700;
    color: var(--color-accent-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .perm-apply-btn {
    padding: 8px 14px;
    background-color: var(--color-surface-active);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
    flex-shrink: 0;
    transition: background-color 0.12s;
  }

  .perm-apply-btn:active {
    background-color: var(--color-accent-primary);
    color: #000000;
  }

  .menu-option {
    padding: 6px 0;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: var(--color-text-primary);
    cursor: pointer;
  }

  .checkbox-label input {
    width: 18px;
    height: 18px;
    accent-color: var(--color-accent-primary);
  }
</style>
