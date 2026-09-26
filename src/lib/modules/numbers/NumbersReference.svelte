<script lang="ts">
  import { alphabet } from '../../state/alphabet.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';

  interface Props {
    letters?: string[];
  }

  let { letters }: Props = $props();

  type TabType = 'alphabet' | 'roman' | 'ascii';

  let activeTab = $state<TabType>('alphabet');

  const tabs: SegmentOption<TabType>[] = [
    { id: 'alphabet', label: 'Abeceda' },
    { id: 'roman', label: 'Římská' },
    { id: 'ascii', label: 'ASCII' }
  ];

  interface LetterRow {
    char: string;
    num: number;
    bin: string;
    oct: string;
    hex: string;
  }

  const currentLetters = $derived(letters ?? alphabet.currentLetters);

  const letterRows = $derived.by<LetterRow[]>(() => {
    return currentLetters.map((char, index) => {
      const num = index + 1;
      const bin = num.toString(2).padStart(5, '0');
      const oct = num.toString(8).padStart(2, '0');
      const hex = num.toString(16).toUpperCase().padStart(2, '0');

      return {
        char,
        num,
        bin,
        oct,
        hex
      };
    });
  });

  // ASCII table printable chars (32 to 126) - Znak, DEC, HEX
  const asciiRows = Array.from({ length: 95 }, (_, i) => {
    const code = 32 + i;
    const char = code === 32 ? '␣ (mezera)' : String.fromCharCode(code);
    return {
      code,
      char,
      hex: code.toString(16).toUpperCase()
    };
  });
</script>

<div class="ref-container" data-allow-copy>
  <div class="ref-header-controls">
    <SegmentedControl
      options={tabs}
      value={activeTab}
      ariaLabel="Přepínač referenčních tabulek"
      onChange={(v) => (activeTab = v)}
    />
  </div>

  <div class="ref-scroll-body">
    {#if activeTab === 'alphabet'}
      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-num">#</th>
              <th class="col-char">Znak</th>
              <th class="col-bin">BIN (5b)</th>
              <th class="col-oct">OCT</th>
              <th class="col-hex">HEX</th>
            </tr>
          </thead>
          <tbody>
            {#each letterRows as row (row.char + row.num)}
              <tr>
                <td class="col-num font-mono font-bold text-accent">{row.num}</td>
                <td class="col-char font-accent">{row.char}</td>
                <td class="col-bin font-mono">{row.bin}</td>
                <td class="col-oct font-mono text-muted">{row.oct}</td>
                <td class="col-hex font-mono">{row.hex}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else if activeTab === 'roman'}
      <div class="roman-ref-container">
        <!-- 1. Základní symboly v layoutu klávesnice -->
        <div class="power-card">
          <div class="power-title">Základní symboly</div>
          <div class="roman-numpad-ref">
            <div class="roman-keypad-row row-top">
              <div class="roman-symbol-tile">
                <span class="symbol-letter">I</span>
                <span class="symbol-val">1</span>
              </div>
              <div class="roman-symbol-tile">
                <span class="symbol-letter">V</span>
                <span class="symbol-val">5</span>
              </div>
              <div class="roman-symbol-tile">
                <span class="symbol-letter">X</span>
                <span class="symbol-val">10</span>
              </div>
            </div>
            <div class="roman-keypad-row row-bottom">
              <div class="roman-symbol-tile">
                <span class="symbol-letter">L</span>
                <span class="symbol-val">50</span>
              </div>
              <div class="roman-symbol-tile">
                <span class="symbol-letter">C</span>
                <span class="symbol-val">100</span>
              </div>
              <div class="roman-symbol-tile">
                <span class="symbol-letter">D</span>
                <span class="symbol-val">500</span>
              </div>
              <div class="roman-symbol-tile">
                <span class="symbol-letter">M</span>
                <span class="symbol-val">1000</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Odčítací kombinace (Subtrakce) - 3x2 mřížka -->
        <div class="power-card">
          <div class="power-title">Odčítací kombinace (Subtrakce)</div>
          <div class="subtraction-grid">
            <div class="subtraction-tile">
              <span class="sub-sym">IV</span>
              <span class="sub-val">4</span>
            </div>
            <div class="subtraction-tile">
              <span class="sub-sym">XL</span>
              <span class="sub-val">40</span>
            </div>
            <div class="subtraction-tile">
              <span class="sub-sym">CD</span>
              <span class="sub-val">400</span>
            </div>
            <div class="subtraction-tile">
              <span class="sub-sym">IX</span>
              <span class="sub-val">9</span>
            </div>
            <div class="subtraction-tile">
              <span class="sub-sym">XC</span>
              <span class="sub-val">90</span>
            </div>
            <div class="subtraction-tile">
              <span class="sub-sym">CM</span>
              <span class="sub-val">900</span>
            </div>
          </div>
        </div>

        <!-- 3. Jak se skládají čísla (Pravidla a víceřádkový rozklad) -->
        <div class="power-card">
          <div class="power-title">Tvorba čísel a rozklad řádů</div>
          <div class="roman-explanation-card">
            <p class="roman-p">
              Kanonické číslo se tvoří <strong>samostatným rozkladem každého řádu</strong> (tisíce, stovky, desítky, jednotky) zleva doprava:
            </p>
            <div class="roman-examples-list">
              <div class="example-card">
                <div class="example-header">
                  <span class="ex-num font-mono">1984</span>
                  <span class="ex-arrow">➔</span>
                  <span class="ex-result font-mono text-accent">MCMLXXXIV</span>
                </div>
                <div class="example-breakdown font-mono">
                  <span class="breakdown-part"><span class="bp-val">1000</span> <span class="bp-rom">M</span></span>
                  <span class="bp-plus">+</span>
                  <span class="breakdown-part"><span class="bp-val">900</span> <span class="bp-rom">CM</span></span>
                  <span class="bp-plus">+</span>
                  <span class="breakdown-part"><span class="bp-val">80</span> <span class="bp-rom">LXXX</span></span>
                  <span class="bp-plus">+</span>
                  <span class="breakdown-part"><span class="bp-val">4</span> <span class="bp-rom">IV</span></span>
                </div>
              </div>

              <div class="example-card">
                <div class="example-header">
                  <span class="ex-num font-mono">2026</span>
                  <span class="ex-arrow">➔</span>
                  <span class="ex-result font-mono text-accent">MMXXVI</span>
                </div>
                <div class="example-breakdown font-mono">
                  <span class="breakdown-part"><span class="bp-val">2000</span> <span class="bp-rom">MM</span></span>
                  <span class="bp-plus">+</span>
                  <span class="breakdown-part"><span class="bp-val">20</span> <span class="bp-rom">XX</span></span>
                  <span class="bp-plus">+</span>
                  <span class="breakdown-part"><span class="bp-val">6</span> <span class="bp-rom">VI</span></span>
                </div>
              </div>

              <div class="example-card">
                <div class="example-header">
                  <span class="ex-num font-mono">444</span>
                  <span class="ex-arrow">➔</span>
                  <span class="ex-result font-mono text-accent">CDXLIV</span>
                </div>
                <div class="example-breakdown font-mono">
                  <span class="breakdown-part"><span class="bp-val">400</span> <span class="bp-rom">CD</span></span>
                  <span class="bp-plus">+</span>
                  <span class="breakdown-part"><span class="bp-val">40</span> <span class="bp-rom">XL</span></span>
                  <span class="bp-plus">+</span>
                  <span class="breakdown-part"><span class="bp-val">4</span> <span class="bp-rom">IV</span></span>
                </div>
              </div>

              <div class="example-card">
                <div class="example-header">
                  <span class="ex-num font-mono">49</span>
                  <span class="ex-arrow">➔</span>
                  <span class="ex-result font-mono text-accent">XLIX</span>
                  <span class="ex-note text-muted">(nikoli IL)</span>
                </div>
                <div class="example-breakdown font-mono">
                  <span class="breakdown-part"><span class="bp-val">40</span> <span class="bp-rom">XL</span></span>
                  <span class="bp-plus">+</span>
                  <span class="breakdown-part"><span class="bp-val">9</span> <span class="bp-rom">IX</span></span>
                </div>
              </div>

              <div class="example-card">
                <div class="example-header">
                  <span class="ex-num font-mono">99</span>
                  <span class="ex-arrow">➔</span>
                  <span class="ex-result font-mono text-accent">XCIX</span>
                  <span class="ex-note text-muted">(nikoli IC)</span>
                </div>
                <div class="example-breakdown font-mono">
                  <span class="breakdown-part"><span class="bp-val">90</span> <span class="bp-rom">XC</span></span>
                  <span class="bp-plus">+</span>
                  <span class="breakdown-part"><span class="bp-val">9</span> <span class="bp-rom">IX</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Pravidla zápisu -->
        <div class="power-card">
          <div class="power-title">Pravidla zápisu</div>
          <div class="roman-rules-list">
            <div class="rule-item">
              <span class="rule-badge is-canonical">Kanonická</span>
              <ul class="rule-bullets">
                <li><strong>Max. 3 opakování:</strong> Symboly <code>I</code>, <code>X</code>, <code>C</code>, <code>M</code> se smí opakovat nejvýše 3× za sebou (<code>III</code>, <code>XXX</code>, <code>CCC</code>, <code>MMM</code>).</li>
                <li><strong>Neopakující se symboly:</strong> Symboly <code>V</code>, <code>L</code>, <code>D</code> se nikdy neopakují (např. 10 je <code>X</code>, nikoli <code>VV</code>).</li>
                <li><strong>Pravidla odčítání:</strong> Odčítá se vždy jen 1 menší symbol před 2 nejbližšími vyššími:
                  <ul class="sub-bullets">
                    <li><code>I</code> pouze před <code>V</code> (4) a <code>X</code> (9)</li>
                    <li><code>X</code> pouze před <code>L</code> (40) a <code>C</code> (90)</li>
                    <li><code>C</code> pouze před <code>D</code> (400) a <code>M</code> (900)</li>
                  </ul>
                </li>
                <li><strong>Skládání po řádech:</strong> Postupuje se striktně od tisíců přes stovky a desítky k jednotkám.</li>
              </ul>
            </div>
            <div class="rule-item">
              <span class="rule-badge is-loose">Volná</span>
              <ul class="rule-bullets">
                <li><strong>Aditivní / Hodinářský zápis:</strong> <code>IIII</code> = 4, <code>VIIII</code> = 9, <code>XXXX</code> = 40.</li>
                <li><strong>Subtraktivní zkratky:</strong> <code>IC</code> = 99, <code>IL</code> = 49, <code>XM</code> = 990.</li>
                <li><strong>Vícenásobné odčítání:</strong> <code>IIV</code> = 3, <code>IIX</code> = 8.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    {:else if activeTab === 'ascii'}
      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-ascii-char">Znak</th>
              <th class="col-num">DEC</th>
              <th class="col-hex">HEX</th>
            </tr>
          </thead>
          <tbody>
            {#each asciiRows as row (row.code)}
              <tr>
                <td class="col-ascii-char font-accent">{row.char}</td>
                <td class="col-num font-mono">{row.code}</td>
                <td class="col-hex font-mono text-accent">{row.hex}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<style>
  .ref-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: var(--space-sm);
  }

  .ref-header-controls {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    flex-shrink: 0;
  }

  .ref-scroll-body {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-bottom: var(--space-lg);
  }

  .table-card {
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);
    text-align: left;
  }

  .data-table th {
    padding: var(--space-sm);
    background-color: var(--color-surface-2);
    color: var(--color-text-secondary);
    font-size: var(--text-xs);
    font-weight: 600;
    border-bottom: 1px solid var(--color-border-subtle);
    position: sticky;
    top: 0;
    z-index: 2;
  }

  .data-table td {
    padding: var(--space-xs) var(--space-sm);
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .data-table tr:last-child td {
    border-bottom: none;
  }

  .col-num {
    width: 15%;
  }

  .col-char {
    width: 20%;
  }

  .font-accent {
    font-weight: 700;
    color: var(--color-accent-primary);
    font-size: var(--text-base);
  }

  .font-mono {
    font-family: var(--font-mono, monospace);
  }

  .font-bold {
    font-weight: 700;
  }

  .text-muted {
    color: var(--color-text-secondary);
  }

  .text-accent {
    color: var(--color-accent-primary);
  }

  .power-card {
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .power-title {
    padding: var(--space-sm);
    background-color: var(--color-surface-2);
    font-weight: 600;
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .roman-ref-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  /* Roman numpad keypad ref layout */
  .roman-numpad-ref {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space-sm);
  }

  .roman-keypad-row {
    display: grid;
    gap: var(--space-xs);
  }

  .roman-keypad-row.row-top {
    grid-template-columns: repeat(3, 1fr);
  }

  .roman-keypad-row.row-bottom {
    grid-template-columns: repeat(4, 1fr);
  }

  .roman-symbol-tile {
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 6px 4px;
    gap: 2px;
  }

  .symbol-letter {
    font-family: var(--font-mono, monospace);
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-accent-primary);
    line-height: 1.1;
  }

  .symbol-val {
    font-family: var(--font-mono, monospace);
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  /* Subtraction 3x2 grid */
  .subtraction-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-xs);
    padding: var(--space-sm);
  }

  .subtraction-tile {
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 6px 4px;
    gap: 2px;
  }

  .sub-sym {
    font-family: var(--font-mono, monospace);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-accent-primary);
    line-height: 1.1;
  }

  .sub-val {
    font-family: var(--font-mono, monospace);
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  /* Number formation multiline breakdown */
  .roman-explanation-card {
    padding: var(--space-sm);
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .roman-p {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    line-height: 1.4;
    margin: 0;
  }

  .roman-examples-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    margin-top: 2px;
  }

  .example-card {
    background-color: var(--color-surface-2);
    border-radius: var(--radius-sm);
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .example-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--text-xs);
  }

  .ex-num {
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .ex-arrow {
    color: var(--color-text-muted);
    font-size: var(--text-2xs);
  }

  .ex-result {
    font-weight: 700;
  }

  .ex-note {
    font-size: var(--text-xs);
    margin-left: auto;
  }

  .example-breakdown {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 6px;
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    padding-top: 2px;
  }

  .breakdown-part {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background-color: var(--color-surface-1);
    padding: 1px 5px;
    border-radius: var(--radius-xs);
    border: 1px solid var(--color-border-subtle);
  }

  .bp-val {
    color: var(--color-text-secondary);
  }

  .bp-rom {
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .bp-plus {
    color: var(--color-text-muted);
    font-size: var(--text-2xs);
  }

  /* Rules */
  .roman-rules-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-sm);
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    line-height: 1.4;
  }

  .rule-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .rule-bullets {
    margin: 4px 0 0 0;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .sub-bullets {
    margin: 2px 0 0 0;
    padding-left: 16px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .rule-badge {
    display: inline-flex;
    align-self: flex-start;
    padding: 2px 6px;
    border-radius: var(--radius-xs);
    font-size: var(--text-2xs);
    font-weight: 700;
    text-transform: uppercase;
  }

  .rule-badge.is-canonical {
    background-color: var(--color-accent-primary-subtle);
    color: var(--color-accent-primary);
  }

  .rule-badge.is-loose {
    background-color: var(--color-accent-warning-subtle);
    color: var(--color-accent-warning);
  }
</style>
