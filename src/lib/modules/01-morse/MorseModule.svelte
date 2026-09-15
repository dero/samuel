<script lang="ts">
  import { tick } from 'svelte';
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import MorseReference from './MorseReference.svelte';
  import SlideToAction from '../../components/ui/SlideToAction.svelte';
  import BackspaceButton from '../../components/ui/BackspaceButton.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import DominantButton from '../../components/ui/DominantButton.svelte';
  import BottomSheet from '../../components/ui/BottomSheet.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import Badge from '../../components/ui/Badge.svelte';
  import {
    decodeMorse,
    normalizeMorse,
    getPermutations,
    type BruteforceCandidate,
    type PermutationResult
  } from './morseSolver';
  import { morseService } from './morseService.svelte';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import { localSettingsService } from '../../services/localSettingsService';
  import { copyToClipboard } from '../../utils/clipboard';
  import { ArrowsLeftRight, Lightning } from 'phosphor-svelte';

  const modSettings = localSettingsService.forModule('morse');

  let inputMorse = $state<string>(modSettings.getString('input', ''));
  let parseCH = $state<boolean>(modSettings.getBoolean('parse_ch', true));
  let parseDigits = $state<boolean>(modSettings.getBoolean('parse_digits', true));
  let parseOther = $state<boolean>(modSettings.getBoolean('parse_other', true));

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
  let cleanMorse = $derived(inputMorse.replace(/[^.-]/g, ''));
  let isEligibleForBruteforce = $derived(cleanMorse.length >= 4);

  // Consolidated persistence
  $effect(() => {
    modSettings.setString('input', inputMorse);
    modSettings.setBoolean('parse_ch', parseCH);
    modSettings.setBoolean('parse_digits', parseDigits);
    modSettings.setBoolean('parse_other', parseOther);
  });

  async function autoScrollTextarea() {
    await tick();
    if (textareaEl) {
      textareaEl.scrollTop = textareaEl.scrollHeight;
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
    settings.vibrate(30);
    inputMorse = '';
    bruteforceResults = [];
    totalFoundCandidates = 0;
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

    // Yield to let browser render bottom sheet & spinner before heavy computation
    await new Promise((resolve) => setTimeout(resolve, 30));

    try {
      const res = await morseService.solveWithoutSpaces(cleanMorse, 50);
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
    copyToClipboard(candidate.text, `Použito řešení: ${candidate.text}`);
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
    <TranslationCard text={decodedText} />
  {/snippet}

  {#snippet input()}
    <div class="keypad-zone">
      <!-- Small Floating Action Buttons above Textarea -->
      <div class="morse-floating-toolbar">
        <button
          type="button"
          class="floating-btn"
          class:active={isPermutationsOpen}
          onclick={openPermutations}
          title="Zobrazit permutace a zrcadlení kódu"
        >
          <span class="floating-icon"><ArrowsLeftRight size={15} weight="bold" /></span>
          <span>Permutace</span>
        </button>

        {#if isEligibleForBruteforce}
          <button
            type="button"
            class="floating-btn bruteforce-btn"
            class:active={isBruteforceOpen}
            onclick={runBruteforce}
            title="Rozluštit morseovku bez mezer pomocí slovníku a jazykového modelu"
          >
            <span class="floating-icon"><Lightning size={15} weight="duotone" /></span>
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
          ariaLabel="Vymazat celý kód tažením"
        />

        <BackspaceButton
          disabled={!inputMorse}
          title="Smazat poslední znak nebo oddělovač"
          onAction={handleBackspace}
        />
      </div>

      <!-- Big dominant keys: Tečka, Čárka, Oddělovač -->
      <div class="keypad-dominant-3col">
        <DominantButton
          symbol="•"
          name="Tečka"
          variant="accent"
          onClick={() => appendSymbol('.')}
        />

        <DominantButton
          symbol="—"
          name="Čárka"
          variant="warning"
          onClick={() => appendSymbol('-')}
        />

        <DominantButton
          symbol="/"
          name="Oddělovač"
          variant="secondary"
          onClick={appendSlash}
        />
      </div>
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <OptionRow
      label="Rozpoznávat písmeno CH (----)"
      checked={parseCH}
      onChange={(v) => (parseCH = v)}
    />
    <OptionRow
      label="Rozpoznávat číslice (0–9)"
      checked={parseDigits}
      onChange={(v) => (parseDigits = v)}
    />
    <OptionRow
      label="Rozpoznávat ostatní znaky (.,?!...)"
      checked={parseOther}
      onChange={(v) => (parseOther = v)}
    />
  {/snippet}

  {#snippet reference()}
    <MorseReference />
  {/snippet}
</ModuleShell>

<!-- Permutations Bottom Sheet -->
<BottomSheet
  open={isPermutationsOpen}
  title="Permutace symbolů"
  icon={ArrowsLeftRight}
  badge={permutations.length > 0 ? `${permutations.length} variant` : undefined}
  onClose={() => (isPermutationsOpen = false)}
>
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
          <button type="button" class="perm-apply-btn" onclick={() => applyPermutation(perm)}>
            Použít
          </button>
        </div>
      {/each}
    </div>
  {/if}
</BottomSheet>

<!-- Bruteforce Results Bottom Sheet -->
<BottomSheet
  open={isBruteforceOpen}
  title="Řešení bez mezer"
  icon={Lightning}
  badge={bruteforceResults.length > 0 ? `${bruteforceResults.length}${totalFoundCandidates > bruteforceResults.length ? ` z ${totalFoundCandidates}` : ''}` : undefined}
  onClose={() => (isBruteforceOpen = false)}
>
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
          type="button"
          class="candidate-item"
          class:top-rank={idx === 0}
          onclick={() => applyCandidate(cand)}
        >
          <div class="cand-info">
            <span class="cand-text">{cand.text}</span>
            <span class="cand-morse">{cand.spacedMorse}</span>
          </div>
          <Badge variant={idx === 0 ? 'success' : 'accent'} size="md">
            {cand.score}%
          </Badge>
        </button>
      {/each}

      {#if totalFoundCandidates > bruteforceResults.length}
        <div class="more-info-banner">
          Zobrazeno top {bruteforceResults.length} z celkem {totalFoundCandidates} nalezených variant. Dalších {totalFoundCandidates - bruteforceResults.length} možností s nižším skóre se nezobrazuje.
        </div>
      {/if}
    </div>
  {/if}
</BottomSheet>

<style>
  /* Keypad Zone */
  .keypad-zone {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    width: 100%;
  }

  /* Floating Toolbar above Textarea */
  .morse-floating-toolbar {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: 0 var(--space-2xs);
  }

  .floating-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-full);
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-secondary);
    transition: background-color 0.12s ease, border-color 0.12s ease, transform 0.06s ease;
    box-shadow: var(--shadow-sm);
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
    background-color: var(--color-accent-warning-subtle);
  }

  .floating-btn.bruteforce-btn:active {
    background-color: rgba(245, 158, 11, 0.25);
  }

  .floating-icon {
    font-size: 13px;
    display: flex;
    align-items: center;
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
    padding: 10px var(--space-md);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    font-family: var(--font-mono);
    font-size: var(--text-lg);
    font-weight: 700;
    line-height: 1.35;
    letter-spacing: 1.5px;
    color: var(--color-text-primary);
    resize: none;
    overflow-y: auto;
    word-break: break-all;
    white-space: pre-wrap;
    outline: none;
    transition: border-color 0.15s ease;
    box-sizing: border-box;
  }

  .morse-textarea:focus {
    border-color: var(--color-border-focus);
  }

  .morse-textarea::placeholder {
    color: var(--color-text-muted);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: 400;
    letter-spacing: normal;
  }

  .empty-state, .loading-state {
    text-align: center;
    padding: var(--space-2xl) var(--space-md);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
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
    transition: background-color 0.12s ease, border-color 0.12s ease;
    width: 100%;
  }

  .candidate-item:active {
    background-color: var(--color-surface-active);
  }

  .candidate-item.top-rank {
    border-color: var(--color-accent-success);
    background-color: var(--color-accent-success-subtle);
  }

  .cand-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
  }

  .cand-text {
    font-family: var(--font-mono);
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .candidate-item.top-rank .cand-text {
    color: var(--color-accent-success);
  }

  .cand-morse {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    letter-spacing: 1px;
  }

  .more-info-banner {
    padding: 10px 14px;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-align: center;
    background-color: var(--color-surface-2);
    border-radius: var(--radius-sm);
    border: 1px dashed var(--color-border-subtle);
    margin-top: 4px;
    line-height: 1.4;
  }

  /* Permutations list */
  .perms-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .perm-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    gap: var(--space-md);
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
    gap: var(--space-sm);
    flex-wrap: wrap;
  }

  .perm-name {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .perm-mapping {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .perm-decoded {
    font-family: var(--font-mono);
    font-size: var(--text-base);
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
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-primary);
    flex-shrink: 0;
    transition: background-color 0.12s ease;
  }

  .perm-apply-btn:active {
    background-color: var(--color-accent-primary);
    color: #000000;
  }
</style>
