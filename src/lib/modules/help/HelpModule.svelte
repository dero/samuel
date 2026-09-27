<script lang="ts">
  import { APP_NAME } from '../../constants';
  import { ArrowUp, List, BookOpen } from 'phosphor-svelte';
</script>

<div class="help-scroll">
  <div class="help-container">
    <section class="start-card">
      <span class="start-arrow"><ArrowUp size={22} weight="bold" /></span>
      <div>
        <h1 class="start-title">Začněte klepnutím na ikonu nebo název nahoře</h1>
        <p class="start-desc">Otevře se výběr pomůcek. Tudy pak přepínáte kdykoli.</p>
      </div>
    </section>

    <section class="card">
      <h2 class="card-title">Ovládání</h2>
      <ul class="help-list">
        <li>
          <strong>Menu</strong> <span class="inline-icon"><List size={14} weight="bold" /></span> volby pomůcky, abeceda a vyčištění.
        </li>
        <li>
          <strong>Reference</strong> <span class="inline-icon"><BookOpen size={14} weight="duotone" /></span> tahák a tabulky.
        </li>
        <li>
          <strong>Kopírování:</strong> klepnutím na výsledek.
        </li>
        <li>
          <strong>Zpět:</strong> systémové tlačítko zavře menu, referenci i výběr pomůcek.
        </li>
      </ul>
    </section>

    <p class="subtitle">{APP_NAME} – pomůcky na šifrovačky. Vše funguje offline.</p>
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


  .subtitle {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    margin: 0;
    text-align: center;
  }

  .start-card {
    display: flex;
    align-items: flex-start;
    gap: var(--space-sm);
    padding: var(--space-md) var(--space-lg);
    background-color: var(--color-accent-primary-subtle);
    border: 1px solid var(--color-accent-primary);
    border-radius: var(--radius-md);
  }

  .start-arrow {
    display: flex;
    flex-shrink: 0;
    margin-top: 2px;
    color: var(--color-accent-primary);
  }

  .start-title {
    font-size: var(--text-lg);
    font-weight: 700;
    line-height: 1.3;
    margin: 0 0 4px 0;
  }

  .start-desc {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
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




  .inline-icon {
    display: inline-flex;
    align-items: center;
    vertical-align: -2px;
    margin: 0 2px;
    color: var(--color-accent-primary);
  }

</style>
