<script lang="ts">
  import BottomSheet from '../../components/ui/BottomSheet.svelte';
  import { navigation } from '../../state/navigation.svelte';
  import { BookOpen } from 'phosphor-svelte';
</script>

<BottomSheet
  open={navigation.subView === 'ref' && navigation.activeModuleId === 'cross'}
  title="Tahák – Šifrovací kříže & klávesnice"
  icon={BookOpen}
  maxWidth="540px"
  onClose={() => navigation.closeSubView()}
>
  <div class="reference-content">
    <!-- Section 1: Velký polský kříž -->
    <section class="ref-section">
      <h3 class="ref-heading">1. Velký polský kříž (3×3×3)</h3>
      <p class="ref-text">
        Jedna mřížka 3×3 obsahuje v každém chlívku až 3 znaky. Tvar znaku odpovídá ohraničení daného chlívku a počet teček určuje pozici písmene v chlívku:
      </p>
      <div class="notation-box">
        <div class="notation-item"><strong>1. pozice:</strong> 1 tečka <code>•</code> (např. <code>A</code>, <code>D</code>, <code>G</code>)</div>
        <div class="notation-item"><strong>2. pozice:</strong> 2 tečky <code>••</code> (např. <code>B</code>, <code>E</code>, <code>H</code>)</div>
        <div class="notation-item"><strong>3. pozice:</strong> 3 tečky <code>•••</code> (např. <code>C</code>, <code>F</code>, <code>CH/I</code>)</div>
        <div class="notation-item note-item"><strong>U 26 znaků (bez CH):</strong> 27. pozice (chlívek 3,3 •••) slouží jako Mezera (<code>␣</code>).</div>
      </div>
      <div class="shape-preview-grid">
        <div class="shape-item"><span class="shape-icon">┘</span> <span>Pole (1,1)</span></div>
        <div class="shape-item"><span class="shape-icon">┴</span> <span>Pole (1,2)</span></div>
        <div class="shape-item"><span class="shape-icon">└</span> <span>Pole (1,3)</span></div>
        <div class="shape-item"><span class="shape-icon">┤</span> <span>Pole (2,1)</span></div>
        <div class="shape-item"><span class="shape-icon">┼</span> <span>Střed (2,2)</span></div>
        <div class="shape-item"><span class="shape-icon">├</span> <span>Pole (2,3)</span></div>
        <div class="shape-item"><span class="shape-icon">┐</span> <span>Pole (3,1)</span></div>
        <div class="shape-item"><span class="shape-icon">┬</span> <span>Pole (3,2)</span></div>
        <div class="shape-item"><span class="shape-icon">┌</span> <span>Pole (3,3)</span></div>
      </div>
    </section>

    <!-- Section 2: Pigpen (aka Malý polský kříž) -->
    <section class="ref-section">
      <h3 class="ref-heading">2. Pigpen (aka Malý polský kříž)</h3>
      <p class="ref-text">
        Kombinace čtvercových mřížek 3×3 a šikmých křížů 2×2 (X). Každý tvar se vyskytuje ve variantě bez tečky a s tečkou (celkem 26 znaků A–Z):
      </p>
      <div class="notation-box">
        <div class="notation-item"><strong>1. Mřížka 3×3 bez tečky:</strong> Znaky <code>A–I</code> (chlívek ohraničený linkami mřížky)</div>
        <div class="notation-item"><strong>2. Mřížka 3×3 s tečkou (•):</strong> Znaky <code>J–R</code> (stejný chlívek s tečkou uvnitř)</div>
        <div class="notation-item"><strong>3. Šikmý kříž X bez tečky:</strong> Znaky <code>S–V</code> (nahoře <code>S</code>, vlevo <code>T</code>, vpravo <code>U</code>, dole <code>V</code>)</div>
        <div class="notation-item"><strong>4. Šikmý kříž X s tečkou (•):</strong> Znaky <code>W–Z</code> (nahoře <code>W</code>, vlevo <code>X</code>, vpravo <code>Y</code>, dole <code>Z</code>)</div>
        <div class="notation-item note-item"><strong>Poznámka k CH:</strong> Šifra má přesně 26 pozic pro písmena A–Z. Spřežka <code>CH</code> se zapisuje jako <code>C</code> + <code>H</code>.</div>
      </div>
    </section>

    <!-- Section 3: Mobilní telefon (T9 / SMS multi-tap) -->
    <section class="ref-section">
      <h3 class="ref-heading">3. Mobilní telefon (T9 / SMS multi-tap)</h3>
      <p class="ref-text">
        Klasická tlačítková klávesnice telefonu (standard ITU E.161). Znak se kóduje jako dvojice čísel (klávesa + počet stisků):
      </p>
      <div class="phone-grid-preview">
        <div class="phone-key-card">
          <span class="key-num">1</span>
          <span class="key-chars">. , ? !</span>
        </div>
        <div class="phone-key-card">
          <span class="key-num">2</span>
          <span class="key-chars">A B C</span>
        </div>
        <div class="phone-key-card">
          <span class="key-num">3</span>
          <span class="key-chars">D E F</span>
        </div>
        <div class="phone-key-card">
          <span class="key-num">4</span>
          <span class="key-chars">G H I</span>
        </div>
        <div class="phone-key-card">
          <span class="key-num">5</span>
          <span class="key-chars">J K L</span>
        </div>
        <div class="phone-key-card">
          <span class="key-num">6</span>
          <span class="key-chars">M N O</span>
        </div>
        <div class="phone-key-card">
          <span class="key-num">7</span>
          <span class="key-chars">P Q R S</span>
        </div>
        <div class="phone-key-card">
          <span class="key-num">8</span>
          <span class="key-chars">T U V</span>
        </div>
        <div class="phone-key-card">
          <span class="key-num">9</span>
          <span class="key-chars">W X Y Z</span>
        </div>
        <div class="phone-key-card">
          <span class="key-num">*</span>
          <span class="key-chars">* +</span>
        </div>
        <div class="phone-key-card">
          <span class="key-num">0</span>
          <span class="key-chars">␣ 0</span>
        </div>
        <div class="phone-key-card">
          <span class="key-num">#</span>
          <span class="key-chars">#</span>
        </div>
      </div>
      <div class="notation-box">
        <div class="notation-item"><strong>Zápis počtem stisků:</strong> <code>22</code> = <code>B</code>, <code>7777</code> = <code>S</code>, <code>0</code> = <code>␣</code>, <code>**</code> = <code>+</code></div>
        <div class="notation-item"><strong>Zápis souřadnicemi:</strong> <code>(Klávesa, Stisk)</code> např. <code>(7, 4)</code> = <code>S</code></div>
        <div class="notation-item"><strong>Podržení klávesy:</strong> Zapíše přímo číslici (např. podržení <code>2</code> = <code>2</code>, <code>0</code> = <code>0</code>).</div>
      </div>
    </section>
  </div>
</BottomSheet>

<style>
  .reference-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    color: var(--color-text-primary);
    padding-bottom: var(--space-xl);
  }

  .ref-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .ref-heading {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-accent-primary);
    margin: 0;
  }

  .ref-text {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin: 0;
  }

  .notation-box {
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: var(--color-surface-2);
    border-radius: var(--radius-sm);
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--color-border-subtle);
    font-size: var(--text-xs);
  }

  .notation-item code {
    background: var(--color-surface-3);
    padding: 1px 4px;
    border-radius: var(--radius-xs);
    color: var(--color-accent-primary);
    font-family: var(--font-mono);
  }

  .note-item {
    margin-top: 4px;
    padding-top: 4px;
    border-top: 1px dashed var(--color-border-subtle);
    color: var(--color-accent-primary);
  }

  .shape-preview-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    background: var(--color-bg-canvas);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: 6px;
  }

  .shape-item {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--color-surface-1);
    padding: 4px 6px;
    border-radius: var(--radius-xs);
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  .shape-icon {
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-accent-primary);
    line-height: 1;
  }

  .phone-grid-preview {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    background: var(--color-bg-canvas);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: 8px;
  }

  .phone-key-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: 6px 4px;
    gap: 2px;
  }

  .key-num {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-accent-primary);
    font-family: var(--font-mono);
    line-height: 1;
  }

  .key-chars {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    font-weight: 500;
    letter-spacing: 0.05em;
  }
</style>
