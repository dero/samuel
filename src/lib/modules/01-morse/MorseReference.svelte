<script lang="ts">
  import { CZECH_MNEMONICS, type MorseEntry } from "./morseData";
  import { settings } from "../../state/settings.svelte";
  import { matchesSearch } from "../../utils/search";
  import { MagnifyingGlass, X } from "phosphor-svelte";

  let activeTab = $state<"list" | "tree">("list");
  let searchQuery = $state("");

  let filteredEntries = $derived.by(() => {
    if (!searchQuery.trim()) return CZECH_MNEMONICS;
    return CZECH_MNEMONICS.filter((e) =>
      matchesSearch([e.char, e.code, e.mnemonic], searchQuery),
    );
  });

  // Binary tree levels for visualization
  // Level 1: 1 char
  // Level 2: 2 chars (E, T)
  // Level 3: 4 chars (I, A, N, M)
  // Level 4: 8 chars (S, U, R, W, D, K, G, O)
  // Level 5: 16 chars (H, V, F, _, L, _, P, J, B, X, C, Y, Z, Q, CH, _)
  const treeLevels = [
    {
      level: 1,
      nodes: [
        { char: "E", code: ".", dir: "L" },
        { char: "T", code: "-", dir: "R" },
      ],
    },
    {
      level: 2,
      nodes: [
        { char: "I", code: "..", dir: "L" },
        { char: "A", code: ".-", dir: "R" },
        { char: "N", code: "-.", dir: "L" },
        { char: "M", code: "--", dir: "R" },
      ],
    },
    {
      level: 3,
      nodes: [
        { char: "S", code: "...", dir: "L" },
        { char: "U", code: "..-", dir: "R" },
        { char: "R", code: ".-.", dir: "L" },
        { char: "W", code: ".--", dir: "R" },
        { char: "D", code: "-..", dir: "L" },
        { char: "K", code: "-.-", dir: "R" },
        { char: "G", code: "--.", dir: "L" },
        { char: "O", code: "---", dir: "R" },
      ],
    },
    {
      level: 4,
      nodes: [
        { char: "H", code: "....", dir: "L" },
        { char: "V", code: "...-", dir: "R" },
        { char: "F", code: "..-.", dir: "L" },
        { char: "", code: "..--", dir: "R" },
        { char: "L", code: ".-..", dir: "L" },
        { char: "", code: ".-.-", dir: "R" },
        { char: "P", code: ".--.", dir: "L" },
        { char: "J", code: ".---", dir: "R" },
        { char: "B", code: "-...", dir: "L" },
        { char: "X", code: "-..-", dir: "R" },
        { char: "C", code: "-.-.", dir: "L" },
        { char: "Y", code: "-.--", dir: "R" },
        { char: "Z", code: "--..", dir: "L" },
        { char: "Q", code: "--.-", dir: "R" },
        { char: "", code: "---.", dir: "L" },
        { char: "CH", code: "----", dir: "R" },
      ],
    },
  ];
</script>

<div class="ref-container">
  <!-- Sub-Tabs -->
  <div class="tab-bar">
    <button
      class="tab-btn"
      class:active={activeTab === "list"}
      onclick={() => {
        settings.vibrate(20);
        activeTab = "list";
      }}
    >
      Přehled znaků ({CZECH_MNEMONICS.length})
    </button>
    <button
      class="tab-btn"
      class:active={activeTab === "tree"}
      onclick={() => {
        settings.vibrate(20);
        activeTab = "tree";
      }}
    >
      Morseův strom
    </button>
  </div>

  {#if activeTab === "list"}
    <!-- Search filter -->
    <div class="search-box">
      <span class="search-icon"
        ><MagnifyingGlass size={16} weight="bold" /></span
      >
      <input
        type="search"
        placeholder="Hledat písmeno, kód nebo slovo..."
        bind:value={searchQuery}
      />
      {#if searchQuery}
        <button
          class="clear-search"
          aria-label="Vymazat hledání"
          onclick={() => (searchQuery = "")}
        >
          <X size={14} weight="bold" />
        </button>
      {/if}
    </div>

    <!-- Mnemonic table -->
    <div class="table-scroll">
      <div class="entries-grid">
        {#each filteredEntries as entry}
          <div class="entry-row">
            <div class="entry-char">{entry.char}</div>
            <div class="entry-code">{entry.code}</div>
            <div class="entry-mnemonic">
              <span class="word">{entry.mnemonic}</span>
            </div>
          </div>
        {:else}
          <div class="empty-state">
            Nenalezen žádný znak odpovídající „{searchQuery}“.
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <!-- Tree View -->
    <div class="tree-scroll">
      <div class="tree-container">
        <!-- Root node -->
        <div class="tree-row root-row">
          <div class="tree-node root-node">START</div>
        </div>

        {#each treeLevels as lvl}
          <div
            class="tree-row"
            style="grid-template-columns: repeat({lvl.nodes.length}, 1fr)"
          >
            {#each lvl.nodes as node}
              {#if node.char}
                <div
                  class="tree-node"
                  class:is-dot={node.dir === "L"}
                  class:is-dash={node.dir === "R"}
                >
                  <span class="node-char">{node.char}</span>
                  <span class="node-sym">{node.dir === "L" ? "•" : "—"}</span>
                </div>
              {:else}
                <div class="tree-node is-empty" aria-hidden="true"></div>
              {/if}
            {/each}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .ref-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    gap: 10px;
  }

  .tab-bar {
    display: flex;
    background-color: var(--color-surface-2);
    border-radius: var(--radius-sm);
    padding: 3px;
    gap: 4px;
    flex-shrink: 0;
  }

  .tab-btn {
    flex: 1;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
    border-radius: 4px;
    text-align: center;
    transition:
      background-color 0.15s,
      color 0.15s;
  }

  .tab-btn.active {
    background-color: var(--color-surface-active);
    color: var(--color-text-primary);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    flex-shrink: 0;
  }

  .search-box input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: var(--color-text-primary);
    font-size: 14px;
    font-family: inherit;
  }

  .search-icon {
    display: flex;
    align-items: center;
    color: var(--color-text-secondary);
  }

  .clear-search {
    font-size: 14px;
    color: var(--color-text-muted);
    padding: 2px 6px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .table-scroll {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .entries-grid {
    display: grid;
    grid-template-columns: max-content max-content 1fr;
    gap: 4px;
  }

  .entry-row {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
    align-items: center;
    padding: 8px 14px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    gap: 14px;
  }

  @supports not (grid-template-columns: subgrid) {
    .entry-row {
      display: grid;
      grid-template-columns: auto auto 1fr;
    }
  }

  .entry-char {
    font-family: var(--font-condensed);
    font-size: 18px;
    font-weight: 700;
    color: var(--color-accent-primary);
    white-space: nowrap;
  }

  .entry-code {
    font-family: var(--font-mono);
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #ffffff;
    white-space: nowrap;
  }

  .entry-mnemonic {
    display: flex;
    align-items: baseline;
    min-width: 0;
  }

  .entry-mnemonic .word {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    word-break: break-word;
  }

  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    color: var(--color-text-muted);
    padding: 24px 16px;
    font-size: 14px;
  }

  /* Tree View */
  .tree-scroll {
    flex: 1;
    overflow: auto;
    overscroll-behavior: contain;
    padding: 8px 4px 16px 4px;
  }

  .tree-container {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 860px;
    padding-bottom: 16px;
  }

  .tree-row {
    display: grid;
    gap: 6px;
  }

  .root-row {
    display: flex;
    justify-content: center;
  }

  .tree-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 6px 4px 8px 4px;
    gap: 2px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    min-width: 44px;
    white-space: nowrap;
    user-select: none;
    transition:
      background-color 0.15s,
      border-color 0.15s;
  }

  .tree-node.is-empty {
    visibility: hidden;
    border: none;
    background: none;
    pointer-events: none;
  }

  .tree-node.is-dot {
    background-color: rgba(0, 210, 255, 0.16);
    border: 1px solid rgba(0, 210, 255, 0.45);
  }

  .tree-node.is-dot .node-char {
    color: #67e8f9;
  }

  .tree-node.is-dot .node-sym {
    color: #a5f3fc;
  }

  .tree-node.is-dash {
    background-color: rgba(245, 158, 11, 0.16);
    border: 1px solid rgba(245, 158, 11, 0.45);
  }

  .tree-node.is-dash .node-char {
    color: #fcd34d;
  }

  .tree-node.is-dash .node-sym {
    color: #fde68a;
  }

  .root-node {
    padding: 8px 36px;
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 1px;
    color: var(--color-text-primary);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
  }

  .node-char {
    font-family: var(--font-condensed);
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text-primary);
    white-space: nowrap;
    line-height: 1.1;
  }

  .node-sym {
    font-family: var(--font-mono);
    font-size: 15px;
    font-weight: 900;
    line-height: 1;
    white-space: nowrap;
  }
</style>
