<script lang="ts">
  import { alphabet } from '../../state/alphabet.svelte';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import { APP_BUILD_TIME } from '../../constants';
  import { dbState, getDatabase, checkUpdatesOnInit } from '../../db/database.svelte';
  import { ArrowsClockwise, RocketLaunch, SpinnerGap, CheckCircle } from 'phosphor-svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';

  let newLayoutName = $state('');
  let isCreatingLayout = $state(false);
  let isCheckingUpdates = $state(false);

  function formatTimestamp(ts: number | string | undefined | null): string {
    if (!ts) return 'Neznámé';
    try {
      if (typeof ts === 'string' && /^\d{4}\.\d{2}\.\d{2}-\d{4}$/.test(ts)) {
        const [datePart, timePart] = ts.split('-');
        const [y, m, d] = datePart.split('.');
        const hh = timePart.slice(0, 2);
        const mm = timePart.slice(2, 4);
        return `${Number(d)}. ${Number(m)}. ${y}, ${hh}:${mm}`;
      }
      const d = new Date(ts);
      if (isNaN(d.getTime())) return String(ts);
      return d.toLocaleString('cs-CZ', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(ts);
    }
  }

  let formattedAppVersion = $derived(
    APP_BUILD_TIME > 0 ? formatTimestamp(APP_BUILD_TIME) : formatTimestamp(Date.now())
  );

  let formattedDbVersion = $derived(
    dbState.meta?.dbUpdated
      ? formatTimestamp(dbState.meta.dbUpdated)
      : dbState.meta?.dbVersion
        ? formatTimestamp(dbState.meta.dbVersion)
        : dbState.remoteVersion?.dbUpdated
          ? formatTimestamp(dbState.remoteVersion.dbUpdated)
          : dbState.remoteVersion?.dbVersion
            ? formatTimestamp(dbState.remoteVersion.dbVersion)
            : 'Aktuální'
  );

  async function handleCheckUpdates() {
    isCheckingUpdates = true;
    try {
      settings.vibrate(20);
      toast.show('Kontroluji dostupnost aktualizací...', { type: 'info', duration: 2000 });
      await checkUpdatesOnInit();
      if (!dbState.updateAvailable) {
        toast.show('Vše je aktuální! Máte nejnovější verzi.', { type: 'success', duration: 2500 });
      } else {
        toast.show('Je k dispozici novější verze!', { type: 'warning', duration: 3000 });
      }
    } catch (err: any) {
      toast.show(`Chyba kontroly: ${err?.message}`, { type: 'danger' });
    } finally {
      isCheckingUpdates = false;
    }
  }

  async function handleApplyUpdate() {
    try {
      settings.vibrate(30);
      if (dbState.dbUpdateAvailable) {
        toast.show('Stahuji nejnovější data slovníku...', { type: 'info' });
        await getDatabase({ forceRefresh: true });
        toast.show('Slovník byl úspěšně aktualizován!', { type: 'success' });
      } else if (dbState.appUpdateAvailable) {
        toast.show('Načítám novou verzi aplikace...', { type: 'info' });
        window.location.reload();
      }
    } catch (err: any) {
      toast.show(`Chyba: ${err?.message}`, { type: 'danger' });
    }
  }

  function handleCreateLayout() {
    if (!newLayoutName.trim()) {
      toast.show('Zadejte název abecedy', { type: 'danger' });
      return;
    }
    const id = alphabet.addCustomLayout(newLayoutName.trim(), [...alphabet.currentLetters]);
    newLayoutName = '';
    isCreatingLayout = false;
    toast.show('Vlastní abeceda vytvořena', { type: 'success' });
  }

  function toggleLetter(char: string) {
    if (alphabet.currentLayout.isBuiltin) {
      toast.show('Výchozí abecedy nelze upravovat. Vytvořte si vlastní kopii níže.', { type: 'info' });
      return;
    }
    settings.vibrate(25);
    const letters = alphabet.currentLetters;
    const idx = letters.indexOf(char);
    let updated: string[];
    if (idx >= 0) {
      updated = letters.filter((l) => l !== char);
    } else {
      updated = [...letters, char].sort();
    }
    alphabet.currentLayout.letters = updated;
  }
</script>

<div class="settings-scroll">
  <div class="settings-container">
    <h1 class="page-title">Globální nastavení</h1>

    <!-- 1. Aktualizace (Na samém vrcholu) -->
    <section class="card update-card">
      <div class="card-header-row">
        <div>
          <h2 class="card-title">Aktualizace</h2>
          <p class="card-desc">
            Aplikace i data fungují offline. Aktualizace probíhají jednoduše jedním klepnutím.
          </p>
        </div>
        {#if !dbState.updateAvailable && dbState.status !== 'loading'}
          <span class="badge-status online">
            <CheckCircle size={14} weight="fill" />
            <span>Aktuální</span>
          </span>
        {:else if dbState.updateAvailable}
          <span class="badge-status update">
            <RocketLaunch size={14} weight="fill" />
            <span>Nová verze!</span>
          </span>
        {/if}
      </div>

      <!-- Banner s výzvou k aktualizaci, pokud je k dispozici -->
      {#if dbState.updateAvailable}
        <div class="update-banner">
          <div class="update-banner-info">
            <div class="update-title">
              <RocketLaunch size={18} weight="duotone" />
              <span>K dispozici je novější verze</span>
            </div>
            <div class="update-subtitle">
              {#if dbState.dbUpdateAvailable && dbState.remoteVersion}
                Nová verze slovníku ({formatTimestamp(dbState.remoteVersion.dbUpdated || dbState.remoteVersion.dbVersion)}).
              {:else if dbState.appUpdateAvailable && dbState.remoteVersion}
                Nové vydání aplikace ({formatTimestamp(dbState.remoteVersion.buildTime)}).
              {:else}
                Na serveru je k dispozici novější verze.
              {/if}
            </div>
          </div>
          <button
            class="update-action-btn"
            disabled={isCheckingUpdates || dbState.status === 'loading'}
            onclick={handleApplyUpdate}
          >
            {#if dbState.status === 'loading'}
              <SpinnerGap size={15} class="spin" />
              <span>Stahuji...</span>
            {:else}
              <RocketLaunch size={16} weight="bold" />
              <span>Aktualizovat nyní</span>
            {/if}
          </button>
        </div>
      {/if}

      <!-- Evergreen verze aplikace a databáze (datum, čas) -->
      <div class="version-box">
        <div class="sys-row">
          <span>Verze aplikace</span>
          <span class="version-badge">{formattedAppVersion}</span>
        </div>
        <div class="sys-row">
          <span>Slovníková data</span>
          <span class="version-badge">{formattedDbVersion}</span>
        </div>
      </div>

      <!-- Tlačítko kontroly aktualizací -->
      <button
        class="secondary-btn"
        disabled={isCheckingUpdates || dbState.status === 'loading'}
        onclick={handleCheckUpdates}
      >
        {#if isCheckingUpdates}
          <SpinnerGap size={16} class="spin" />
          <span>Kontroluji aktualizace...</span>
        {:else}
          <ArrowsClockwise size={16} weight="bold" />
          <span>Zkontrolovat aktualizace</span>
        {/if}
      </button>
    </section>

    <!-- 2. Abecedy & Rozložení -->
    <section class="card">
      <h2 class="card-title">Abecedy & Rozložení</h2>
      <p class="card-desc">
        Nastavení globální abecedy pro Kříže, Čísla písmen, Posuny a Substituci.
      </p>

      <div class="layouts-list">
        {#each alphabet.layouts as layout}
          <div class="layout-row" class:active={layout.id === alphabet.activeId}>
            <button
              class="layout-select-btn"
              onclick={() => {
                settings.vibrate(25);
                alphabet.setActiveLayout(layout.id);
              }}
            >
              <span class="radio-circle">{layout.id === alphabet.activeId ? '●' : '○'}</span>
              <span class="layout-name">{layout.name}</span>
              <span class="layout-count">({layout.letters.length} znaků)</span>
            </button>

            {#if !layout.isBuiltin}
              <button
                class="delete-btn"
                onclick={() => {
                  settings.vibrate(35);
                  alphabet.deleteCustomLayout(layout.id);
                }}
              >
                ✕
              </button>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Letters grid for active layout -->
      <div class="letters-preview">
        <div class="preview-label">Znaky aktivní abecedy ({alphabet.length}):</div>
        <div class="letters-chips">
          {#each alphabet.currentLetters as letter}
            <button
              class="letter-chip"
              class:disabled-edit={alphabet.currentLayout.isBuiltin}
              onclick={() => toggleLetter(letter)}
            >
              {letter}
            </button>
          {/each}
        </div>
      </div>

      <!-- Create Custom Layout -->
      {#if !isCreatingLayout}
        <button
          class="secondary-btn"
          onclick={() => {
            settings.vibrate(25);
            isCreatingLayout = true;
          }}
        >
          + Vytvořit vlastní abecedu (kopie aktivní)
        </button>
      {:else}
        <div class="new-layout-form">
          <input
            type="text"
            placeholder="Název abecedy (např. S heslem KOS)"
            bind:value={newLayoutName}
          />
          <div class="form-actions">
            <button class="save-btn" onclick={handleCreateLayout}>Uložit</button>
            <button class="cancel-btn" onclick={() => (isCreatingLayout = false)}>Zrušit</button>
          </div>
        </div>
      {/if}
    </section>

    <!-- 3. Předvolby aplikace -->
    <section class="card">
      <h2 class="card-title">Předvolby aplikace</h2>

      <OptionRow
        label="Haptická odezva"
        hint="Vibrace při stisku kláves a potvrzeních v terénu"
        type="switch"
        checked={settings.hapticsEnabled}
        onChange={(val) => {
          settings.hapticsEnabled = val;
          settings.vibrate(30);
        }}
      />

      <OptionRow
        label="Zabránit zhasnutí obrazovky (Wake Lock)"
        hint="Udržuje displej rozsvícený během luštění šifry"
        type="switch"
        checked={settings.wakeLockEnabled}
        onChange={(val) => {
          settings.wakeLockEnabled = val;
          settings.vibrate(25);
        }}
      />

      <OptionRow
        label="Developer Tools / Expertní režim"
        hint="Zpřístupní pokročilou diagnostiku a experimentální funkce"
        type="switch"
        checked={settings.devToolsEnabled}
        onChange={(val) => {
          settings.devToolsEnabled = val;
          settings.vibrate(25);
          toast.show(settings.devToolsEnabled ? 'Expertní režim aktivován' : 'Expertní režim vypnut', { type: 'info' });
        }}
      />
    </section>
  </div>
</div>

<style>
  .settings-scroll {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
    background-color: var(--color-bg-canvas);
    -webkit-overflow-scrolling: touch;
  }

  .settings-container {
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
    margin: 0 0 4px 0;
  }

  .card {
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .card-header-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .card-title {
    font-size: 16px;
    font-weight: 700;
    margin: 0;
  }

  .card-desc {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin: 3px 0 0 0;
    line-height: 1.4;
  }

  .badge-status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: var(--radius-full);
    font-size: 12px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .badge-status.online {
    background-color: rgba(34, 197, 94, 0.15);
    color: var(--color-accent-success);
    border: 1px solid rgba(34, 197, 94, 0.3);
  }

  .badge-status.update {
    background-color: rgba(64, 150, 255, 0.18);
    color: var(--color-accent-primary);
    border: 1px solid var(--color-accent-primary);
  }

  .version-box {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background-color: var(--color-surface-2);
    padding: 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border-subtle);
  }

  .version-badge {
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .update-banner {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    background-color: rgba(64, 150, 255, 0.12);
    border: 1px solid var(--color-accent-primary);
    border-radius: var(--radius-sm);
    padding: 14px;
  }

  .update-banner-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .update-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--color-accent-primary);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .update-subtitle {
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.35;
  }

  .update-action-btn {
    width: 100%;
    padding: 10px 14px;
    background-color: var(--color-accent-primary);
    color: #000;
    font-size: 14px;
    font-weight: 700;
    border-radius: var(--radius-sm);
    cursor: pointer;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-sizing: border-box;
    transition: opacity 0.15s ease, transform 0.05s ease;
  }

  .update-action-btn:active:not(:disabled) {
    transform: scale(0.98);
    opacity: 0.9;
  }

  .update-action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .layouts-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .layout-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: 6px 10px;
  }
  .layout-row.active {
    border-color: var(--color-accent-primary);
  }

  .layout-select-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    text-align: left;
    padding: 6px 0;
  }

  .radio-circle {
    font-size: 16px;
    color: var(--color-accent-primary);
  }

  .layout-name {
    font-size: 14px;
    font-weight: 600;
  }

  .layout-count {
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  .delete-btn {
    padding: 6px 10px;
    color: var(--color-accent-danger);
    font-size: 14px;
  }

  .letters-preview {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
    background-color: rgba(0, 0, 0, 0.4);
    border-radius: var(--radius-sm);
  }

  .preview-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .letters-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .letter-chip {
    padding: 4px 8px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: 4px;
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 600;
  }

  .letter-chip.disabled-edit {
    cursor: default;
  }

  .secondary-btn {
    padding: 10px 14px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    font-size: 14px;
    font-weight: 600;
    color: var(--color-accent-primary);
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
  }

  .secondary-btn:active:not(:disabled) {
    background-color: var(--color-surface-active);
  }

  .secondary-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .new-layout-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .new-layout-form input {
    padding: 10px 12px;
    font-size: 14px;
  }

  .form-actions {
    display: flex;
    gap: 8px;
  }

  .save-btn {
    flex: 1;
    padding: 10px;
    background-color: var(--color-accent-primary);
    color: #000;
    font-weight: 700;
    border-radius: var(--radius-sm);
  }

  .cancel-btn {
    padding: 10px 16px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    font-size: 13px;
  }

  .sys-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  :global(.spin) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
