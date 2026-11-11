<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import type { ModuleBarConfig } from '../../components/layout/ModuleBar.svelte';
  import SegmentedControl from '../../components/ui/SegmentedControl.svelte';
  import MenuGroup from '../../components/ui/MenuGroup.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import AlphabetSelect from '../../components/ui/AlphabetSelect.svelte';
  import HoldToAction from '../../components/ui/HoldToAction.svelte';
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
    solveAutokey,
    parseKey,
    describeKeyShifts
  } from './shiftsSolver';
  import type { CaesarShiftResult } from './shiftsData';
  import { alphabet } from '../../state/alphabet.svelte';
  import { settings } from '../../state/settings.svelte';
  import { versionService } from '../../services/versionService.svelte';
  import { toast } from '../../state/toast.svelte';
  import { PencilSimple } from 'phosphor-svelte';
  import TextEntrySheet from '../../components/ui/TextEntrySheet.svelte';
  import NonStandardAlphabetBanner from '../../components/ui/NonStandardAlphabetBanner.svelte';
  import { localSettingsService } from '../../services/localSettingsService';

  const modSettings = localSettingsService.forModule('shifts');

  const DEFAULT_ALPHABET_ID = 'english-26';

  // Tool selection (variants row)
  let activeSubmodule = $state<ShiftType>(
    (modSettings.getString('submodule', 'caesar') as ShiftType) || 'caesar'
  );

  // Inputs
  let text = $state<string>(modSettings.getString('text', ''));
  let keyText = $state<string>(modSettings.getString('key', ''));
  let autokeyPrimer = $state<string>(modSettings.getString('autokey_primer', ''));
  let activeTextSheet = $state<'key' | 'primer' | null>(null);

  // Options
  let showBestHighlight = $state<boolean>(
    modSettings.getBoolean('show_best_highlight', true)
  );
  let preserveSpecialChars = $state<boolean>(
    modSettings.getBoolean('preserve_special_chars', true)
  );
  let alphabetId = $state<string>(
    modSettings.getString('alphabet_id', DEFAULT_ALPHABET_ID)
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

  // The parameter of the active tool: Vigenère key or Autokey primer
  const activeKey = $derived(activeSubmodule === 'autokey' ? autokeyPrimer : keyText);
  const activeKeyTokens = $derived(
    activeSubmodule === 'caesar' ? [] : parseKey(activeKey, currentLetters)
  );

  const bar = $derived.by<ModuleBarConfig>(() => {
    if (!text.trim()) return { empty: true, hint: 'Vložte šifrový text.' };

    if (activeSubmodule === 'caesar') {
      const best = caesarShifts.find((s) => s.isBest);
      return {
        status: best ? `Nejlepší posun +${best.shift} · shoda ${best.percentage} %` : undefined,
        charCount: text.trim().length
      };
    }

    const isVigenere = activeSubmodule === 'vigenere';
    if (!activeKey.trim()) {
      return {
        empty: true,
        hint: isVigenere ? 'Zadejte klíč: heslo nebo čísla.' : 'Zadejte počáteční heslo.'
      };
    }
    if (activeKeyTokens.length === 0) {
      return { warning: isVigenere ? 'Klíč nemá platné znaky.' : 'Heslo nemá platné znaky.' };
    }
    return {
      status: describeKeyShifts(isVigenere ? 'Posuny klíče:' : 'Posuny hesla:', activeKeyTokens)
    };
  });

  // Data and Menu options back to defaults; the chosen tool stays
  function handleReset() {
    text = '';
    keyText = '';
    autokeyPrimer = '';
    showBestHighlight = true;
    preserveSpecialChars = true;
    alphabetId = DEFAULT_ALPHABET_ID;
  }

  function openTextSheet(sheet: 'key' | 'primer') {
    settings.vibrate(20);
    activeTextSheet = sheet;
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

{#snippet keyRow(sheet: 'key' | 'primer', value: string, placeholder: string, noun: string)}
  <div class="input-row">
    <button
      type="button"
      class="cipher-input-trigger font-mono"
      onclick={() => openTextSheet(sheet)}
      title="Klepnutím zadat nebo upravit {noun}"
      aria-label="Klepnutím zadat nebo upravit {noun}"
    >
      {#if value}
        <span class="trigger-text">{value}</span>
      {:else}
        <span class="trigger-placeholder">{placeholder}</span>
      {/if}
    </button>
    {#if value}
      <div class="input-clear-slot">
        <HoldToAction
          variant="icon-only"
          onAction={() => {
            if (sheet === 'key') keyText = '';
            else autokeyPrimer = '';
          }}
          ariaLabel="Podržte pro vymazání: {noun}"
          tapWarning="Podržte pro vymazání"
        />
      </div>
    {/if}
    <button
      type="button"
      class="input-sheet-btn"
      onclick={() => openTextSheet(sheet)}
      title="Otevřít editor: {noun}"
      aria-label="Otevřít editor: {noun}"
    >
      <PencilSimple size={16} weight="bold" />
    </button>
  </div>
{/snippet}

<ModuleShell
  title="Posuny"
  hasAlphabet={true}
  hasWarning={isNonStandardAlphabet}
  onReset={handleReset}
  podklad={{
    kind: 'text',
    required: true,
    empty: !text.trim(),
    title: 'Šifrový text',
    description: 'Text se posune podle zvoleného nástroje: Cézar, Vigenère nebo Autokey.',
    format: 'Šifrový text, mezery a interpunkce zůstanou.',
    example: 'WKLV LV D VHFUHW',
    value: text,
    onSave: (val) => {
      text = val;
    }
  }}
  {bar}
>
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

  {#snippet variants()}
    <SegmentedControl
      options={SHIFT_SEGMENT_OPTIONS}
      value={activeSubmodule}
      size="sm"
      onChange={(m) => {
        activeSubmodule = m;
      }}
      ariaLabel="Výběr šifrovacího nástroje"
    />
  {/snippet}

  {#snippet input()}
    {#if activeSubmodule === 'caesar'}
      <!-- Caesar has no parameter; its row slot keeps the Vigenère / Autokey height -->
      <!-- Easter egg: Caesar's 23 daggers in the reserved spacer slot -->
      <button
        type="button"
        class="input-row-spacer"
        class:daggers-shaking={isDaggersShaking}
        onclick={handleDaggerClick}
        aria-label="Skrytá funkce: Cézarovy dýky"
      >
        {#if daggerCount > 0}
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
    {:else if activeSubmodule === 'vigenere'}
      {@render keyRow('key', keyText, 'Heslo nebo čísla…', 'klíč')}
    {:else if activeSubmodule === 'autokey'}
      {@render keyRow('primer', autokeyPrimer, 'Heslo…', 'heslo')}
    {/if}
  {/snippet}

  {#snippet menuOptions()}
    <MenuGroup title="Abeceda">
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
    </MenuGroup>

    <MenuGroup title="Zobrazení">
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
    </MenuGroup>
  {/snippet}

  {#snippet reference()}
    <ShiftsReference letters={currentLetters} activeTool={activeSubmodule} />
  {/snippet}
</ModuleShell>

<TextEntrySheet
  open={activeTextSheet !== null}
  title={activeTextSheet === 'key' ? 'Šifrovací klíč' : 'Počáteční heslo'}
  value={activeTextSheet === 'key' ? keyText : autokeyPrimer}
  placeholder={
    activeTextSheet === 'key'
      ? 'Zadejte heslo nebo číselný klíč…'
      : 'Zadejte heslo pro autokey…'
  }
  onSave={(val) => {
    if (activeTextSheet === 'key') keyText = val;
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

  /* Parameter row: a trigger that opens TextEntrySheet, never an inline field */
  .input-row {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    width: 100%;
    height: var(--utility-row-height);
    flex-shrink: 0;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: 2px 6px;
    box-sizing: border-box;
    transition: border-color 0.12s ease;
  }

  .input-row:focus-within {
    border-color: var(--color-border-focus);
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
    padding: 0 var(--space-xs);
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

  .input-clear-slot {
    flex: none;
    display: flex;
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
    transition: background-color 0.1s ease, color 0.1s ease;
  }

  .input-sheet-btn:active {
    color: var(--color-accent-primary);
    background-color: var(--color-surface-active);
  }

  /* Caesar: empty slot of the parameter row's height, home of the dagger easter egg */
  .input-row-spacer {
    height: var(--utility-row-height);
    flex-shrink: 0;
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
    padding: 0 var(--space-xs);
    box-sizing: border-box;
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
</style>
