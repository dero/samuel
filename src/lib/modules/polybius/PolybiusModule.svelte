<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import SlideToAction from '../../components/ui/SlideToAction.svelte';
  import SpaceCommitButton from '../../components/ui/SpaceCommitButton.svelte';
  import BackspaceButton from '../../components/ui/BackspaceButton.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import AlphabetSelect from '../../components/ui/AlphabetSelect.svelte';
  import PolybiusOmissionModal from './PolybiusOmissionModal.svelte';
  import PolybiusReference from './PolybiusReference.svelte';
  import {
    POLYBIUS_CONFIGS,
    polybiusCoordToChar,
    type PolybiusSize,
    type PolybiusCoordLabel
  } from './polybiusData';
  import { alphabet, type AlphabetLayout } from '../../state/alphabet.svelte';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import { localSettingsService } from '../../services/localSettingsService';
  import { navigation } from '../../state/navigation.svelte';
  import { Warning, Sliders } from 'phosphor-svelte';

  const modSettings = localSettingsService.forModule('polybius');

  let text = $state<string>(modSettings.getString('text', ''));
  let polybiusSize = $state<PolybiusSize>(
    (modSettings.getString('size', '5x5') as PolybiusSize) || '5x5'
  );
  let polybiusCoordLabels = $state<PolybiusCoordLabel>(
    (modSettings.getString('coordLabels', 'numbers') as PolybiusCoordLabel) || 'numbers'
  );

  const sizeOptions: SegmentOption<PolybiusSize>[] = [
    { id: '5x5', label: '5×5 (25)' },
    { id: '6x6', label: '6×6 (36)' }
  ];

  let selectedRow = $state<number | null>(null);
  let selectedCol = $state<number | null>(null);

  // Alphabet per size
  let alphabetMap = $state<Record<string, string>>({
    '5x5': modSettings.getString('alphabet:5x5', 'english-26'),
    '6x6': modSettings.getString('alphabet:6x6', 'alphanumeric-36')
  });

  function setSizeAlphabet(size: PolybiusSize, alphaId: string) {
    alphabetMap = { ...alphabetMap, [size]: alphaId };
    modSettings.setString('alphabet:' + size, alphaId);
  }

  $effect(() => {
    modSettings.update({
      text,
      size: polybiusSize,
      coordLabels: polybiusCoordLabels
    });
  });

  const activeConfig = $derived(POLYBIUS_CONFIGS[polybiusSize]);
  const currentAlphabetId = $derived<string>(alphabetMap[polybiusSize] ?? activeConfig.defaultAlphabetId);
  const currentLayout = $derived<AlphabetLayout>(
    alphabet.getLayout(currentAlphabetId) ?? alphabet.layouts[0]
  );

  const isNonStandardAlphabet = $derived(
    !activeConfig.standardAlphabetIds.includes(currentAlphabetId)
  );

  $effect(() => {
    navigation.setMenuWarning(isNonStandardAlphabet);
    return () => navigation.setMenuWarning(false);
  });

  // Omission state
  const omissionStorageKey = $derived(`polybius:omitted:${polybiusSize}:${currentAlphabetId}`);
  let isOmissionModalOpen = $state<boolean>(false);
  let omittedLetters = $state<string[]>([]);

  $effect(() => {
    const cap = activeConfig.capacity;
    const rawLetters = currentLayout.letters;
    const key = omissionStorageKey;
    const stored = modSettings.getJSON<string[] | null>(key, null);

    if (stored !== null) {
      omittedLetters = stored;
    } else {
      if (rawLetters.length === cap + 1 && rawLetters.includes('Q')) {
        omittedLetters = ['Q'];
        modSettings.setJSON(key, ['Q']);
      } else if (rawLetters.length <= cap) {
        omittedLetters = [];
        modSettings.setJSON(key, []);
      } else {
        omittedLetters = [];
        isOmissionModalOpen = true;
      }
    }
  });

  const omittedPillText = $derived.by(() => {
    if (omittedLetters.length === 0) return '(žádné)';
    if (omittedLetters.length <= 3) return omittedLetters.join(', ');
    return omittedLetters.slice(0, 3).join(', ') + '... (+' + (omittedLetters.length - 3) + ')';
  });

  function handleSaveOmitted(newOmitted: string[]) {
    omittedLetters = newOmitted;
    modSettings.setJSON(omissionStorageKey, newOmitted);
    isOmissionModalOpen = false;
    toast.show('Vynechaná písmena uložena', 'success');
  }

  const effectiveLetters = $derived.by<string[]>(() => {
    const omittedSet = new Set(omittedLetters);
    const filtered = currentLayout.letters.filter((ch) => !omittedSet.has(ch));
    const cap = activeConfig.capacity;
    if (filtered.length >= cap) return filtered.slice(0, cap);
    const padded = [...filtered];
    while (padded.length < cap) padded.push(' ');
    return padded;
  });

  const pendingChar = $derived.by<string | null>(() => {
    if (selectedRow !== null && selectedCol !== null) {
      return polybiusCoordToChar(selectedRow, selectedCol, activeConfig.sizeNum, effectiveLetters);
    }
    return null;
  });

  function getCoordLabel(index: number): string {
    if (polybiusCoordLabels === 'letters') {
      return String.fromCharCode(65 + index - 1);
    }
    return String(index);
  }

  function handleSizeChange(newSize: PolybiusSize) {
    if (polybiusSize === newSize) return;
    settings.vibrate(25);
    polybiusSize = newSize;
    selectedRow = null;
    selectedCol = null;
  }

  function handleCoordSelect(axis: 1 | 2, val: number) {
    settings.vibrate(18);
    if (axis === 1) {
      selectedRow = selectedRow === val ? null : val;
    } else {
      selectedCol = selectedCol === val ? null : val;
    }

    if (selectedRow !== null && selectedCol !== null) {
      const char = polybiusCoordToChar(selectedRow, selectedCol, activeConfig.sizeNum, effectiveLetters);
      if (char) {
        settings.vibrate(28);
        text += char;
        selectedRow = null;
        selectedCol = null;
      }
    }
  }

  function handleLetterTap(char: string) {
    settings.vibrate(18);
    text += char;
    selectedRow = null;
    selectedCol = null;
  }

  function handleSpace() {
    text += ' ';
    selectedRow = null;
    selectedCol = null;
  }

  function handleBackspace() {
    if (selectedRow !== null || selectedCol !== null) {
      selectedRow = null;
      selectedCol = null;
    } else if (text.length > 0) {
      text = text.slice(0, -1);
    }
  }

  function handleClearAll() {
    settings.vibrate(35);
    text = '';
    selectedRow = null;
    selectedCol = null;
  }
</script>

<ModuleShell
  title="Polybius"
  onReset={handleClearAll}
  onPaste={(pasted) => (text += pasted.toUpperCase())}
>
  {#snippet menuOptions()}
    <div class="menu-group">
      <div class="menu-group-title">Popisky souřadnic</div>
      <SegmentedControl
        options={[
          { id: 'numbers', label: polybiusSize === '6x6' ? 'Čísla (1–6)' : 'Čísla (1–5)' },
          { id: 'letters', label: polybiusSize === '6x6' ? 'Písmena (A–F)' : 'Písmena (A–E)' }
        ]}
        value={polybiusCoordLabels}
        ariaLabel="Popisky souřadnic"
        onChange={(v) => (polybiusCoordLabels = v)}
      />
    </div>

    <div class="menu-group">
      <div class="menu-group-title">Abeceda nástroje</div>
      {#if isNonStandardAlphabet}
        <div class="nonstandard-banner" role="alert">
          <div class="banner-top">
            <span class="banner-icon"><Warning size={20} weight="fill" /></span>
            <div class="banner-text">
              <span class="banner-title">Nestandardní abeceda</span>
              <p class="banner-desc">
                Pro mřížku {polybiusSize} je obvyklá {polybiusSize === '6x6'
                  ? 'Alfanumerická (36 znaků)'
                  : 'Anglická (26 znaků)'}.
              </p>
            </div>
          </div>
        </div>
      {/if}

      <AlphabetSelect
        value={currentAlphabetId}
        onChange={(newId) => setSizeAlphabet(polybiusSize, newId)}
      />
    </div>

    {#if currentLayout.letters.length > activeConfig.capacity}
      <div class="menu-group">
        <div class="menu-group-title">Vynechaná písmena do matice</div>
        <button
          type="button"
          class="omission-open-btn"
          onclick={() => {
            settings.vibrate(20);
            isOmissionModalOpen = true;
          }}
        >
          <span class="omission-btn-icon"><Sliders size={18} weight="duotone" /></span>
          <div class="omission-btn-content">
            <span class="omission-btn-label">Vynecháno ({omittedLetters.length})</span>
            <span class="omission-btn-val">{omittedPillText}</span>
          </div>
        </button>
      </div>
    {/if}
  {/snippet}

  {#snippet reference()}
    <PolybiusReference />
  {/snippet}

  {#snippet output()}
    <TranslationCard
      {text}
      pendingText={pendingChar ?? ''}
      emptyHint="Dvojice souřadnic (1–5 či A–E) přeloží znak v matici."
    />
  {/snippet}

  {#snippet input()}
    <div class="zone-input-flow">
      <!-- 1. Sub-Toolbar: Přepínač velikosti 5x5 vs 6x6 (36px) -->
      <div class="subtoolbar-container">
        <SegmentedControl
          options={sizeOptions}
          value={polybiusSize}
          size="sm"
          ariaLabel="Velikost Polybiova čtverce"
          onChange={handleSizeChange}
        />
      </div>

      <!-- 2. Vstupní zóna: Matice Polybia -->
      <div class="polybius-stage">
        <div class="polybius-board-wrapper" class:size-6={polybiusSize === '6x6'}>
          <div
            class="polybius-grid"
            style:grid-template-columns="32px repeat({activeConfig.sizeNum}, 1fr)"
          >
            <!-- Horní prázdný roh + tlačítka sloupců -->
            <div class="polybius-corner-cell" aria-hidden="true"></div>
            {#each Array.from({ length: activeConfig.sizeNum }, (_, i) => i + 1) as c}
              {@const isColActive = selectedCol === c}
              <button
                type="button"
                class="polybius-header-btn col-header-btn"
                class:is-active={isColActive}
                onpointerdown={(e) => {
                  if (e.button !== 0 && e.pointerType === 'mouse') return;
                  e.preventDefault();
                  handleCoordSelect(2, c);
                }}
                aria-label={`Sloupec ${getCoordLabel(c)}`}
              >
                <span>{getCoordLabel(c)}</span>
              </button>
            {/each}

            <!-- Řádky s hlavičkou a písmeny -->
            {#each Array.from({ length: activeConfig.sizeNum }, (_, i) => i + 1) as r}
              {@const isRowActive = selectedRow === r}
              <button
                type="button"
                class="polybius-header-btn row-header-btn"
                class:is-active={isRowActive}
                onpointerdown={(e) => {
                  if (e.button !== 0 && e.pointerType === 'mouse') return;
                  e.preventDefault();
                  handleCoordSelect(1, r);
                }}
                aria-label={`Řádek ${getCoordLabel(r)}`}
              >
                <span>{getCoordLabel(r)}</span>
              </button>
              {#each Array.from({ length: activeConfig.sizeNum }, (_, i) => i + 1) as c}
                {@const idx = (r - 1) * activeConfig.sizeNum + (c - 1)}
                {@const char = effectiveLetters[idx] ?? ''}
                {@const isExact = selectedRow === r && selectedCol === c}
                {@const isHighlighted = (selectedRow === r || selectedCol === c) && (selectedRow !== null || selectedCol !== null)}
                <div
                  class="polybius-cell"
                  class:is-row-matched={selectedRow === r}
                  class:is-col-matched={selectedCol === c}
                  class:is-exact-matched={isExact}
                >
                  {#if char && char !== ' '}
                    <button
                      type="button"
                      class="polybius-char-btn"
                      class:is-highlighted={isHighlighted}
                      class:is-exact={isExact}
                      onpointerdown={(e) => {
                        if (e.button !== 0 && e.pointerType === 'mouse') return;
                        e.preventDefault();
                        handleLetterTap(char);
                      }}
                      aria-label={`Písmeno ${char}`}
                    >
                      <span class="polybius-char">{char}</span>
                    </button>
                  {:else}
                    <div class="polybius-empty-cell"></div>
                  {/if}
                </div>
              {/each}
            {/each}
          </div>
        </div>
      </div>

      <!-- 3. Utilitní trojblok: Clear | Space/Commit | Backspace -->
      <div class="keypad-utility-row-3col">
        <SlideToAction
          disabled={!text && !pendingChar}
          onAction={handleClearAll}
          ariaLabel="Vymazat text podržením"
        />

        <SpaceCommitButton
          pendingChar={pendingChar}
          disabled={false}
          onSpace={handleSpace}
          onCommit={() => {
            if (pendingChar) {
              text += pendingChar;
              selectedRow = null;
              selectedCol = null;
            }
          }}
        />

        <BackspaceButton
          disabled={!text && !pendingChar}
          hasActiveSelection={!!pendingChar}
          onAction={handleBackspace}
        />
      </div>
    </div>
  {/snippet}
</ModuleShell>

{#if isOmissionModalOpen}
  <PolybiusOmissionModal
    open={isOmissionModalOpen}
    alphabetName={currentLayout.name}
    allLetters={currentLayout.letters}
    targetCapacity={activeConfig.capacity}
    initialOmitted={omittedLetters}
    onConfirm={handleSaveOmitted}
    onClose={() => (isOmissionModalOpen = false)}
  />
{/if}

<style>
  .polybius-stage {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .polybius-board-wrapper {
    width: 100%;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .polybius-grid {
    display: grid;
    gap: 2px;
    padding: 2px;
    width: 100%;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    border-radius: var(--radius-sm);
    overflow: hidden;
    background-color: var(--color-bg-canvas);
    border: 1px solid var(--color-border-subtle);
    box-sizing: border-box;
  }

  .polybius-header-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface-1);
    border: none;
    border-radius: 2px;
    font-size: var(--text-xs);
    font-weight: 700;
    font-family: var(--font-mono);
    color: var(--color-text-secondary);
    cursor: pointer;
    touch-action: none;
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    transition: background-color 0.12s ease, box-shadow 0.08s ease, color 0.12s ease;
    padding: 0;
  }

  .polybius-header-btn:active {
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
    transform: none;
  }

  .polybius-header-btn.col-header-btn {
    min-height: 32px;
    height: 32px;
  }

  .polybius-header-btn.row-header-btn {
    min-width: 32px;
    width: 32px;
    height: 100%;
  }

  .polybius-header-btn.is-active {
    background: var(--color-accent-primary);
    color: #000000;
    font-weight: 800;
    box-shadow: 0 0 8px rgba(0, 210, 255, 0.4), inset 0 0 4px rgba(255, 255, 255, 0.4);
  }

  .polybius-cell {
    display: flex;
    aspect-ratio: 1 / 1;
    min-width: 0;
    min-height: 0;
    border-radius: 2px;
    transition: all 0.15s ease;
  }

  .polybius-cell.is-row-matched,
  .polybius-cell.is-col-matched {
    background: rgba(0, 210, 255, 0.06);
  }

  .polybius-cell.is-exact-matched {
    background: rgba(0, 210, 255, 0.16);
  }

  .polybius-char-btn {
    width: 100%;
    height: 100%;
    min-height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface-2);
    border: none;
    border-radius: 2px;
    color: var(--color-text-primary);
    font-size: 17px;
    font-weight: 700;
    cursor: pointer;
    touch-action: none;
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.10),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    transition: background-color 0.12s ease, box-shadow 0.08s ease, color 0.12s ease;
    padding: 0;
  }

  .polybius-char-btn:active {
    background: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
    transform: none;
  }

  .polybius-char-btn.is-highlighted {
    box-shadow: inset 0 0 0 1.5px rgba(0, 210, 255, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15);
    color: var(--color-text-primary);
  }

  .polybius-char-btn.is-exact {
    background: rgba(0, 210, 255, 0.22);
    color: var(--color-accent-primary);
    box-shadow: 0 0 10px rgba(0, 210, 255, 0.4), inset 0 0 0 1.5px var(--color-accent-primary);
  }

  .polybius-empty-cell {
    width: 100%;
    height: 100%;
    border-radius: var(--radius-xs);
    background: rgba(255, 255, 255, 0.02);
  }

  .menu-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    margin-bottom: var(--space-md);
  }

  .menu-group-title {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    color: var(--color-text-secondary);
    letter-spacing: 0.5px;
  }

  .nonstandard-banner {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    background-color: rgba(245, 158, 11, 0.12);
    border: 1px solid var(--color-accent-warning);
    border-radius: var(--radius-sm);
    padding: var(--space-sm) var(--space-md);
    margin-bottom: var(--space-sm);
  }

  .banner-top {
    display: flex;
    align-items: flex-start;
    gap: var(--space-sm);
  }

  .banner-icon {
    color: var(--color-accent-warning);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    margin-top: 1px;
  }

  .banner-text {
    flex: 1;
    min-width: 0;
  }

  .banner-title {
    display: block;
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: 2px;
  }

  .banner-desc {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    margin: 0;
    line-height: 1.4;
  }

  .omission-open-btn {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: var(--space-sm) var(--space-md);
    width: 100%;
    text-align: left;
    cursor: pointer;
  }

  .omission-open-btn:active {
    background-color: var(--color-surface-active);
  }

  .omission-btn-icon {
    color: var(--color-accent-primary);
    display: flex;
    align-items: center;
  }

  .omission-btn-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .omission-btn-label {
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    font-weight: 600;
  }

  .omission-btn-val {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    font-family: var(--font-mono);
  }
</style>
