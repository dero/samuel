<script lang="ts">
  import { onDestroy, tick } from 'svelte';
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import MorseReference from './MorseReference.svelte';
  import TelegraphWire, { type PulseEvent } from './TelegraphWire.svelte';
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
  let showTelegraphWire = $state<boolean>(modSettings.getBoolean('show_wire', true));

  let currentPulse = $state<PulseEvent | null>(null);
  let pulseCounter = 0;

  function sendPulse(type: '.' | '-' | '/') {
    pulseCounter++;
    currentPulse = { type, id: pulseCounter };
  }

  let isPermutationsOpen = $state(false);
  let bruteforceResults = $state<BruteforceCandidate[]>([]);
  let totalFoundCandidates = $state<number>(0);
  let isBruteforceOpen = $state(false);
  let isSolving = $state(false);

  // Derived committed vs pending letter
  const lastSlashIndex = $derived.by(() => {
    return Math.max(inputMorse.lastIndexOf(' / '), inputMorse.lastIndexOf(' // '));
  });

  const committedPart = $derived.by(() => {
    if (lastSlashIndex === -1) {
      return '';
    }
    const isDouble = inputMorse.substring(lastSlashIndex).startsWith(' // ');
    const sepLen = isDouble ? 4 : 3;
    return inputMorse.substring(0, lastSlashIndex + sepLen);
  });

  const pendingMorse = $derived.by(() => {
    if (lastSlashIndex === -1) {
      return inputMorse.trim();
    }
    const isDouble = inputMorse.substring(lastSlashIndex).startsWith(' // ');
    const sepLen = isDouble ? 4 : 3;
    return inputMorse.substring(lastSlashIndex + sepLen).trim();
  });

  const committedText = $derived(
    committedPart ? decodeMorse(committedPart, { parseCH, parseDigits, parseOther }) : ''
  );

  const pendingDisplay = $derived.by(() => {
    if (!pendingMorse) return '';
    const decodedPending = decodeMorse(pendingMorse, { parseCH, parseDigits, parseOther });
    return decodedPending !== '?' ? decodedPending : pendingMorse;
  });

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
    modSettings.setBoolean('show_wire', showTelegraphWire);
  });

  function appendSymbol(sym: '.' | '-') {
    sendPulse(sym);
    inputMorse += sym;
  }

  function appendSlash() {
    sendPulse('/');
    const trimmed = inputMorse.trimEnd();
    if (trimmed.endsWith('//')) {
      return;
    } else if (trimmed.endsWith('/')) {
      inputMorse = trimmed + '/ ';
    } else if (trimmed.length > 0) {
      inputMorse = trimmed + ' / ';
    }
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
  }

  function handleClear() {
    settings.vibrate(30);
    inputMorse = '';
    bruteforceResults = [];
    totalFoundCandidates = 0;
  }

  function openPermutations() {
    settings.vibrate(20);
    isBruteforceOpen = false;
    isPermutationsOpen = true;
  }

  onDestroy(() => {
    morseService.terminate();
  });

  async function runBruteforce() {
    if (!isEligibleForBruteforce) return;
    isPermutationsOpen = false;
    isSolving = true;
    isBruteforceOpen = true;

    try {
      const res = await morseService.solveWithoutSpaces(cleanMorse, 50);
      bruteforceResults = res.candidates;
      totalFoundCandidates = res.totalFound;
      if (bruteforceResults.length > 0) {
        toast.show(`Nalezeno ${totalFoundCandidates} možností`, 'success');
      } else {
        toast.show('Žádný rozpad nenalezen', 'warning');
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
    toast.show(`Varianta: ${perm.name}`, 'info');
  }

  function applyCandidate(candidate: BruteforceCandidate) {
    settings.vibrate(25);
    inputMorse = candidate.spacedMorse;
    isBruteforceOpen = false;
    copyToClipboard(candidate.text, 'Řešení vloženo');
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
    }
  }
</script>

<ModuleShell onReset={handleReset} onPaste={handlePaste}>
  {#snippet output()}
    <div class="morse-output-container">
      <TranslationCard text={committedText} pendingText={pendingDisplay} />
      {#if inputMorse.length > 0}
        <div class="morse-floating-bar">
          <button
            type="button"
            class="morse-chip-btn"
            class:active={isPermutationsOpen}
            onclick={openPermutations}
            title="Zobrazit permutace a zrcadlení kódu"
          >
            <span class="floating-icon"><ArrowsLeftRight size={14} weight="bold" /></span>
            <span>Permutace</span>
          </button>

          {#if isEligibleForBruteforce}
            <button
              type="button"
              class="morse-chip-btn bruteforce-chip"
              class:active={isBruteforceOpen}
              onclick={runBruteforce}
              title="Rozluštit morseovku bez mezer pomocí slovníku a jazykového modelu"
            >
              <span class="floating-icon"><Lightning size={14} weight="duotone" /></span>
              <span>Vyřešit bez mezer</span>
            </button>
          {/if}
        </div>
      {/if}
    </div>
  {/snippet}

  {#snippet input()}
    <div class="keypad-zone" class:no-wire={!showTelegraphWire}>
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

      <!-- Animated Telegraph Wire Decoration & Easter Egg -->
      {#if showTelegraphWire}
        <TelegraphWire pulse={currentPulse} />
      {/if}
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <OptionRow
      label="Zobrazovat telegrafní vedení"
      hint="Animované sloupy s drátem a světelnými impulsy pod tlačítky"
      type="switch"
      checked={showTelegraphWire}
      onChange={(v) => (showTelegraphWire = v)}
    />
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

  /* Morse Output Container & Floating Action Bar */
  .morse-output-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .morse-floating-bar {
    position: absolute;
    bottom: var(--space-xs);
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    background: rgba(22, 24, 32, 0.94);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--color-border-medium);
    border-radius: var(--radius-full);
    padding: 4px 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.15);
    animation: morseFloatIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes morseFloatIn {
    from {
      opacity: 0;
      transform: translate(-50%, 6px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }

  .morse-chip-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-full);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: background-color 0.12s ease, color 0.12s ease;
    white-space: nowrap;
  }

  .morse-chip-btn:active,
  .morse-chip-btn.active {
    background-color: var(--color-surface-active);
    color: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
  }

  .morse-chip-btn.bruteforce-chip {
    color: var(--color-accent-warning);
    border-color: rgba(245, 158, 11, 0.4);
    background-color: var(--color-accent-warning-subtle);
  }

  .morse-chip-btn.bruteforce-chip:active,
  .morse-chip-btn.bruteforce-chip.active {
    background-color: rgba(245, 158, 11, 0.3);
  }

  .floating-icon {
    font-size: var(--text-sm);
    display: flex;
    align-items: center;
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
