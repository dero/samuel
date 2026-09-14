<script lang="ts">
  import { MODULES } from '../../types';
  import { APP_NAME, APP_VERSION } from '../../constants';
  import ModuleIcon from '../../components/ui/ModuleIcon.svelte';
  import { List, BookOpen } from 'phosphor-svelte';
</script>

<div class="help-scroll">
  <div class="help-container">
    <h1 class="page-title">Nápověda k aplikaci</h1>
    <p class="subtitle">{APP_NAME} v{APP_VERSION} – Nástroj pro terénní šifrovačky</p>

    <section class="card">
      <h2 class="card-title">Základní ovládání & Ergonomie</h2>
      <ul class="help-list">
        <li>
          <strong>Rychlá navigace:</strong> Klepnutím na ikonu modulu vlevo v záhlaví otevřete rychlý launcher pro okamžitý skok do jiného nástroje bez nutnosti návratu na úvodní obrazovku.
        </li>
        <li>
          <strong>Tlačítko Zpět:</strong> Systémové tlačítko Zpět v telefonu vás vždy spolehlivě vrátí z menu do modulu, z modulu na Dashboard a z Dashboardu nabídne ukončení.
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
    max-width: 640px;
    margin: 0 auto;
    padding: 16px 14px 40px 14px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .page-title {
    font-size: 22px;
    font-weight: 700;
    margin: 0 0 2px 0;
  }

  .subtitle {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin: 0 0 4px 0;
  }

  .card {
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .card-title {
    font-size: 16px;
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
    font-size: 14px;
    line-height: 1.5;
  }

  .tools-overview {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 8px;
  }

  .tool-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background-color: var(--color-surface-2);
    border-radius: var(--radius-sm);
    font-size: 13px;
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
    font-size: 12px;
    color: var(--color-text-secondary);
    font-style: italic;
    margin: 0;
  }
</style>
