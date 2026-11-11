<script lang="ts">
  import Chassis from '../../components/ui/Chassis.svelte';
  import Keycap from '../../components/ui/Keycap.svelte';
  import { X } from 'phosphor-svelte';

  interface Props {
    letters: string[];
    selectedLetter: string | null;
    mapping: Record<string, string>;
    allowHomophones?: boolean;
    onAssign: (cipherLetter: string, targetLetter: string) => void;
    onUnassign: (cipherLetter: string) => void;
  }

  let {
    letters,
    selectedLetter,
    mapping,
    allowHomophones = false,
    onAssign,
    onUnassign
  }: Props = $props();

  // Cipher letters holding each target letter; shown as the key's sublabel
  const holdersByTarget = $derived.by(() => {
    const holders = new Map<string, string[]>();
    for (const [cipherLetter, target] of Object.entries(mapping)) {
      if (!target) continue;
      const key = target.toUpperCase();
      holders.set(key, [...(holders.get(key) ?? []), cipherLetter]);
    }
    return holders;
  });

  const currentlyMappedTarget = $derived(
    selectedLetter ? (mapping[selectedLetter]?.toUpperCase() ?? null) : null
  );

  /**
   * Calculates the optimal column count (7..10) to strictly prevent 1 or 2 dangling keys
   * in the last row, preferring full grids and natural row layouts.
   */
  function calculateOptimalCols(totalItems: number): number {
    const candidates = [9, 8, 7, 10];

    function evaluateCandidate(cols: number) {
      const rem = totalItems % cols;
      const remainder = rem === 0 ? cols : rem;
      const rows = Math.ceil(totalItems / cols);
      const isDangling = rem === 1 || rem === 2;
      const isPerfect = rem === 0;

      let score = 0;

      // Heavy penalty for 1 or 2 dangling keys alone in the last row
      if (isDangling) {
        score -= 1000;
      }

      // High bonus for perfect grid (last row completely full)
      if (isPerfect) {
        score += 500;
      }

      // Bonus for fuller last row
      score += (remainder / cols) * 100;

      // Prefer fewer rows
      score -= rows * 50;

      // Preference for standard column counts on mobile
      if (cols === 9) score += 30;
      if (cols === 8) score += 20;
      if (cols === 7) score += 10;

      return { cols, score };
    }

    const evaluated = candidates.map(evaluateCandidate);
    evaluated.sort((a, b) => b.score - a.score);

    return evaluated[0].cols;
  }

  const totalKeys = $derived(letters.length + 1); // letters + unassign key
  const cols = $derived(calculateOptimalCols(totalKeys));
  const rows = $derived(Math.ceil(totalKeys / cols));
  const fillerSpan = $derived.by(() => {
    const rem = totalKeys % cols;
    return rem === 0 ? 0 : cols - rem;
  });

  // 42 px alphabet keys; long custom alphabets shrink to fit the 352 px panel:
  // 352 − 56 filmstrip − 8 gap − 6 chassis frame = 282 px for the rows and their 2 px gaps
  const keyHeight = $derived(
    `${Math.max(32, Math.min(42, Math.floor((282 - (rows - 1) * 2) / rows)))}px`
  );
</script>

<Chassis columns={cols} {keyHeight}>
  {#each letters as char (char)}
    {@const target = char.toUpperCase()}
    {@const holders = holdersByTarget.get(target) ?? []}
    {@const isCurrentTarget = currentlyMappedTarget === target}
    {@const otherHolders = holders.filter((c) => c !== selectedLetter)}
    {@const isTakenByOther = !allowHomophones && !isCurrentTarget && otherHolders.length > 0}

    <Keycap
      label={char}
      sublabel={holders.length > 0 ? holders.join('') : undefined}
      selected={isCurrentTarget}
      disabled={!selectedLetter || isTakenByOther}
      title={isTakenByOther
        ? `Písmeno ${target} už má znak ${otherHolders.join(', ')}`
        : `Přiřadit ${target}`}
      ariaLabel={holders.length > 0
        ? `Písmeno ${target}, přiřazeno znaku ${holders.join(', ')}`
        : `Písmeno ${target}`}
      onPress={() => {
        if (selectedLetter) onAssign(selectedLetter, target);
      }}
    />
  {/each}

  <Keycap
    disabled={!selectedLetter || !currentlyMappedTarget}
    title="Zrušit přiřazení vybraného znaku"
    ariaLabel="Zrušit přiřazení"
    onPress={() => {
      if (selectedLetter) onUnassign(selectedLetter);
    }}
  >
    <X size={18} weight="bold" />
  </Keycap>

  {#if fillerSpan > 0}
    <div class="grid-filler" style:grid-column="span {fillerSpan}" aria-hidden="true"></div>
  {/if}
</Chassis>

<style>
  .grid-filler {
    height: 100%;
    background-color: var(--color-surface-2);
    opacity: 0.35;
    pointer-events: none;
  }
</style>
