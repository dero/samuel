<script lang="ts">
  import { onMount, tick } from 'svelte';
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import MorseReference from './MorseReference.svelte';
  import TelegraphWire, { type PulseEvent } from './TelegraphWire.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import Chassis from '../../components/ui/Chassis.svelte';
  import Keycap from '../../components/ui/Keycap.svelte';
  import KeypadBottomRow from '../../components/ui/KeypadBottomRow.svelte';
  import BottomSheet from '../../components/ui/BottomSheet.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import MenuAction from '../../components/ui/MenuAction.svelte';
  import Badge from '../../components/ui/Badge.svelte';
  import InterlinearText, { type InterlinearToken } from '../../components/ui/InterlinearText.svelte';
  import {
    decodeMorse,
    decodeMorseLetter,
    isMorsePrefix,
    getPermutations,
    notationToRawMorse,
    splitRawMorse,
    toRawMorse,
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
    show_wire: true
  });

  // Input is a raw symbol stream (`.`, `-`, `/`, one `/` per press). Older versions stored
  // a spaced form where the letter's own `/` stood apart from `//` and `///` tokens.
  if (/\s/.test(modState.input)) {
    let migrated = '';
    for (const token of modState.input.trim().split(/\s+/)) {
      const isSeparatorRun = /^\/+$/.test(token);
      migrated += isSeparatorRun && migrated.endsWith('/') ? token.slice(1) : token;
    }
    modState.input = migrated;
  }

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
  // Letters, CH, digits and punctuation never share a code, so all are always decoded.
  const morseOptions = { parseCH: true, parseDigits: true, parseOther: true };

  const parsedMorse = $derived.by(() => {
    const tokens: InterlinearToken[] = [];
    let pending: InterlinearToken | null = null;

    for (const { code, sep } of splitRawMorse(modState.input)) {
      // Unfinished letter at the end of the stream
      if (code && sep === 0) {
        const char = decodeMorseLetter(code, morseOptions);
        if (char !== '?') {
          pending = { primary: char, secondary: code, isPending: true };
        } else {
          const isPrefix = isMorsePrefix(code, morseOptions);
          pending = {
            primary: isPrefix ? '…' : '?',
            secondary: code,
            isPending: true,
            isError: !isPrefix,
            errorText: !isPrefix ? `Neznámý kód „${code}“` : undefined
          };
        }
        continue;
      }

      if (code) {
        const char = decodeMorseLetter(code, morseOptions);
        const isError = char === '?';
        tokens.push({
          primary: char,
          secondary: sep === 1 ? `${code}/` : code,
          isError,
          errorText: isError ? `Neznámý kód „${code}“` : undefined
        });
      }

      // Separator runs: 1 = letter end, 2 = word, 3+ = STOP (any length is kept)
      if (sep >= 3) {
        tokens.push({ primary: 'STOP', secondary: '/'.repeat(sep), className: 'token-stop' });
      } else if (sep === 2 || (sep === 1 && !code)) {
        tokens.push({ primary: '␣', secondary: '/'.repeat(sep), className: 'token-space' });
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
    modState.input += '/';
  }

  function handleBackspace() {
    modState.input = modState.input.slice(0, -1);
  }

  function handleClear() {
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

  function applyPermutation(perm: PermutationResult) {
    settings.vibrate(25);
    modState.input = toRawMorse(perm.transformedMorse);
    isPermutationsOpen = false;
    toast.show(`Varianta: ${perm.name}`, 'info');
  }

  function applyCandidate(candidate: BruteforceCandidate) {
    settings.vibrate(25);
    modState.input = toRawMorse(candidate.spacedMorse);
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
</script>

<ModuleShell
  onReset={handleReset}
  podklad={{
    kind: 'text',
    required: false,
    empty: !modState.input,
    title: 'Zápis',
    description: 'Morseovka doslova: lomítko dělí znaky, dvě lomítka slova.',
    example: '.-/-...//-.-.',
    placeholder: 'Např. .-/-...//-.-.',
    autocapitalize: 'none',
    value: modState.input,
    onSave: (val) => {
      modState.input = notationToRawMorse(val);
    }
  }}
  bar={{
    empty: !modState.input,
    hint: 'Tečka, čárka, lomítko dělí znaky.',
    charCount: plainTextOutput.replace(/\s/g, '').length + (pendingInterlinearToken ? 1 : 0),
    action: {
      label: 'Bez mezer',
      icon: Lightning,
      title: 'Rozluštit kód bez mezer',
      disabled: !isEligibleForBruteforce,
      onClick: runBruteforce
    }
  }}
>
  {#snippet output()}
    <TranslationCard
      text={plainTextOutput}
      pendingText={pendingInterlinearToken?.primary ?? ''}
      hasContent={!!modState.input}
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
      <Chassis columns={3} keyHeight="var(--dominant-key-height)">
        <Keycap size="l" label="•" sublabel="Tečka" onPress={() => appendSymbol('.')} />
        <Keycap size="l" label="—" sublabel="Čárka" onPress={() => appendSymbol('-')} />
        <Keycap size="l" label="/" sublabel="Oddělovač" onPress={appendSlash} />
      </Chassis>

      <KeypadBottomRow
        clearDisabled={!modState.input}
        backspaceDisabled={!modState.input}
        clearLabel="Vymazat celý kód podržením"
        backspaceTitle="Smazat poslední znak nebo oddělovač"
        onClear={handleClear}
        onBackspace={handleBackspace}
      />

      <!-- Animated Telegraph Wire Decoration & Easter Egg -->
      {#if modState.show_wire}
        <TelegraphWire pulse={currentPulse} />
      {/if}
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <MenuAction
      label="Permutace"
      hint="Záměna symbolů, čtení pozpátku"
      icon={ArrowsLeftRight}
      disabled={!modState.input}
      onClick={openPermutations}
    />
    <OptionRow
      label="Telegrafní vedení"
      hint="Animace pod tlačítky"
      type="switch"
      checked={modState.show_wire}
      onChange={(v) => (modState.show_wire = v)}
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
        Vyžaduje offline slovník ({versionService.formattedDbSize}).
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
