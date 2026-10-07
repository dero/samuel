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
  import { dbClient, SupersededError } from '../../db/dbClient';
  import {
    getAllCaesarShifts,
    buildCaesarShiftTexts,
    assembleCaesarResults,
    solveVigenere,
    solveAutokey
  } from './shiftsSolver';
  import type { CaesarShiftResult } from './shiftsData';
  import { alphabet } from '../../state/alphabet.svelte';
  import { settings } from '../../state/settings.svelte';
  import { versionService } from '../../services/versionService.svelte';
  import { navigation } from '../../state/navigation.svelte';
  import { toast } from '../../state/toast.svelte';
  import { X, PencilSimple } from 'phosphor-svelte';
  import TextEntrySheet from '../../components/ui/TextEntrySheet.svelte';
  import NonStandardAlphabetBanner from '../../components/ui/NonStandardAlphabetBanner.svelte';
  import { localSettingsService } from '../../services/localSettingsService';

  const modSettings = localSettingsService.forModule('shifts');

  // Submodule selection (in the main view via SegmentedControl)
  let activeSubmodule = $state<ShiftType>(
    (modSettings.getString('submodule', 'caesar') as ShiftType) || 'caesar'
  );

  // Inputs
  let text = $state<string>(modSettings.getString('text', ''));
  let keyText = $state<string>(modSettings.getString('key', ''));
  let autokeyPrimer = $state<string>(modSettings.getString('autokey_primer', ''));
  let activeTextSheet = $state<'text' | 'key' | 'primer' | null>(null);

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

  // Caesar scoring: the built-in keyword lexicon gives an instant result on
  // the main thread; full-dictionary scoring runs in the DB worker and its
  // latest result is shown once available (possibly one keystroke stale
  // while the next request is in flight - avoids score flicker).
  onMount(() => {
    if (versionService.state.isDbInstalled) dbClient.warmLexicon('caesar');
  });

  const caesarShiftTexts = $derived(
    activeSubmodule === 'caesar' ? buildCaesarShiftTexts(text, currentLetters, preserveSpecialChars) : []
  );

  let dictionaryShifts = $state<CaesarShiftResult[] | null>(null);

  $effect(() => {
    const texts = caesarShiftTexts;
    const alphabetSize = currentLetters.length;
    if (texts.length === 0 || !versionService.state.isDbInstalled) {
      dictionaryShifts = null;
      return;
    }
    dbClient.caesarScore(texts).then(
      (evaluated) => {
        if (texts === caesarShiftTexts) {
          dictionaryShifts = assembleCaesarResults(texts, evaluated, alphabetSize);
        }
      },
      (err) => {
        if (err instanceof SupersededError) return;
        console.warn('ShiftsModule: dictionary scoring failed, using keyword lexicon:', err);
        dictionaryShifts = null;
      }
    );
  });

  const caesarShifts = $derived.by(() => {
    if (caesarShiftTexts.length === 0) return [];
    return dictionaryShifts ?? getAllCaesarShifts(text, currentLetters, preserveSpecialChars);
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
  title={activeSubmodule === 'caesar' ? 'Cézar' : activeSubmodule === 'vigenere' ? 'Vigenère' : 'Autokey'}
  hasAlphabet={true}
  onReset={handleReset}
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
    <div class="zone-input-flow">
      <!-- Submodule Selector Segment: Cézar | Vigenère | Autokey -->
      <div class="subtoolbar-container">
        <SegmentedControl
          options={SHIFT_SEGMENT_OPTIONS}
          value={activeSubmodule}
          size="sm"
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
            <button
              type="button"
              class="cipher-input-trigger font-mono"
              onclick={() => {
                settings.vibrate(20);
                activeTextSheet = 'text';
              }}
              title="Klepnutím zadat nebo upravit šifrový text"
              aria-label="Klepnutím zadat nebo upravit šifrový text"
            >
              {#if text}
                <span class="trigger-text">{text}</span>
              {:else}
                <span class="trigger-placeholder">Zadat text…</span>
              {/if}
            </button>
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
              class="input-sheet-btn"
              onclick={() => {
                settings.vibrate(20);
                activeTextSheet = 'text';
              }}
              title="Otevřít textový editor"
              aria-label="Otevřít textový editor"
            >
              <PencilSimple size={16} weight="bold" />
            </button>
          </div>

          <!-- Easter egg: Caesar's 23 daggers in the reserved spacer slot -->
          <button
            type="button"
            class="input-row input-row-spacer"
            class:daggers-shaking={isDaggersShaking}
            onclick={handleDaggerClick}
            aria-label="Skrytá funkce: Cézarovy dýky"
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
          </button>
        </div>

      {:else if activeSubmodule === 'vigenere'}
        <!-- Vigenere Inputs: Text & Key -->
        <div class="inputs-column">
          <div class="input-row">
            <button
              type="button"
              class="cipher-input-trigger font-mono"
              onclick={() => {
                settings.vibrate(20);
                activeTextSheet = 'text';
              }}
              title="Klepnutím zadat nebo upravit šifrový text"
              aria-label="Klepnutím zadat nebo upravit šifrový text"
            >
              {#if text}
                <span class="trigger-text">{text}</span>
              {:else}
                <span class="trigger-placeholder">Zadat text…</span>
              {/if}
            </button>
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
              class="input-sheet-btn"
              onclick={() => {
                settings.vibrate(20);
                activeTextSheet = 'text';
              }}
              title="Otevřít textový editor"
              aria-label="Otevřít textový editor"
            >
              <PencilSimple size={16} weight="bold" />
            </button>
          </div>

          <div class="input-row">
            <button
              type="button"
              class="cipher-input-trigger font-mono"
              onclick={() => {
                settings.vibrate(20);
                activeTextSheet = 'key';
              }}
              title="Klepnutím zadat nebo upravit klíč"
              aria-label="Klepnutím zadat nebo upravit klíč"
            >
              {#if keyText}
                <span class="trigger-text">{keyText}</span>
              {:else}
                <span class="trigger-placeholder">Heslo nebo čísla…</span>
              {/if}
            </button>
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
              class="input-sheet-btn"
              onclick={() => {
                settings.vibrate(20);
                activeTextSheet = 'key';
              }}
              title="Otevřít editor klíče"
              aria-label="Otevřít editor klíče"
            >
              <PencilSimple size={16} weight="bold" />
            </button>
          </div>
        </div>

      {:else if activeSubmodule === 'autokey'}
        <!-- Autokey Inputs: Text & Primer -->
        <div class="inputs-column">
          <div class="input-row">
            <button
              type="button"
              class="cipher-input-trigger font-mono"
              onclick={() => {
                settings.vibrate(20);
                activeTextSheet = 'text';
              }}
              title="Klepnutím zadat nebo upravit šifrový text"
              aria-label="Klepnutím zadat nebo upravit šifrový text"
            >
              {#if text}
                <span class="trigger-text">{text}</span>
              {:else}
                <span class="trigger-placeholder">Zadat text…</span>
              {/if}
            </button>
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
              class="input-sheet-btn"
              onclick={() => {
                settings.vibrate(20);
                activeTextSheet = 'text';
              }}
              title="Otevřít textový editor"
              aria-label="Otevřít textový editor"
            >
              <PencilSimple size={16} weight="bold" />
            </button>
          </div>

          <div class="input-row">
            <button
              type="button"
              class="cipher-input-trigger font-mono"
              onclick={() => {
                settings.vibrate(20);
                activeTextSheet = 'primer';
              }}
              title="Klepnutím zadat nebo upravit heslo"
              aria-label="Klepnutím zadat nebo upravit heslo"
            >
              {#if autokeyPrimer}
                <span class="trigger-text">{autokeyPrimer}</span>
              {:else}
                <span class="trigger-placeholder">Heslo…</span>
              {/if}
            </button>
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
              class="input-sheet-btn"
              onclick={() => {
                settings.vibrate(20);
                activeTextSheet = 'primer';
              }}
              title="Otevřít editor hesla"
              aria-label="Otevřít editor hesla"
            >
              <PencilSimple size={16} weight="bold" />
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
      <NonStandardAlphabetBanner
        isWarning={isNonStandardAlphabet}
        description="Obvykle anglická (26) nebo s CH (27)."
      />
      <AlphabetSelect
        value={alphabetId}
        onChange={(id) => {
          alphabetId = id;
        }}
      />
    </div>

    <div class="menu-group">
      <div class="menu-group-title">Zobrazení</div>
      {#if activeSubmodule === 'caesar'}
        <OptionRow
          label="Zvýraznit nejlepší posun"
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

<TextEntrySheet
  open={activeTextSheet !== null}
  title={
    activeTextSheet === 'text'
      ? 'Šifrový text'
      : activeTextSheet === 'key'
        ? 'Šifrovací klíč'
        : 'Počáteční heslo'
  }
  value={
    activeTextSheet === 'text'
      ? text
      : activeTextSheet === 'key'
        ? keyText
        : autokeyPrimer
  }
  placeholder={
    activeTextSheet === 'text'
      ? 'Zadejte nebo vložte šifrový text...'
      : activeTextSheet === 'key'
        ? 'Zadejte heslo nebo číselný klíč...'
        : 'Zadejte heslo pro autokey...'
  }
  onSave={(val) => {
    if (activeTextSheet === 'text') text = val;
    else if (activeTextSheet === 'key') keyText = val;
    else if (activeTextSheet === 'primer') autokeyPrimer = val;
  }}
  onClose={() => {
    activeTextSheet = null;
  }}
/>

<style>
  .submodule-content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .inputs-column {
    display: flex;
    flex-direction: column;
    gap: var(--zone-input-gap);
    width: 100%;
    box-sizing: border-box;
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
    border: none;
    background: transparent;
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font: inherit;
    color: inherit;
    width: 100%;
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

  .cipher-input-trigger {
    flex: 1;
    min-width: 0;
    height: 100%;
    background: transparent;
    border: none;
    outline: none;
    display: flex;
    align-items: center;
    text-align: left;
    padding: 0 4px;
    cursor: pointer;
    overflow: hidden;
  }

  .trigger-text {
    color: var(--color-text-primary);
    font-size: var(--text-base);
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.5px;
  }

  .trigger-placeholder {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    font-family: var(--font-sans);
    font-weight: 400;
  }

  .input-clear-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
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

  .input-sheet-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    background-color: var(--color-surface-3);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs);
    color: var(--color-text-secondary);
    cursor: pointer;
    flex-shrink: 0;
    transition: background-color 0.1s ease, color 0.1s ease, transform 0.08s ease;
  }

  .input-sheet-btn:hover {
    color: var(--color-accent-primary);
    background-color: var(--color-surface-active);
  }

  .input-sheet-btn:active {
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

</style>
