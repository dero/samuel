<script lang="ts">
  import { onDestroy } from 'svelte';
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import type { ModuleBarConfig } from '../../components/layout/ModuleBar.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import InterlinearText, { type InterlinearToken } from '../../components/ui/InterlinearText.svelte';
  import Chassis from '../../components/ui/Chassis.svelte';
  import Keycap from '../../components/ui/Keycap.svelte';
  import KeypadBottomRow from '../../components/ui/KeypadBottomRow.svelte';
  import SpaceCommitButton from '../../components/ui/SpaceCommitButton.svelte';
  import MenuAction from '../../components/ui/MenuAction.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import MobileReference from './MobileReference.svelte';
  import { PHONE_GRID, getPhoneKeyLetters } from './mobileData';
  import { digitField, fieldToChar, wordToFields } from './mobileSolver';
  import { getFallbackT9Word } from './t9Data';
  import { t9Service } from './t9Service';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import { versionService } from '../../services/versionService.svelte';
  import { navigation } from '../../state/navigation.svelte';
  import { createModuleState } from '../../state/moduleState.svelte';
  import { parseNotation, serializeNotation } from '../../utils/notation';
  import { DownloadSimple } from 'phosphor-svelte';

  type PhoneMode = 'multitap' | 't9';

  const LONG_PRESS_MS = 420;
  const MULTITAP_COMMIT_MS = 1100;

  const { state: modState, reset: resetModState } = createModuleState('mobile', {
    fields: [] as string[],
    phoneMode: 'multitap' as PhoneMode
  });

  const phoneModeOptions: SegmentOption<PhoneMode>[] = [
    { id: 'multitap', label: 'SMS' },
    { id: 't9', label: 'T9 Predikce' }
  ];

  // Multi-tap state
  let pendingKey = $state<string | null>(null);
  let pendingTapIndex = $state<number>(0);
  let commitTimer: ReturnType<typeof setTimeout> | null = null;

  // T9 state
  let t9Digits = $state<string>('');
  let t9Candidates = $state<string[]>([]);
  let t9CandidateIndex = $state<number>(0);
  let t9ReqCounter = 0;

  // A key acts on pointerdown, so a long press first undoes what its tap did
  interface PressSnapshot {
    keyId: string;
    fields: string[];
    pendingKey: string | null;
    pendingTapIndex: number;
    t9Digits: string;
    t9Candidates: string[];
    t9CandidateIndex: number;
  }

  let armedPress: PressSnapshot | null = null;
  let longPressTimer: ReturnType<typeof setTimeout> | null = null;

  const isT9 = $derived(modState.phoneMode === 't9');
  const isDictionaryMissing = $derived(isT9 && !versionService.state.isDbInstalled);

  const pendingField = $derived(pendingKey ? pendingKey.repeat(pendingTapIndex + 1) : '');
  const pendingChar = $derived(pendingField ? (fieldToChar(pendingField) ?? '') : '');

  const activeT9Candidate = $derived<string>(
    isT9 && t9Digits ? t9Candidates[t9CandidateIndex] || getFallbackT9Word(t9Digits) : ''
  );

  const pendingDisplay = $derived<string>(isT9 ? activeT9Candidate : pendingChar);
  const isEmpty = $derived(modState.fields.length === 0 && !pendingDisplay);

  const tokens = $derived<InterlinearToken[]>(
    modState.fields.map((field) => {
      if (field === '') return { primary: '', isSpace: true };
      const char = fieldToChar(field);
      if (char === null) {
        return {
          primary: '?',
          secondary: field,
          isError: true,
          errorText: `Neplatné pole „${field}“`
        };
      }
      if (char === ' ') return { primary: '␣', secondary: field, className: 'token-space' };
      return { primary: char, secondary: field };
    })
  );

  const pendingToken = $derived.by<InterlinearToken | null>(() => {
    if (isT9 && t9Digits) return { primary: activeT9Candidate, secondary: t9Digits, isPending: true };
    if (pendingField) {
      return { primary: pendingChar === ' ' ? '␣' : pendingChar, secondary: pendingField, isPending: true };
    }
    return null;
  });

  const plainText = $derived(modState.fields.map((f) => fieldToChar(f) ?? '?').join(''));

  const bar = $derived<ModuleBarConfig>({
    empty: isEmpty,
    hint: isT9 ? 'Každé písmeno jedním stiskem.' : 'Písmeno = počet stisků klávesy.',
    charCount: plainText.replace(/\s/g, '').length + (pendingToken ? 1 : 0),
    warning: isDictionaryMissing ? 'Slovník pro T9 není stažen' : null
  });

  function appendField(field: string) {
    modState.fields = [...modState.fields, field];
  }

  function clearCommitTimer() {
    if (commitTimer) {
      clearTimeout(commitTimer);
      commitTimer = null;
    }
  }

  function clearMultiTap() {
    clearCommitTimer();
    pendingKey = null;
    pendingTapIndex = 0;
  }

  function commitPendingField() {
    if (pendingKey) appendField(pendingField);
    clearMultiTap();
  }

  function handleMultiTap(keyId: string) {
    const letters = getPhoneKeyLetters(keyId);
    if (letters.length === 0) return;

    if (pendingKey === keyId) {
      pendingTapIndex = (pendingTapIndex + 1) % letters.length;
    } else {
      commitPendingField();
      pendingKey = keyId;
      pendingTapIndex = 0;
    }

    clearCommitTimer();
    commitTimer = setTimeout(commitPendingField, MULTITAP_COMMIT_MS);
  }

  async function fetchT9Candidates(digits: string) {
    // Candidates of the previous digits are stale from now on, and so is any lookup in flight
    const currentReq = ++t9ReqCounter;
    t9Candidates = [];
    t9CandidateIndex = 0;
    if (!digits) return;

    try {
      const result = await t9Service.query(digits, 6);
      if (currentReq === t9ReqCounter) {
        t9Candidates = result.candidates.length > 0 ? result.candidates : [getFallbackT9Word(digits)];
        t9CandidateIndex = 0;
      }
    } catch {
      if (currentReq === t9ReqCounter) {
        t9Candidates = [getFallbackT9Word(digits)];
        t9CandidateIndex = 0;
      }
    }
  }

  function clearT9() {
    t9ReqCounter++;
    t9Digits = '';
    t9Candidates = [];
    t9CandidateIndex = 0;
  }

  function commitT9Word(word: string, addSpace: boolean) {
    if (word) {
      const { fields } = modState;
      const needsSpace = fields.length > 0 && fieldToChar(fields[fields.length - 1]) !== ' ';
      modState.fields = [
        ...fields,
        ...(needsSpace ? [''] : []),
        ...wordToFields(word),
        ...(addSpace ? [''] : [])
      ];
    }
    clearT9();
  }

  function handleT9KeyTap(keyId: string) {
    if (keyId >= '2' && keyId <= '9') {
      t9Digits += keyId;
      fetchT9Candidates(t9Digits);
    } else if (keyId === '*') {
      if (t9Candidates.length > 1) {
        t9CandidateIndex = (t9CandidateIndex + 1) % t9Candidates.length;
      } else if (!t9Digits) {
        appendField('*');
      }
    } else if (keyId === '0') {
      if (t9Digits) {
        commitT9Word(activeT9Candidate, true);
      } else {
        appendField('');
      }
    } else if (keyId === '1') {
      if (t9Digits) commitT9Word(activeT9Candidate, false);
      appendField('1');
    } else if (keyId === '#') {
      if (t9Digits) {
        commitT9Word(activeT9Candidate, false);
      } else {
        appendField('#');
      }
    }
  }

  function handleKeyPress(keyId: string) {
    armedPress = {
      keyId,
      fields: modState.fields,
      pendingKey,
      pendingTapIndex,
      t9Digits,
      t9Candidates,
      t9CandidateIndex
    };

    if (isT9) {
      handleT9KeyTap(keyId);
    } else {
      handleMultiTap(keyId);
    }
  }

  function insertDigit(press: PressSnapshot) {
    modState.fields = press.fields;
    pendingKey = press.pendingKey;
    pendingTapIndex = press.pendingTapIndex;
    t9Digits = press.t9Digits;
    t9Candidates = press.t9Candidates;
    t9CandidateIndex = press.t9CandidateIndex;
    t9ReqCounter++; // drops the lookup the tap may have started

    if (isT9) {
      if (t9Digits) commitT9Word(activeT9Candidate, false);
    } else {
      commitPendingField();
    }
    appendField(digitField(press.keyId));
  }

  function cancelLongPress() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    armedPress = null;
  }

  // Runs right after Keycap's own pointerdown; keyboard presses never get here, so they stay taps
  function startLongPress() {
    const press = armedPress;
    cancelLongPress();
    if (!press) return;
    longPressTimer = setTimeout(() => {
      longPressTimer = null;
      insertDigit(press);
    }, LONG_PRESS_MS);
  }

  function handlePhoneModeChange(newMode: PhoneMode) {
    if (isT9) {
      if (t9Digits) commitT9Word(activeT9Candidate, false);
    } else {
      commitPendingField();
    }
    modState.phoneMode = newMode;
    if (newMode === 't9' && !versionService.state.isDbInstalled) {
      toast.show('Stáhněte slovník v Nastavení', 'warning');
    }
  }

  function handleCommit() {
    if (isT9 && t9Digits) {
      commitT9Word(activeT9Candidate, true);
    } else {
      commitPendingField();
    }
  }

  function handleBackspace() {
    if (isT9 && t9Digits) {
      t9Digits = t9Digits.slice(0, -1);
      fetchT9Candidates(t9Digits);
    } else if (pendingKey) {
      clearMultiTap();
    } else {
      modState.fields = modState.fields.slice(0, -1);
    }
  }

  function handleClearAll() {
    clearMultiTap();
    clearT9();
    modState.fields = [];
  }

  onDestroy(() => {
    clearCommitTimer();
    cancelLongPress();
    t9Service.terminate();
  });
</script>

<ModuleShell
  onReset={() => {
    // The SMS / T9 choice is the variant and stays
    const mode = modState.phoneMode;
    handleClearAll();
    resetModState();
    modState.phoneMode = mode;
  }}
  podklad={{
    kind: 'text',
    required: false,
    empty: isEmpty,
    title: 'Zápis',
    description: 'Klávesa opakovaná podle písmene, čárka dělí znaky.',
    example: '2,44,666,5',
    placeholder: 'Např. 2,44,666,5',
    autocapitalize: 'none',
    value: serializeNotation(pendingField ? [...modState.fields, pendingField] : modState.fields),
    onSave: (val) => {
      clearMultiTap();
      clearT9();
      modState.fields = parseNotation(val);
    }
  }}
  {bar}
>
  {#snippet menuOptions()}
    {#if isDictionaryMissing}
      <MenuAction
        label="Stáhnout slovník pro T9"
        hint="V Nastavení, {versionService.formattedDbSize}"
        icon={DownloadSimple}
        onClick={() => {
          navigation.closeSubView();
          navigation.openModule('settings');
        }}
      />
    {/if}
  {/snippet}

  {#snippet reference()}
    <MobileReference activeTool={modState.phoneMode} />
  {/snippet}

  {#snippet output()}
    <TranslationCard text={plainText} pendingText={pendingDisplay} hasContent={!isEmpty}>
      {#snippet children()}
        <InterlinearText {tokens} {pendingToken} scalePrimaryBy="primary" />
      {/snippet}
    </TranslationCard>
  {/snippet}

  {#snippet variants()}
    {#if isT9 && t9Digits}
      <div class="t9-candidates">
        {#each t9Candidates as cand, idx}
          <button
            type="button"
            class="t9-candidate"
            class:is-active={idx === t9CandidateIndex}
            onclick={() => {
              settings.vibrate(20);
              commitT9Word(cand, true);
            }}
          >
            {cand}
          </button>
        {/each}
      </div>
    {:else}
      <SegmentedControl
        options={phoneModeOptions}
        value={modState.phoneMode}
        size="sm"
        ariaLabel="Režim zadávání"
        onChange={handlePhoneModeChange}
      />
    {/if}
  {/snippet}

  {#snippet input()}
    <div class="phone-zone">
      <div
        class="phone-keypad"
        role="presentation"
        onpointerdown={startLongPress}
        onpointerup={cancelLongPress}
        onpointercancel={cancelLongPress}
        onpointerleave={cancelLongPress}
      >
        <Chassis columns={3} keyHeight="52px">
          {#each PHONE_GRID as item (item.keyId)}
            {@const isActiveKey = pendingKey === item.keyId}
            <Keycap
              ariaLabel={`Klávesa ${item.digit}`}
              class={isActiveKey ? 'is-active-key' : ''}
              onPress={() => handleKeyPress(item.keyId)}
            >
              <span class="phone-digit" class:is-active={isActiveKey}>{item.digit}</span>
              <span class="phone-letters">
                {#each getPhoneKeyLetters(item.keyId) as ch, idx (idx)}
                  <span class="phone-letter" class:is-current={isActiveKey && pendingTapIndex === idx}>
                    {ch === ' ' ? '␣' : ch}
                  </span>
                {/each}
              </span>
            </Keycap>
          {/each}
        </Chassis>
      </div>

      <KeypadBottomRow
        clearDisabled={isEmpty}
        backspaceDisabled={isEmpty}
        clearLabel="Vymazat text podržením"
        backspaceTitle="Smazat poslední znak"
        hasActiveSelection={!!pendingToken}
        cancelTitle={isT9 ? 'Smazat poslední číslici slova' : 'Zrušit rozepsané písmeno'}
        onClear={handleClearAll}
        onBackspace={handleBackspace}
      >
        {#snippet middle()}
          <SpaceCommitButton
            pendingChar={pendingDisplay === ' ' ? '␣' : pendingDisplay}
            onSpace={() => appendField('')}
            onCommit={handleCommit}
          />
        {/snippet}
      </KeypadBottomRow>
    </div>
  {/snippet}
</ModuleShell>

<style>
  .phone-zone {
    display: flex;
    flex-direction: column;
    gap: var(--zone-input-gap);
    width: 100%;
  }

  .t9-candidates {
    display: flex;
    gap: var(--space-xs);
    overflow-x: auto;
    width: 100%;
    height: 100%;
    align-items: center;
    padding: 0 2px;
    box-sizing: border-box;
  }

  .t9-candidate {
    flex-shrink: 0;
    height: var(--control-min-height);
    padding: 0 var(--space-sm);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    font-weight: 600;
    font-family: var(--font-mono);
    box-sizing: border-box;
  }

  .t9-candidate.is-active {
    background-color: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
    color: var(--color-text-inverse);
    font-weight: 800;
  }

  .phone-keypad :global(.keycap.is-active-key) {
    background-color: var(--color-key-active);
    box-shadow: var(--shadow-key-pressed);
  }

  .phone-digit {
    font-size: var(--key-m);
    font-weight: 800;
    font-family: var(--font-mono);
    line-height: 1;
    pointer-events: none;
  }

  .phone-digit.is-active {
    color: var(--color-accent-primary);
  }

  .phone-letters {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    line-height: 1;
    pointer-events: none;
  }

  .phone-letter {
    font-size: var(--text-xs);
    font-weight: 600;
    font-family: var(--font-mono);
    color: var(--color-text-secondary);
  }

  .phone-letter.is-current {
    padding: 0 3px;
    border-radius: var(--radius-xs);
    background-color: var(--color-accent-primary);
    color: var(--color-text-inverse);
    font-weight: 800;
  }
</style>
