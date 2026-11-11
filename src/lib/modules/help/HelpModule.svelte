<script lang="ts">
  import { APP_NAME } from '../../constants';
  import {
    ArrowUp,
    HandTap,
    FileText,
    SlidersHorizontal,
    BookOpen,
    GearSix
  } from 'phosphor-svelte';
</script>

<div class="help-scroll">
  <div class="help-container">
    <section class="start-card">
      <span class="start-arrow"><ArrowUp size={22} weight="bold" /></span>
      <div>
        <h1 class="start-title">Začněte klepnutím na název nahoře</h1>
        <p class="start-desc">
          Otevřou se Nástroje: všechny pomůcky podle abecedy. Rychlejší je psát do pole dole, najde
          i přezdívky („bin“, „pigpen“). Nad polem jsou naposledy použité.
        </p>
      </div>
    </section>

    <section class="card">
      <h2 class="card-title">Obrazovka nástroje</h2>
      <ul class="help-list">
        <li><strong>Nahoře výsledek,</strong> dole zadávání.</li>
        <li>
          <strong>Lišta</strong> mezi nimi radí další krok nebo ukazuje stav. Oranžová hlásí, co brání
          výsledku.
        </li>
        <li>
          <strong>Tahák</strong> <span class="inline-icon"><BookOpen size={14} weight="duotone" /></span>
          vpravo v liště: tabulky a Návod k nástroji.
        </li>
      </ul>
    </section>

    <section class="card">
      <h2 class="card-title">Záložky vpravo nahoře</h2>
      <ul class="help-list">
        <li>
          <strong>Interakce</strong> <span class="inline-icon"><HandTap size={14} weight="bold" /></span>
          klávesy nástroje.
        </li>
        <li>
          <strong>Podklad</strong> <span class="inline-icon"><FileText size={14} weight="bold" /></span>
          zadání jako text nebo fotka. Text jde psát i vzít ze schránky, klávesy upravují totéž.
        </li>
        <li>
          <strong>Menu</strong>
          <span class="inline-icon"><SlidersHorizontal size={14} weight="bold" /></span> volby nástroje
          a Reset nástroje.
        </li>
        <li><strong>Tečka</strong> na záložce znamená, že tam něco chce pozornost.</li>
      </ul>
    </section>

    <section class="card">
      <h2 class="card-title">Ovládání</h2>
      <ul class="help-list">
        <li><strong>Smazat vše</strong> se drží, Zpět stačí klepnout.</li>
        <li><strong>Kopírování:</strong> klepnutím na výsledek.</li>
        <li>
          <strong>Tlačítko Zpět</strong> v telefonu vrací o krok: záložky, tahák, Nástroje.
        </li>
        <li>
          <strong>Nastavení</strong> <span class="inline-icon"><GearSix size={14} weight="bold" /></span>
          vedle hledání: aktualizace, offline slovník, abecedy, vibrace.
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
    font-size: var(--text-base);
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
    color: var(--color-text-primary);
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
