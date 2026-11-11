<script lang="ts">
  import { untrack } from 'svelte';
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import type { ModuleBarConfig } from '../../components/layout/ModuleBar.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import MenuGroup from '../../components/ui/MenuGroup.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import AlphabetSelect from '../../components/ui/AlphabetSelect.svelte';
  import NonStandardAlphabetBanner from '../../components/ui/NonStandardAlphabetBanner.svelte';
  import Filmstrip from './Filmstrip.svelte';
  import TargetAlphabetKeypad from './TargetAlphabetKeypad.svelte';
  import SubstitutionReference from './SubstitutionReference.svelte';
  import {
    solveSubstitution,
    getAlphabetLettersInText,
    keepApplicableMapping
  } from './substitutionSolver';
  import { alphabet } from '../../state/alphabet.svelte';
  import { navigation } from '../../state/navigation.svelte';
  import { toast } from '../../state/toast.svelte';
  import { localSettingsService } from '../../services/localSettingsService';

  const modSettings = localSettingsService.forModule('substitution');

  const DEFAULT_ALPHABET_ID = 'english-26';

  // State
  let ciphertext = $state<string>(modSettings.getString('ciphertext', ''));
  let mapping = $state<Record<string, string>>(
    modSettings.getJSON<Record<string, string>>('mapping', {})
  );
  let selectedLetter = $state<string | null>(null);
  let alphabetId = $state<string>(
    modSettings.getString('alphabet_id', DEFAULT_ALPHABET_ID)
  );
  let allowHomophones = $state<boolean>(
    modSettings.getBoolean('allow_homophones', false)
  );
  let allowUnusedLetters = $state<boolean>(
    modSettings.getBoolean('allow_unused_letters', false)
  );

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

  const lettersInText = $derived(
    getAlphabetLettersInText(ciphertext, currentLetters)
  );

  // While the text or the Menu options are being changed, assignments that stopped
  // applying only rest (they come back if the letter does); leaving the tab drops them
  const appliedMapping = $derived(
    keepApplicableMapping(mapping, ciphertext, currentLetters, allowUnusedLetters)
  );

  const result = $derived(
    solveSubstitution(ciphertext, appliedMapping, currentLetters)
  );

  const assignedCount = $derived(
    [...lettersInText].filter((letter) => !!appliedMapping[letter]).length
  );

  const bar = $derived.by<ModuleBarConfig>(() => {
    if (!ciphertext.trim()) return { empty: true, hint: 'Vložte šifrový text.' };
    if (lettersInText.size === 0) return { warning: 'Text neobsahuje písmena abecedy.' };
    return {
      empty: assignedCount === 0,
      hint: 'Vyberte znak v pásu, pak písmeno.',
      status: `Přiřazeno ${assignedCount} z ${lettersInText.size}`
    };
  });

  /** Drops the work that no longer applies to the text and says so. */
  function pruneMapping() {
    const dropped = Object.keys(mapping).length - Object.keys(appliedMapping).length;
    const isSelectionGone =
      !currentLetters.includes(selectedLetter ?? '') ||
      (!allowUnusedLetters && !lettersInText.has(selectedLetter ?? ''));
    if (selectedLetter && isSelectionGone) {
      selectedLetter = null;
    }
    if (dropped === 0) return;
    mapping = appliedMapping;
    toast.show(`Zrušeno přiřazení: ${dropped}`, { type: 'warning' });
  }

  // Stored work from a session that ended inside Podklad or Menu
  pruneMapping();

  // Leaving Podklad or Menu (any way) settles the edit
  let previousView = untrack(() => navigation.subView);
  $effect(() => {
    const view = navigation.subView;
    if (view !== previousView && (previousView === 'podklad' || previousView === 'menu')) {
      untrack(pruneMapping);
    }
    previousView = view;
  });

  // Handlers
  function handleAssignLetter(cipherLetter: string, targetLetter: string) {
    mapping = {
      ...mapping,
      [cipherLetter]: targetLetter
    };
    selectedLetter = null;
  }

  function handleUnassignLetter(cipherLetter: string) {
    if (mapping[cipherLetter]) {
      const next = { ...mapping };
      delete next[cipherLetter];
      mapping = next;
    }
    selectedLetter = null;
  }

  function handleResetMappings() {
    mapping = {};
    selectedLetter = null;
    toast.show('✓ Přiřazení zrušena', { type: 'success' });
  }

  // Data and Menu options back to defaults
  function handleReset() {
    ciphertext = '';
    mapping = {};
    selectedLetter = null;
    alphabetId = DEFAULT_ALPHABET_ID;
    allowHomophones = false;
    allowUnusedLetters = false;
  }
</script>

<ModuleShell
  title="Substituce"
  hasAlphabet={true}
  hasWarning={isNonStandardAlphabet}
  onReset={handleReset}
  podklad={{
    kind: 'text',
    required: true,
    empty: !ciphertext.trim(),
    title: 'Šifrový text',
    description: 'Písmenům šifry pak dole přiřadíte písmena otevřeného textu.',
    format: 'Šifrový text, mezery a interpunkce zůstanou.',
    example: 'XLMW MW E WIGVIX',
    value: ciphertext,
    onSave: (val) => {
      ciphertext = val;
    }
  }}
  {bar}
>
  {#snippet output()}
    <div class="substitution-output-wrapper">
      <TranslationCard text={result.plainText}>
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

  {#snippet input()}
    <Filmstrip
      letters={currentLetters}
      mapping={appliedMapping}
      {selectedLetter}
      {lettersInText}
      {allowUnusedLetters}
      onSelectLetter={(letter) => (selectedLetter = letter)}
      onResetAll={handleResetMappings}
    />

    <TargetAlphabetKeypad
      letters={currentLetters}
      {selectedLetter}
      mapping={appliedMapping}
      {allowHomophones}
      onAssign={handleAssignLetter}
      onUnassign={handleUnassignLetter}
    />
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

    <MenuGroup title="Šifra">
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
    </MenuGroup>
  {/snippet}

  {#snippet reference()}
    <SubstitutionReference />
  {/snippet}
</ModuleShell>

<style>
  .substitution-output-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
</style>
