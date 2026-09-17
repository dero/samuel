<script lang="ts">
  import { MODULES } from '../../types';
  import { APP_NAME } from '../../constants';
  import ModuleIcon from '../../components/ui/ModuleIcon.svelte';
  import { List, BookOpen } from 'phosphor-svelte';
</script>

<div class="help-scroll">
  <div class="help-container">
    <h1 class="page-title">Nápověda k aplikaci</h1>
    <p class="subtitle">{APP_NAME} – Nástroj pro terénní šifrovačky</p>

    <section class="card">
      <h2 class="card-title">Základní ovládání & Ergonomie</h2>
      <ul class="help-list">
        <li>
          <strong>Rychlá navigace:</strong> Klepnutím na ikonu nebo název pomůcky v záhlaví otevřete rychlý výběr pro okamžitý skok do libovolného nástroje na 1 kliknutí.
        </li>
        <li>
          <strong>Tlačítko Zpět:</strong> Systémové tlačítko Zpět v telefonu vás vždy spolehlivě vrátí z menu, reference či výběru pomůcek zpět do rozluštěného modulu.
        </li>
        <li>
          <strong>Kopírování jedním klepnutím (One-tap Copy):</strong> Klepnutím na jakýkoliv dekódovaný text nebo výsledkový řádek se obsah automaticky zkopíruje do schránky.
        </li>
        <li>
          <strong>Menu modulu:</strong> Tlačítko se symbolem <span class="inline-icon"><List size={14} weight="bold" /></span> v záhlaví obsahuje rychlé volby specifické pro daný nástroj, výběr abecedy a bezpečné tlačítko pro vyčištění modulu.
        </li>
        <li>
          <strong>Reference a taháky:</strong> Tlačítko <span class="inline-icon"><BookOpen size={14} weight="duotone" /></span> v záhlaví okamžitě otevře tahák a tabulky daného modulu.
        </li>
      </ul>
    </section>

    <section class="card">
      <h2 class="card-title">Přehled nástrojů</h2>
      <div class="tools-overview">
        {#each MODULES as mod}
          <div class="tool-item">
            <span class="tool-icon">
              <ModuleIcon id={mod.id} weight="duotone" />
            </span>
            <span class="tool-name">{mod.name}</span>
          </div>
        {/each}
      </div>
      <p class="note">
        Podrobný popis každého modulu a jeho pokročilých funkcí bude zkompletován během finální fáze implementace.
      </p>
    </section>
  </div>
</div>

<style>
  .help-scroll {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
    background-color: var(--color-bg-canvas);
    -webkit-overflow-scrolling: touch;
  }

  .help-container {
    max-width: var(--max-app-width);
    margin: 0 auto;
    padding: var(--space-lg) 14px 40px 14px;
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .page-title {
    font-size: var(--text-2xl);
    font-weight: 700;
    margin: 0 0 2px 0;
  }

  .subtitle {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0 0 4px 0;
  }

  .card {
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .card-title {
    font-size: var(--text-base);
    font-weight: 700;
    margin: 0;
    color: var(--color-accent-primary);
  }

  .help-list {
    margin: 0;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: var(--text-sm);
    line-height: 1.5;
  }

  .tools-overview {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: var(--space-sm);
  }

  .tool-item {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: 8px 10px;
    background-color: var(--color-surface-2);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    font-weight: 600;
  }

  .tool-icon {
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-accent-primary);
  }

  .inline-icon {
    display: inline-flex;
    align-items: center;
    vertical-align: -2px;
    margin: 0 2px;
    color: var(--color-accent-primary);
  }

  .note {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    font-style: italic;
    margin: 0;
  }
</style>
