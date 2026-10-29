<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import AlphabetSelect from '../../components/ui/AlphabetSelect.svelte';
  import TextEntrySheet from '../../components/ui/TextEntrySheet.svelte';
  import Filmstrip from './Filmstrip.svelte';
  import TargetAlphabetKeypad from './TargetAlphabetKeypad.svelte';
  import SubstitutionReference from './SubstitutionReference.svelte';
  import { solveSubstitution, getAlphabetLettersInText } from './substitutionSolver';
  import { alphabet } from '../../state/alphabet.svelte';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import { navigation } from '../../state/navigation.svelte';
  import { localSettingsService } from '../../services/localSettingsService';
  import { PencilSimple } from 'phosphor-svelte';
  import NonStandardAlphabetBanner from '../../components/ui/NonStandardAlphabetBanner.svelte';

  const modSettings = localSettingsService.forModule('substitution');

  // State
  let ciphertext = $state<string>(modSettings.getString('ciphertext', ''));
  let mapping = $state<Record<string, string>>(
    modSettings.getJSON<Record<string, string>>('mapping', {})
  );
  let selectedLetter = $state<string | null>(null);
  let alphabetId = $state<string>(
    modSettings.getString('alphabet_id', 'english-26')
  );
  let allowHomophones = $state<boolean>(
    modSettings.getBoolean('allow_homophones', false)
  );
  let allowUnusedLetters = $state<boolean>(
    modSettings.getBoolean('allow_unused_letters', false)
  );

  // Text entry sheet visibility
  let showTextSheet = $state<boolean>(false);

  // Persistence
  $effect(() => {
    modSettings.setString('ciphertext', ciphertext);
    modSettings.setJSON('mapping', mapping);
    modSettings.setString('alphabet_id', alphabetId);
    modSettings.setBoolean('allow_homophones', allowHomophones);
    modSettings.setBoolean('allow_unused_letters', allowUnusedLetters);
  });

  // Alphabet layout
  const currentLayout = $derived(
    alphabet.getLayout(alphabetId) ?? alphabet.layouts[0]
  );
  const currentLetters = $derived(currentLayout.letters);

  // Non-standard alphabet indicator in menu
  const isNonStandardAlphabet = $derived(
    !['english-26', 'english-ch-27'].includes(alphabetId)
  );

  // Substitution Solver Output
  const result = $derived(
    solveSubstitution(ciphertext, mapping, currentLetters)
  );

  const lettersInText = $derived(
    getAlphabetLettersInText(ciphertext, currentLetters)
  );

  // Handlers
  function handleAssignLetter(cipherLetter: string, targetLetter: string) {
    mapping = {
      ...mapping,
      [cipherLetter]: targetLetter
    };
    // Decision 1: Deselect after assignment
    selectedLetter = null;
  }

  function handleUnassignLetter(cipherLetter: string) {
    if (mapping[cipherLetter]) {
      const next = { ...mapping };
      delete next[cipherLetter];
      mapping = next;
    }
    // Deselect after unassign
    selectedLetter = null;
  }

  function handleResetMappings() {
    mapping = {};
    selectedLetter = null;
    toast.show('✓ Mapování vymazáno', { type: 'success' });
  }

  function handleResetAll() {
    settings.vibrate(35);
    ciphertext = '';
    mapping = {};
    selectedLetter = null;
    toast.show('✓ Modul vyčištěn', { type: 'success' });
  }

</script>

<ModuleShell
  title="Substituce"
  hasAlphabet={true}
  hasWarning={isNonStandardAlphabet}
  onReset={handleResetAll}
>
  <!-- TOP ZONE: Output (TranslationCard) -->
  {#snippet output()}
    <div class="substitution-output-wrapper">
      <TranslationCard
        text={result.plainText}
        emptyHint="Zadejte nebo vložte šifrový text."
      >
        {#snippet children()}
          {#each result.tokens as token}
            {#if token.isUnmappedLetter}
              <span class="unmapped-char">{token.display}</span>
            {:else}
              <span>{token.display}</span>
            {/if}
          {/each}
        {/snippet}
      </TranslationCard>
    </div>
  {/snippet}

  <!-- BOTTOM ZONE: Input & Keypad -->
  {#snippet input()}
    {#if !ciphertext.trim()}
      <!-- INITIAL EMPTY STATE: Call to Action for entering text -->
      <div class="empty-input-state">
        <button
          type="button"
          class="enter-text-cta-btn"
          onclick={() => {
            settings.vibrate(20);
            showTextSheet = true;
          }}
        >
          <PencilSimple size={20} weight="bold" />
          <span>Zadat šifrový text</span>
        </button>
      </div>
    {:else}
      <!-- ACTIVE STATE: Filmstrip + Target Alphabet Keypad -->
      <div class="zone-input-flow">
        <Filmstrip
          letters={currentLetters}
          {mapping}
          {selectedLetter}
          {lettersInText}
          {allowUnusedLetters}
          onSelectLetter={(letter) => (selectedLetter = letter)}
          onResetAll={handleResetMappings}
        />

        <TargetAlphabetKeypad
          letters={currentLetters}
          {selectedLetter}
          {mapping}
          {allowHomophones}
          onAssign={handleAssignLetter}
          onUnassign={handleUnassignLetter}
        />
      </div>
    {/if}
  {/snippet}

  <!-- CONTEXTUAL MENU: Nastavení modulu -->
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
      <div class="menu-group-title">Šifra</div>
      <OptionRow
        label="Povolit nepoužitá písmena"
        hint="Přiřazovat i znaky, které v šifře nejsou"
        checked={allowUnusedLetters}
        onChange={(val) => {
          allowUnusedLetters = val;
        }}
      />
      <OptionRow
        label="Povolit homofony"
        hint="Jedno písmeno pro více šifrových znaků"
        checked={allowHomophones}
        onChange={(val) => {
          allowHomophones = val;
        }}
      />
    </div>

    <div class="menu-group">
      <div class="menu-group-title">Šifrový text</div>
      <button
        type="button"
        class="menu-action-row"
        onclick={() => {
          settings.vibrate(20);
          showTextSheet = true;
        }}
      >
        <PencilSimple size={18} weight="bold" />
        <span>Upravit šifrový text</span>
      </button>
    </div>
  {/snippet}

  <!-- REFERENCE CHEAT SHEET -->
  {#snippet reference()}
    <SubstitutionReference />
  {/snippet}
</ModuleShell>

<!-- Fullscreen Text Entry Sheet -->
<TextEntrySheet
  open={showTextSheet}
  title="Šifrový text"
  placeholder="Vložte nebo napište šifrovaný text..."
  value={ciphertext}
  onSave={(val) => {
    ciphertext = val;
  }}
  onClose={() => {
    showTextSheet = false;
  }}
/>

<style>
  .substitution-output-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .zone-input-flow {
    display: flex;
    flex-direction: column;
    gap: var(--zone-input-gap, 8px);
    width: 100%;
  }

  /* Empty state for input zone */
  .empty-input-state {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    padding: 4px 0;
  }

  .enter-text-cta-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 52px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: calc(15px * var(--font-scale));
    font-weight: 700;
    cursor: pointer;
    touch-action: manipulation;
    transition: background-color 0.12s ease, border-color 0.12s ease;
  }

  .enter-text-cta-btn:active {
    background-color: var(--color-surface-active);
    border-color: var(--color-accent-primary);
  }

  /* Menu styles */
  .menu-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .menu-group-title {
    font-size: calc(11px * var(--font-scale));
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .menu-action-row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: 44px;
    padding: 0 12px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: calc(14px * var(--font-scale));
    font-weight: 600;
    cursor: pointer;
    touch-action: manipulation;
  }

  .menu-action-row:active {
    background-color: var(--color-surface-active);
  }

</style>
