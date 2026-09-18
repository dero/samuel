<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import AlphabetSelect from '../../components/ui/AlphabetSelect.svelte';
  import CaesarView from './CaesarView.svelte';
  import VigenereView from './VigenereView.svelte';
  import AutokeyView from './AutokeyView.svelte';
  import ShiftsReference from './ShiftsReference.svelte';
  import {
    type ShiftType,
    SHIFT_SEGMENT_OPTIONS
  } from './shiftsData';
  import { onMount } from 'svelte';
  import { getLexiconWords } from '../../db/database.svelte';
  import {
    getAllCaesarShifts,
    solveVigenere,
    solveAutokey,
    setCaesarLexicon
  } from './shiftsSolver';
  import { buildCaesarLexicon } from './caesarScorer';
  import { alphabet } from '../../state/alphabet.svelte';
  import { settings } from '../../state/settings.svelte';
  import { navigation } from '../../state/navigation.svelte';
  import { toast } from '../../state/toast.svelte';
  import { localSettingsService } from '../../services/localSettingsService';
  import { Warning, X, ClipboardText } from 'phosphor-svelte';

  const modSettings = localSettingsService.forModule('shifts');

  // Submodule selection (in the main view via SegmentedControl)
  let activeSubmodule = $state<ShiftType>(
    (modSettings.getString('submodule', 'caesar') as ShiftType) || 'caesar'
  );

  // Inputs
  let text = $state<string>(modSettings.getString('text', ''));
  let keyText = $state<string>(modSettings.getString('key', ''));
  let autokeyPrimer = $state<string>(modSettings.getString('autokey_primer', ''));

  // Options
  let showBestHighlight = $state<boolean>(
    modSettings.getBoolean('show_best_highlight', true)
  );
  let preserveSpecialChars = $state<boolean>(
    modSettings.getBoolean('preserve_special_chars', true)
  );
  let alphabetId = $state<string>(
    modSettings.getString('alphabet_id', 'english-26')
  );

  // Persistence effect
  $effect(() => {
    modSettings.setString('submodule', activeSubmodule);
    modSettings.setString('text', text);
    modSettings.setString('key', keyText);
    modSettings.setString('autokey_primer', autokeyPrimer);
    modSettings.setBoolean('show_best_highlight', showBestHighlight);
    modSettings.setBoolean('preserve_special_chars', preserveSpecialChars);
    modSettings.setString('alphabet_id', alphabetId);
  });

  const currentLayout = $derived(
    alphabet.getLayout(alphabetId) ?? alphabet.layouts[0]
  );
  const currentLetters = $derived(currentLayout.letters);

  // Non-standard alphabet indicator
  const isNonStandardAlphabet = $derived(
    !['english-26', 'english-ch-27'].includes(alphabetId)
  );

  $effect(() => {
    navigation.setMenuWarning(isNonStandardAlphabet);
    return () => {
      navigation.setMenuWarning(false);
    };
  });

  // Dynamic Lexicon from SQLite DB
  let isLexiconLoaded = $state<boolean>(false);

  onMount(() => {
    getLexiconWords()
      .then((words) => {
        setCaesarLexicon(buildCaesarLexicon(words));
        isLexiconLoaded = true;
      })
      .catch((err) => {
        console.warn('ShiftsModule: could not load words lexicon from database:', err);
      });
  });

  // Solver calculations
  const caesarShifts = $derived.by(() => {
    // Explicitly track isLexiconLoaded so shifts recalculate once full DB lexicon loads
    const _loaded = isLexiconLoaded;
    if (activeSubmodule !== 'caesar') return [];
    return getAllCaesarShifts(text, currentLetters, preserveSpecialChars);
  });

  const vigenereResult = $derived(
    activeSubmodule === 'vigenere'
      ? solveVigenere(text, keyText, 'decrypt', currentLetters, preserveSpecialChars)
      : { text: '', keyStream: '' }
  );

  const autokeyResult = $derived(
    activeSubmodule === 'autokey'
      ? solveAutokey(
          text,
          autokeyPrimer,
          'decrypt',
          'plaintext',
          currentLetters,
          preserveSpecialChars
        )
      : { text: '', keyStream: '' }
  );

  function handleReset() {
    settings.vibrate(35);
    text = '';
    keyText = '';
    autokeyPrimer = '';
  }

  function handlePaste(pasted: string) {
    text = pasted;
  }

  async function handlePasteText() {
    settings.vibrate(20);
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        text = clip;
        toast.show('✓ Text vložen', { type: 'success' });
      }
    } catch {
      toast.show('Nelze číst schránku', { type: 'danger' });
    }
  }

  async function handlePasteKey() {
    settings.vibrate(20);
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        keyText = clip;
        toast.show('✓ Klíč vložen', { type: 'success' });
      }
    } catch {
      toast.show('Nelze číst schránku', { type: 'danger' });
    }
  }

  async function handlePastePrimer() {
    settings.vibrate(20);
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        autokeyPrimer = clip;
        toast.show('✓ Heslo vloženo', { type: 'success' });
      }
    } catch {
      toast.show('Nelze číst schránku', { type: 'danger' });
    }
  }

  // Easter egg: Caesar's 23 daggers
  let daggerCount = $state<number>(0);
  let isDaggersShaking = $state<boolean>(false);

  function handleDaggerClick() {
    if (isDaggersShaking) return;

    if (daggerCount < 23) {
      settings.vibrate(20);
      daggerCount++;
    } else {
      // 24th strike: Caesar's betrayal!
      settings.vibrate(60);
      isDaggersShaking = true;
      toast.show('Et tu, Brute? 😒', { type: 'danger', duration: 3200 });
      setTimeout(() => {
        daggerCount = 0;
        isDaggersShaking = false;
      }, 500);
    }
  }

  $effect(() => {
    if (activeSubmodule !== 'caesar') {
      daggerCount = 0;
      isDaggersShaking = false;
    }
  });
</script>

<ModuleShell
  hasAlphabet={true}
  onReset={handleReset}
  onPaste={handlePaste}
>
  <!-- TOP ZONE: Output (Translation area only) -->
  {#snippet output()}
    <div class="submodule-content">
      {#if activeSubmodule === 'caesar'}
        <CaesarView
          shifts={caesarShifts}
          rawText={text}
          {showBestHighlight}
        />
      {:else if activeSubmodule === 'vigenere'}
        <VigenereView
          {text}
          {keyText}
          resultText={vigenereResult.text}
          keyStream={vigenereResult.keyStream}
        />
      {:else if activeSubmodule === 'autokey'}
        <AutokeyView
          {text}
          primerText={autokeyPrimer}
          resultText={autokeyResult.text}
          keyStream={autokeyResult.keyStream}
        />
      {/if}
    </div>
  {/snippet}

  <!-- BOTTOM ZONE: Single-line Text Inputs & Quick Actions -->
  {#snippet input()}
    <div class="input-zone">
      <!-- Submodule Selector Segment: Cézar | Vigenère | Autokey -->
      <div class="submodule-nav">
        <SegmentedControl
          options={SHIFT_SEGMENT_OPTIONS}
          value={activeSubmodule}
          onChange={(m) => {
            activeSubmodule = m;
          }}
          ariaLabel="Výběr šifrovacího nástroje"
        />
      </div>

      {#if activeSubmodule === 'caesar'}
        <!-- Caesar Single-line Input Row with Spacer -->
        <div class="inputs-column">
          <div class="input-row">
            <input
              type="text"
              class="cipher-input font-mono"
              placeholder="Šifrový text..."
              bind:value={text}
              autocomplete="off"
              autocorrect="off"
              autocapitalize="characters"
              spellcheck="false"
            />
            {#if text}
              <button
                type="button"
                class="input-clear-btn"
                onclick={() => {
                  settings.vibrate(15);
                  text = '';
                }}
                title="Vymazat text"
                aria-label="Vymazat text"
              >
                <X size={15} weight="bold" />
              </button>
            {/if}
            <button
              type="button"
              class="input-paste-btn"
              onclick={handlePasteText}
              title="Vložit ze schránky"
              aria-label="Vložit ze schránky"
            >
              <ClipboardText size={18} weight="bold" />
            </button>
          </div>

          <!-- Easter egg: Caesar's 23 daggers in the reserved spacer slot -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="input-row input-row-spacer"
            class:daggers-shaking={isDaggersShaking}
            onclick={handleDaggerClick}
            role="presentation"
            aria-hidden="true"
          >
            {#if daggerCount === 0}
              <span class="spacer-ghost font-mono">&nbsp;</span>
            {:else}
              <div class="daggers-cluster">
                {#each Array.from({ length: daggerCount }, (_, i) => i) as idx (idx)}
                  <svg
                    viewBox="0 0 16 24"
                    class="dagger-svg"
                    aria-hidden="true"
                    style="--dagger-rot: {((idx % 5) - 2) * 3}deg; --dagger-offset-y: {(idx % 3) - 1}px;"
                  >
                    <!-- Roman Pugio Dagger -->
                    <circle cx="8" cy="2.2" r="1.7" fill="currentColor" />
                    <rect x="7.2" y="3.9" width="1.6" height="3.8" rx="0.4" fill="currentColor" />
                    <path d="M4 7.8 C4 7.4 12 7.4 12 7.8 L12.5 9 C12.5 9.4 10.5 9.4 10.5 9.4 L5.5 9.4 C5.5 9.4 3.5 9.4 3.5 9 Z" fill="currentColor" />
                    <path d="M5.5 9.4 L10.5 9.4 L9.6 16.5 C9.2 19.5 8 23 8 23 C8 23 6.8 19.5 6.4 16.5 Z" fill="currentColor" />
                  </svg>
                {/each}
              </div>
            {/if}
          </div>
        </div>

      {:else if activeSubmodule === 'vigenere'}
        <!-- Vigenere Inputs: Text & Key -->
        <div class="inputs-column">
          <div class="input-row">
            <input
              type="text"
              class="cipher-input font-mono"
              placeholder="Šifrový text..."
              bind:value={text}
              autocomplete="off"
              autocorrect="off"
              autocapitalize="characters"
              spellcheck="false"
            />
            {#if text}
              <button
                type="button"
                class="input-clear-btn"
                onclick={() => {
                  settings.vibrate(15);
                  text = '';
                }}
                title="Vymazat text"
                aria-label="Vymazat text"
              >
                <X size={15} weight="bold" />
              </button>
            {/if}
            <button
              type="button"
              class="input-paste-btn"
              onclick={handlePasteText}
              title="Vložit text ze schránky"
              aria-label="Vložit text ze schránky"
            >
              <ClipboardText size={18} weight="bold" />
            </button>
          </div>

          <div class="input-row">
            <input
              type="text"
              class="cipher-input font-mono"
              placeholder="Klíč (heslo / čísla)..."
              bind:value={keyText}
              autocomplete="off"
              autocorrect="off"
              autocapitalize="characters"
              spellcheck="false"
            />
            {#if keyText}
              <button
                type="button"
                class="input-clear-btn"
                onclick={() => {
                  settings.vibrate(15);
                  keyText = '';
                }}
                title="Vymazat klíč"
                aria-label="Vymazat klíč"
              >
                <X size={15} weight="bold" />
              </button>
            {/if}
            <button
              type="button"
              class="input-paste-btn"
              onclick={handlePasteKey}
              title="Vložit klíč ze schránky"
              aria-label="Vložit klíč ze schránky"
            >
              <ClipboardText size={18} weight="bold" />
            </button>
          </div>
        </div>

      {:else if activeSubmodule === 'autokey'}
        <!-- Autokey Inputs: Text & Primer -->
        <div class="inputs-column">
          <div class="input-row">
            <input
              type="text"
              class="cipher-input font-mono"
              placeholder="Šifrový text..."
              bind:value={text}
              autocomplete="off"
              autocorrect="off"
              autocapitalize="characters"
              spellcheck="false"
            />
            {#if text}
              <button
                type="button"
                class="input-clear-btn"
                onclick={() => {
                  settings.vibrate(15);
                  text = '';
                }}
                title="Vymazat text"
                aria-label="Vymazat text"
              >
                <X size={15} weight="bold" />
              </button>
            {/if}
            <button
              type="button"
              class="input-paste-btn"
              onclick={handlePasteText}
              title="Vložit text ze schránky"
              aria-label="Vložit text ze schránky"
            >
              <ClipboardText size={18} weight="bold" />
            </button>
          </div>

          <div class="input-row">
            <input
              type="text"
              class="cipher-input font-mono"
              placeholder="Heslo (klíč)..."
              bind:value={autokeyPrimer}
              autocomplete="off"
              autocorrect="off"
              autocapitalize="characters"
              spellcheck="false"
            />
            {#if autokeyPrimer}
              <button
                type="button"
                class="input-clear-btn"
                onclick={() => {
                  settings.vibrate(15);
                  autokeyPrimer = '';
                }}
                title="Vymazat heslo"
                aria-label="Vymazat heslo"
              >
                <X size={15} weight="bold" />
              </button>
            {/if}
            <button
              type="button"
              class="input-paste-btn"
              onclick={handlePastePrimer}
              title="Vložit heslo ze schránky"
              aria-label="Vložit heslo ze schránky"
            >
              <ClipboardText size={18} weight="bold" />
            </button>
          </div>
        </div>
      {/if}
    </div>
  {/snippet}

  <!-- CONTEXTUAL MENU: Abeceda & Možnosti -->
  {#snippet menuOptions()}
    <div class="menu-group">
      <div class="menu-group-title">Abeceda modulu</div>
      {#if isNonStandardAlphabet}
        <div class="nonstandard-banner" role="alert">
          <span class="banner-icon"><Warning size={18} weight="fill" /></span>
          <div class="banner-text">
            Pro Posuny je nastavena <strong>{currentLayout.name}</strong>. Běžně se používá <strong>Anglická (26)</strong> nebo <strong>Anglická + CH (27)</strong>.
          </div>
        </div>
      {/if}
      <AlphabetSelect
        value={alphabetId}
        onChange={(id) => {
          alphabetId = id;
        }}
      />
    </div>

    <div class="menu-group">
      <div class="menu-group-title">Nastavení zobrazení</div>
      {#if activeSubmodule === 'caesar'}
        <OptionRow
          label="Zvýraznit nejlepší shodu (Cézar)"
          checked={showBestHighlight}
          onChange={(val) => {
            showBestHighlight = val;
          }}
        />
      {/if}
      <OptionRow
        label="Zachovat mezery a interpunkci"
        checked={preserveSpecialChars}
        onChange={(val) => {
          preserveSpecialChars = val;
        }}
      />
    </div>
  {/snippet}

  <!-- REFERENCE CHEAT SHEET -->
  {#snippet reference()}
    <ShiftsReference />
  {/snippet}
</ModuleShell>

<style>
  .submodule-nav {
    width: 100%;
    margin-bottom: 0;
    flex-shrink: 0;
  }

  .submodule-content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .input-zone {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
  }

  .inputs-column {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
  }

  /* Single-line Input Row */
  .input-row {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    min-height: 42px;
    height: 42px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: 3px 6px;
    box-sizing: border-box;
    transition: border-color 0.12s ease;
  }

  .input-row-spacer {
    min-height: 42px;
    height: 42px;
    border-color: transparent;
    background: transparent;
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    padding: 0 4px;
    box-sizing: border-box;
  }

  .spacer-ghost {
    visibility: hidden;
    pointer-events: none;
  }

  .daggers-cluster {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(1px, 0.7vw, 3px);
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .dagger-svg {
    width: 11px;
    height: 22px;
    flex-shrink: 0;
    color: var(--color-text-muted);
    opacity: 0.7;
    animation: dagger-pop 0.16s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    transform: rotate(var(--dagger-rot, 0deg)) translateY(var(--dagger-offset-y, 0px));
    transition: color 0.12s ease, opacity 0.12s ease;
  }

  @keyframes dagger-pop {
    0% {
      transform: scale(0.2) translateY(-6px) rotate(var(--dagger-rot, 0deg));
      opacity: 0;
    }
    70% {
      transform: scale(1.2) translateY(0) rotate(var(--dagger-rot, 0deg));
      opacity: 0.95;
    }
    100% {
      transform: scale(1) translateY(var(--dagger-offset-y, 0px)) rotate(var(--dagger-rot, 0deg));
      opacity: 0.7;
    }
  }

  @keyframes daggers-shake {
    0% { transform: translateX(0) rotate(0deg); }
    15% { transform: translateX(-4px) rotate(-3deg); }
    30% { transform: translateX(4px) rotate(3deg); }
    45% { transform: translateX(-4px) rotate(-2deg); }
    60% { transform: translateX(3px) rotate(2deg); }
    75% { transform: translateX(-2px) rotate(-1deg); }
    90% { transform: translateY(4px) scale(0.9); opacity: 0.5; }
    100% { transform: translateY(8px) scale(0.6); opacity: 0; }
  }

  .daggers-shaking {
    animation: daggers-shake 0.45s ease-in-out forwards;
  }

  .daggers-shaking .dagger-svg {
    color: var(--color-accent-danger);
    opacity: 0.95;
  }

  .input-row:focus-within {
    border-color: var(--color-border-focus);
    box-shadow: 0 0 8px rgba(0, 210, 255, 0.15);
  }

  .cipher-input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    outline: none;
    color: var(--color-text-primary);
    font-size: var(--text-base);
    font-weight: 700;
    padding: 6px 4px;
    box-sizing: border-box;
    letter-spacing: 0.5px;
  }

  .cipher-input::placeholder {
    color: var(--color-text-muted);
    font-weight: 400;
    font-family: var(--font-sans);
    font-size: var(--text-sm);
  }

  .input-clear-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    border-radius: var(--radius-xs);
    flex-shrink: 0;
    transition: color 0.1s ease, background-color 0.1s ease;
  }

  .input-clear-btn:hover {
    color: var(--color-text-primary);
    background-color: var(--color-surface-3);
  }

  .input-paste-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 34px;
    background-color: var(--color-surface-3);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs);
    color: var(--color-accent-primary);
    cursor: pointer;
    flex-shrink: 0;
    transition: background-color 0.1s ease, transform 0.08s ease;
  }

  .input-paste-btn:active {
    background-color: var(--color-surface-active);
    transform: scale(0.96);
  }

  .menu-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    margin-bottom: var(--space-md);
  }

  .menu-group-title {
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .nonstandard-banner {
    display: flex;
    align-items: flex-start;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    background-color: rgba(245, 158, 11, 0.12);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: var(--radius-sm);
    color: var(--color-accent-warning);
    font-size: var(--text-xs);
    line-height: 1.4;
  }

  .banner-icon {
    flex-shrink: 0;
    margin-top: 1px;
  }

  .banner-text {
    flex: 1;
  }
</style>
