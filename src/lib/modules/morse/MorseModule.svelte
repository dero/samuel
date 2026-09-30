<script lang="ts">
  import { onMount, tick } from 'svelte';
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
  import InterlinearText, { type InterlinearToken } from '../../components/ui/InterlinearText.svelte';
  import {
    decodeMorse,
    decodeMorseLetter,
    isMorsePrefix,
    normalizeMorse,
    getPermutations,
    type BruteforceCandidate,
    type PermutationResult
  } from './morseSolver';
  import { morseService } from './morseService.svelte';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import { versionService } from '../../services/versionService.svelte';
  import { navigation } from '../../state/navigation.svelte';
  import { copyToClipboard } from '../../utils/clipboard';
  import { ArrowsLeftRight, Lightning } from 'phosphor-svelte';
  import { createModuleState } from '../../state/moduleState.svelte';

  const { state: modState, reset: resetModState } = createModuleState('morse', {
    input: '',
    parse_ch: true,
    parse_digits: true,
    parse_other: true,
    show_wire: true
  });

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
  const morseOptions = $derived({
    parseCH: modState.parse_ch,
    parseDigits: modState.parse_digits,
    parseOther: modState.parse_other
  });

  const parsedMorse = $derived.by(() => {
    const raw = modState.input;
    if (!raw.trim()) {
      return { tokens: [] as InterlinearToken[], pending: null as InterlinearToken | null };
    }

    const parts = raw.trim().split(/\s+/).filter(Boolean);
    const tokens: InterlinearToken[] = [];
    let pending: InterlinearToken | null = null;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      // 1. STOP token (///)
      if (part === '///' || part.startsWith('///')) {
        const prev = tokens.at(-1);
        if (prev && prev.secondary && prev.secondary.endsWith('/')) {
          prev.secondary = prev.secondary.slice(0, -1);
        }
        tokens.push({
          primary: 'STOP',
          secondary: '///',
          className: 'token-stop'
        });
        continue;
      }

      // 2. Space token (//)
      if (part === '//' || part.startsWith('//')) {
        const prev = tokens.at(-1);
        if (prev && prev.secondary && prev.secondary.endsWith('/')) {
          prev.secondary = prev.secondary.slice(0, -1);
        }
        tokens.push({
          primary: '␣',
          secondary: '//',
          className: 'token-space'
        });
        continue;
      }

      // 3. Committed letter (ends with /)
      if (part.endsWith('/')) {
        const code = part.replace(/\/+$/, '');
        if (!code) continue;
        const char = decodeMorseLetter(code, morseOptions);
        const isError = char === '?';
        tokens.push({
          primary: char,
          secondary: `${code}/`,
          isError,
          errorText: isError ? `Neznámý kód „${code}“` : undefined
        });
        continue;
      }

      // 4. Pending dots/dashes
      if (isLast) {
        const char = decodeMorseLetter(part, morseOptions);
        if (char !== '?') {
          pending = {
            primary: char,
            secondary: part,
            isPending: true
          };
        } else {
          const isPrefix = isMorsePrefix(part, morseOptions);
          pending = {
            primary: isPrefix ? '…' : '?',
            secondary: part,
            isPending: true,
            isError: !isPrefix,
            errorText: !isPrefix ? `Neznámý kód „${part}“` : undefined
          };
        }
      } else {
        // Non-last part without slash: treat as letter
        const char = decodeMorseLetter(part, morseOptions);
        const isError = char === '?';
        tokens.push({
          primary: char,
          secondary: `${part}/`,
          isError,
          errorText: isError ? `Neznámý kód „${part}“` : undefined
        });
      }
    }

    return { tokens, pending };
  });

  const interlinearTokens = $derived(parsedMorse.tokens);
  const pendingInterlinearToken = $derived(parsedMorse.pending);

  const plainTextOutput = $derived.by(() => {
    let result = '';
    for (const tok of interlinearTokens) {
      if (tok.primary === '␣') {
        if (!result.endsWith(' ')) {
          result += ' ';
        }
      } else if (tok.primary === 'STOP') {
        if (result.length > 0 && !result.endsWith(' ')) {
          result += ' ';
        }
        result += 'STOP';
      } else {
        result += tok.primary;
      }
    }
    return result;
  });

  let permutations = $derived(
    isPermutationsOpen ? getPermutations(modState.input, morseOptions) : []
  );
  let cleanMorse = $derived(modState.input.replace(/[^.-]/g, ''));
  let isEligibleForBruteforce = $derived(cleanMorse.length >= 4);

  function appendSymbol(sym: '.' | '-') {
    sendPulse(sym);
    modState.input += sym;
  }

  function appendSlash() {
    sendPulse('/');
    const trimmed = modState.input.trimEnd();
    if (!trimmed) {
      return;
    }

    // If ends with '///': already STOP, do nothing
    if (trimmed.endsWith('///')) {
      return;
    }

    // If ends with '//': upgrade to '///' (STOP)
    if (trimmed.endsWith('//')) {
      const base = trimmed.slice(0, -2).trimEnd();
      modState.input = base ? `${base} /// ` : '/// ';
      return;
    }

    // If ends with '/': add '//' (space)
    if (trimmed.endsWith('/')) {
      modState.input = `${trimmed} // `;
      return;
    }

    // Otherwise ends with dots/dashes: commit letter with '/'
    modState.input = `${trimmed}/ `;
  }

  function handleBackspace() {
    settings.vibrate(25);
    if (!modState.input) return;

    const trimmed = modState.input.trimEnd();

    // 1. If ends with '///': revert to '//'
    if (trimmed.endsWith('///')) {
      const base = trimmed.slice(0, -3).trimEnd();
      modState.input = base ? `${base} // ` : '// ';
      return;
    }

    // 2. If ends with '//': remove space token entirely
    if (trimmed.endsWith('//')) {
      const base = trimmed.slice(0, -2).trimEnd();
      modState.input = base ? `${base} ` : '';
      return;
    }

    // 3. If ends with '/': un-commit letter, so code becomes pending dots/dashes
    if (trimmed.endsWith('/')) {
      modState.input = trimmed.slice(0, -1);
      return;
    }

    // 4. Ends with '.' or '-': delete last character
    modState.input = modState.input.slice(0, -1);
  }

  function handleClear() {
    settings.vibrate(30);
    modState.input = '';
    bruteforceResults = [];
    totalFoundCandidates = 0;
  }

  function openPermutations() {
    settings.vibrate(20);
    isBruteforceOpen = false;
    isPermutationsOpen = true;
  }

  onMount(() => {
    // Build the dictionary lexicon in the background so the first solve is fast.
    if (versionService.state.isDbInstalled) morseService.warmUp();
  });

  async function runBruteforce() {
    if (!isEligibleForBruteforce) return;

    if (!versionService.state.isDbInstalled) {
      settings.vibrate(30);
      toast.show('Stáhněte slovník v Nastavení', { type: 'warning' });
      navigation.openModule('settings');
      return;
    }

    isPermutationsOpen = false;
    isSolving = true;
    isBruteforceOpen = true;

    try {
      const res = await morseService.solveWithoutSpaces(cleanMorse, 50);
      bruteforceResults = res.candidates;
      totalFoundCandidates = res.totalFound;
      if (bruteforceResults.length > 0) {
        toast.show(`Nalezeno ${totalFoundCandidates} možností`, { type: 'success' });
      } else {
        toast.show('Žádný rozpad nenalezen', { type: 'warning' });
      }
    } catch (err: any) {
      console.error('Bruteforce solve error:', err);
      if (err?.message?.includes('slovník') || err?.message?.includes('databáze')) {
        toast.show('Stáhněte slovník v Nastavení', { type: 'warning' });
        navigation.openModule('settings');
      } else {
        toast.show('Chyba při řešení kódu', { type: 'danger' });
      }
    } finally {
      isSolving = false;
    }
  }

  function formatMorseToCanonical(raw: string): string {
    if (!raw || !raw.trim()) return '';
    const normalized = normalizeMorse(raw);
    const words = normalized.split(/\s*\/\/\s*|\s{2,}/);
    const parts: string[] = [];

    for (let w = 0; w < words.length; w++) {
      const word = words[w].trim();
      if (!word) continue;

      if (w > 0) {
        parts.push('//');
      }

      const letters = word.split(/[\/\s]+/).filter(Boolean);
      for (const letter of letters) {
        if (letter === '///') {
          parts.push('///');
        } else if (letter === '//') {
          parts.push('//');
        } else {
          const clean = letter.replace(/[^.-]/g, '');
          if (clean) {
            parts.push(`${clean}/`);
          }
        }
      }
    }

    return parts.length > 0 ? parts.join(' ') + ' ' : '';
  }

  function applyPermutation(perm: PermutationResult) {
    settings.vibrate(25);
    modState.input = formatMorseToCanonical(perm.transformedMorse);
    isPermutationsOpen = false;
    toast.show(`Varianta: ${perm.name}`, 'info');
  }

  function applyCandidate(candidate: BruteforceCandidate) {
    settings.vibrate(25);
    modState.input = formatMorseToCanonical(candidate.spacedMorse);
    isBruteforceOpen = false;
    copyToClipboard(candidate.text, 'Řešení vloženo');
  }

  function handleReset() {
    settings.vibrate(30);
    resetModState();
    bruteforceResults = [];
    totalFoundCandidates = 0;
    isBruteforceOpen = false;
    isPermutationsOpen = false;
    toast.show('Vyčištěno', 'info');
  }

  function handlePaste(text: string) {
    const formatted = formatMorseToCanonical(text);
    if (formatted) {
      modState.input = formatted;
      toast.show('Kód vložen ze schránky', 'success');
    }
  }
</script>

<ModuleShell onReset={handleReset} onPaste={handlePaste}>
  {#snippet output()}
    <TranslationCard
      text={plainTextOutput}
      pendingText={pendingInterlinearToken?.primary ?? ''}
      emptyHint="Lomítko dělí písmena, dvě slova, tři STOP. Text bez mezer řeší tlačítko dole."
    >
      {#snippet children()}
        <InterlinearText
          tokens={interlinearTokens}
          pendingToken={pendingInterlinearToken}
          scalePrimaryBy="primary"
        />
      {/snippet}
    </TranslationCard>
  {/snippet}

  {#snippet input()}
    <div class="keypad-zone" class:no-wire={!modState.show_wire}>
      <!-- Sub-Toolbar: Permutations and Bruteforce solver -->
      <div class="morse-subtoolbar">
        <button
          type="button"
          class="morse-chip-btn"
          class:active={isPermutationsOpen}
          onclick={openPermutations}
          disabled={!modState.input}
          title="Zobrazit permutace a zrcadlení kódu"
        >
          <span class="floating-icon"><ArrowsLeftRight size={14} weight="bold" /></span>
          <span>Permutace</span>
        </button>

        <button
          type="button"
          class="morse-chip-btn"
          class:active={isBruteforceOpen}
          onclick={runBruteforce}
          disabled={!modState.input || !isEligibleForBruteforce}
          title="Rozluštit kód bez mezer"
        >
          <span class="floating-icon"><Lightning size={14} weight="duotone" /></span>
          <span>Vyřešit bez mezer</span>
        </button>
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

      <!-- Utility Row: Slide to Clear and Backspace -->
      <div class="keypad-utility-row">
        <SlideToAction
          disabled={!modState.input}
          onAction={handleClear}
          ariaLabel="Vymazat celý kód tažením"
        />

        <BackspaceButton
          disabled={!modState.input}
          title="Smazat poslední znak nebo oddělovač"
          onAction={handleBackspace}
        />
      </div>

      <!-- Animated Telegraph Wire Decoration & Easter Egg -->
      {#if modState.show_wire}
        <TelegraphWire pulse={currentPulse} />
      {/if}
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <OptionRow
      label="Telegrafní vedení"
      hint="Animace pod tlačítky"
      type="switch"
      checked={modState.show_wire}
      onChange={(v) => (modState.show_wire = v)}
    />
    <OptionRow
      label="Rozpoznávat CH"
      checked={modState.parse_ch}
      onChange={(v) => (modState.parse_ch = v)}
    />
    <OptionRow
      label="Rozpoznávat číslice"
      checked={modState.parse_digits}
      onChange={(v) => (modState.parse_digits = v)}
    />
    <OptionRow
      label="Rozpoznávat interpunkci"
      checked={modState.parse_other}
      onChange={(v) => (modState.parse_other = v)}
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
    <div class="empty-state">Nejdřív zadejte kód.</div>
  {:else}
    <div class="perms-list">
      {#each permutations as perm}
        <div class="perm-card" class:is-valid={perm.isValid}>
          <div class="perm-info">
            <div class="perm-name-row">
              <span class="perm-name">{perm.name}</span>
              <span class="perm-mapping">{perm.mapping}</span>
            </div>
            <span class="perm-decoded">{perm.decodedText || '—'}</span>
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
  {#if !versionService.state.isDbInstalled}
    <div class="empty-state" style="padding: 24px 16px; text-align: center;">
      <p style="color: var(--color-text-secondary); margin-bottom: 16px;">
        Vyžaduje offline slovník (102 MB).
      </p>
      <button
        type="button"
        class="secondary-btn"
        style="width: 100%; min-height: 48px; font-weight: 600;"
        onclick={() => {
          isBruteforceOpen = false;
          navigation.openModule('settings');
        }}
      >
        Stáhnout v Nastavení
      </button>
    </div>
  {:else if isSolving}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <span>Hledám…</span>
    </div>
  {:else if bruteforceResults.length === 0}
    <div class="empty-state">Žádné smysluplné řešení.</div>
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
          Zobrazeno {bruteforceResults.length} nejlepších z {totalFoundCandidates}.
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
    gap: var(--zone-input-gap);
    width: 100%;
  }

  .morse-subtoolbar {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-xs);
    width: 100%;
    height: var(--subtoolbar-height);
    box-sizing: border-box;
  }

  .morse-chip-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    height: 100%;
    padding: 0 var(--space-sm);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: background-color 0.12s ease, color 0.12s ease, border-color 0.12s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .morse-chip-btn:active:not(:disabled),
  .morse-chip-btn.active:not(:disabled) {
    background-color: var(--color-surface-active);
    color: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
  }

  .morse-chip-btn:disabled {
    color: var(--color-text-muted);
    background-color: var(--color-surface-1);
    border-color: var(--color-border-subtle);
    pointer-events: none;
    cursor: default;
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
