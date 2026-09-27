<script lang="ts">
  import { MODULES } from '../../types';
  import { APP_NAME } from '../../constants';
  import ModuleIcon from '../../components/ui/ModuleIcon.svelte';
  import { List, BookOpen } from 'phosphor-svelte';
</script>

<div class="help-scroll">
  <div class="help-container">
    <h1 class="page-title">Nápověda</h1>
    <p class="subtitle">{APP_NAME} – pomůcky na šifrovačky</p>

    <section class="card">
      <h2 class="card-title">Ovládání</h2>
      <ul class="help-list">
        <li>
          <strong>Přepnutí pomůcky:</strong> klepněte na ikonu nebo název v záhlaví.
        </li>
        <li>
          <strong>Zpět:</strong> systémové tlačítko zavře menu, referenci i výběr pomůcek.
        </li>
        <li>
          <strong>Kopírování:</strong> klepnutím na výsledek.
        </li>
        <li>
          <strong>Menu</strong> <span class="inline-icon"><List size={14} weight="bold" /></span> volby nástroje, abeceda a vyčištění modulu.
        </li>
        <li>
          <strong>Reference</strong> <span class="inline-icon"><BookOpen size={14} weight="duotone" /></span> tahák a tabulky.
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

</style>
