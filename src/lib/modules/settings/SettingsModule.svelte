<script lang="ts">
  import { alphabet } from '../../state/alphabet.svelte';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import { APP_NAME, APP_VERSION } from '../../constants';
  import { dbState, getDatabase, findAnagrams, clearDbCache, checkUpdatesOnInit } from '../../db/database.svelte';
  import { MagnifyingGlass, Lightning, ArrowsClockwise, RocketLaunch, SpinnerGap, Check } from 'phosphor-svelte';

  let newLayoutName = $state('');
  let isCreatingLayout = $state(false);

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

    <!-- Alphabet Configuration Section -->
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

    <!-- App Preferences Section -->
    <section class="card">
      <h2 class="card-title">Předvolby aplikace</h2>

      <div class="toggle-row">
        <div class="toggle-info">
          <div class="toggle-title">Haptická odezva</div>
          <div class="toggle-desc">Vibrace při stisku kláves a potvrzeních v terénu</div>
        </div>
        <input
          type="checkbox"
          class="custom-switch"
          checked={settings.hapticsEnabled}
          onchange={(e) => {
            settings.hapticsEnabled = (e.target as HTMLInputElement).checked;
            settings.vibrate(30);
          }}
        />
      </div>

      <div class="toggle-row">
        <div class="toggle-info">
          <div class="toggle-title">Zabránit zhasnutí obrazovky (Wake Lock)</div>
          <div class="toggle-desc">Udržuje displej rozsvícený během luštění šifry</div>
        </div>
        <input
          type="checkbox"
          class="custom-switch"
          checked={settings.wakeLockEnabled}
          onchange={(e) => {
            settings.wakeLockEnabled = (e.target as HTMLInputElement).checked;
            settings.vibrate(25);
          }}
        />
      </div>

      <div class="toggle-row">
        <div class="toggle-info">
          <div class="toggle-title">Developer Tools / Expertní režim</div>
          <div class="toggle-desc">Zpřístupní pokročilou diagnostiku a experimentální funkce</div>
        </div>
        <input
          type="checkbox"
          class="custom-switch"
          checked={settings.devToolsEnabled}
          onchange={(e) => {
            settings.devToolsEnabled = (e.target as HTMLInputElement).checked;
            settings.vibrate(25);
            toast.show(settings.devToolsEnabled ? 'Expertní režim aktivován' : 'Expertní režim vypnut', { type: 'info' });
          }}
        />
      </div>
    </section>

    <!-- SQLite Dictionary Database Section -->
    <section class="card">
      <h2 class="card-title">Slovníková databáze (SQLite WASM)</h2>
      <p class="card-desc">
        Lokální offline databáze pro hledání přesmyček, křížovkových vzorů, posunů a automatické luštění šifer.
      </p>

      <div class="db-status-box">
        <div class="sys-row">
          <span>Stav databáze</span>
          {#if dbState.status === 'ready'}
            <span class="badge-online">● Připraveno ({dbState.totalRows.toLocaleString('cs-CZ')} záznamů)</span>
          {:else if dbState.status === 'loading'}
            <span class="badge-loading">
              <SpinnerGap size={13} class="spin" />
              <span>Stahování / načítání ({dbState.progress}%)</span>
            </span>
          {:else if dbState.status === 'error'}
            <span class="badge-error">✕ Chyba ({dbState.error})</span>
          {:else}
            <span class="badge-idle">○ Uloženo v paměti zařízení</span>
          {/if}
        </div>

        <div class="sys-row">
          <span>Úložiště</span>
          <span>SQLite WASM + IndexedDB</span>
        </div>

        {#if dbState.meta}
          <div class="sys-row">
            <span>Verze lokální DB</span>
            <code>{dbState.meta.dbVersion}</code>
          </div>
          <div class="sys-row">
            <span>Kontrolní hash</span>
            <code title={dbState.meta.dbHash}>{dbState.meta.dbHash.slice(0, 16)}</code>
          </div>
          <div class="sys-row">
            <span>Velikost v mezipaměti</span>
            <span>{(dbState.meta.dbSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
          </div>
          <div class="sys-row">
            <span>Datum databáze</span>
            <span>{new Date(dbState.meta.dbUpdated).toLocaleString('cs-CZ')}</span>
          </div>
        {/if}

        {#if dbState.remoteVersion}
          <div class="sys-row">
            <span>Serverová verze DB</span>
            <code>{dbState.remoteVersion.dbVersion}</code>
          </div>
          <div class="sys-row">
            <span>Synchronizace</span>
            {#if dbState.meta && dbState.meta.dbHash === dbState.remoteVersion.dbHash}
              <span class="badge-online">✓ Databáze je aktuální</span>
            {:else if !dbState.meta}
              <span class="badge-idle">○ Databáze dosud nestažena</span>
            {:else}
              <span class="badge-loading">
                <Lightning size={13} weight="duotone" />
                <span>K dispozici nová verze</span>
              </span>
            {/if}
          </div>
        {/if}
      </div>

      {#if dbState.updateAvailable}
        <div class="update-banner">
          <div class="update-banner-info">
            <div class="update-title">
              <RocketLaunch size={18} weight="duotone" />
              <span>K dispozici je aktualizace</span>
            </div>
            <div class="update-subtitle">
              {#if dbState.dbUpdateAvailable && dbState.remoteVersion}
                Nová verze slovníku: <code>{dbState.remoteVersion.dbVersion}</code> ({(dbState.remoteVersion.dbSizeBytes / (1024 * 1024)).toFixed(1)} MB). Aktualizujte pouze při stabilním připojení (např. na Wi-Fi).
              {:else if dbState.appUpdateAvailable && dbState.remoteVersion}
                K dispozici je nová verze aplikace (v{dbState.remoteVersion.appVersion}).
              {:else}
                Na serveru je k dispozici aktualizace.
              {/if}
            </div>
          </div>
          <button
            class="update-action-btn"
            disabled={dbState.status === 'loading'}
            onclick={async () => {
              try {
                if (dbState.dbUpdateAvailable) {
                  toast.show('Stahuji nejnovější data slovníku...', { type: 'info' });
                  await getDatabase({ forceRefresh: true });
                  toast.show('Aktualizace slovníku dokončena!', { type: 'success' });
                } else if (dbState.appUpdateAvailable) {
                  toast.show('Načítám novou verzi aplikace...', { type: 'info' });
                  window.location.reload();
                }
              } catch (err: any) {
                toast.show(`Chyba: ${err?.message}`, { type: 'danger' });
              }
            }}
          >
            {#if dbState.dbUpdateAvailable}
              Aktualizovat slovník
            {:else}
              Aktualizovat aplikaci
            {/if}
          </button>
        </div>
      {/if}

      <div class="db-actions">
        <button
          class="secondary-btn"
          disabled={dbState.status === 'loading'}
          onclick={async () => {
            try {
              toast.show('Kontroluji online verzi...', { type: 'info' });
              await checkUpdatesOnInit();
              if (!dbState.updateAvailable) {
                toast.show('Máte nejnovější verzi databáze i aplikace!', { type: 'success' });
              }
            } catch (err: any) {
              toast.show(`Chyba kontroly: ${err?.message}`, { type: 'danger' });
            }
          }}
        >
          <MagnifyingGlass size={16} weight="bold" />
          <span>Zkontrolovat dostupnost aktualizací</span>
        </button>

        <button
          class="secondary-btn"
          disabled={dbState.status === 'loading'}
          onclick={async () => {
            try {
              toast.show('Inicializuji SQLite WASM...', { type: 'info' });
              await getDatabase();
              const test = await findAnagrams('ceklov');
              toast.show(`Databáze připravena! Test přesmyčky "ceklov" -> ${test[0]?.word || 'ok'}`, { type: 'success' });
            } catch (err: any) {
              toast.show(`Chyba databáze: ${err?.message}`, { type: 'danger' });
            }
          }}
        >
          {#if dbState.status === 'ready'}
            <Check size={16} weight="bold" />
            <span>Databáze aktivní (otestovat přesmyčku)</span>
          {:else}
            <Lightning size={16} weight="duotone" />
            <span>Inicializovat databázi do paměti</span>
          {/if}
        </button>

        <button
          class="secondary-btn btn-danger-subtle"
          disabled={dbState.status === 'loading'}
          onclick={async () => {
            try {
              toast.show('Vymazávám cache a stahuji nejnovější databázi...', { type: 'info' });
              await clearDbCache();
              await getDatabase();
              toast.show(`Databáze úspěšně obnovena (${dbState.totalRows.toLocaleString('cs-CZ')} slov)!`, { type: 'success' });
            } catch (err: any) {
              toast.show(`Chyba při stahování: ${err?.message}`, { type: 'danger' });
            }
          }}
        >
          <ArrowsClockwise size={16} weight="bold" />
          <span>Znovu stáhnout databázi (vymazat cache)</span>
        </button>
      </div>
    </section>

    <!-- System Info & Offline Status -->
    <section class="card system-card">
      <div class="sys-row">
        <span>Aplikace</span>
        <strong>{APP_NAME}</strong>
      </div>
      <div class="sys-row">
        <span>Režim</span>
        <span class="badge-online">100% Offline PWA</span>
      </div>
      <div class="sys-row">
        <span>Verze klientského kódu</span>
        <code>{APP_VERSION}</code>
      </div>
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

  .card-title {
    font-size: 16px;
    font-weight: 700;
    margin: 0;
  }

  .card-desc {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin: 0;
    line-height: 1.4;
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

  .toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  .toggle-row:last-child {
    border-bottom: none;
  }

  .toggle-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .toggle-title {
    font-size: 15px;
    font-weight: 600;
  }

  .toggle-desc {
    font-size: 12px;
    color: var(--color-text-secondary);
    line-height: 1.3;
  }

  .custom-switch {
    width: 44px;
    height: 24px;
    appearance: none;
    background-color: #2a2a34;
    border-radius: 12px;
    position: relative;
    cursor: pointer;
    outline: none;
    transition: background-color 0.2s;
    flex-shrink: 0;
  }

  .custom-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background-color: #FFFFFF;
    border-radius: 50%;
    transition: transform 0.2s;
  }

  .custom-switch:checked {
    background-color: var(--color-accent-primary);
  }

  .custom-switch:checked::after {
    transform: translateX(20px);
  }

  .system-card {
    background-color: #101014;
    gap: 8px;
  }

  .sys-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  .badge-online {
    color: var(--color-accent-success);
    font-weight: 600;
  }

  .badge-loading {
    color: var(--color-accent-warning);
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  :global(.spin) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .badge-error {
    color: var(--color-accent-danger);
    font-weight: 600;
  }

  .badge-idle {
    color: var(--color-text-muted);
  }

  .db-status-box {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background-color: var(--color-surface-2);
    padding: 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border-subtle);
  }

  .db-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 4px;
  }

  .db-actions .secondary-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .update-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background-color: rgba(64, 150, 255, 0.12);
    border: 1px solid var(--color-accent-primary);
    border-radius: var(--radius-sm);
    padding: 12px;
  }

  .update-banner-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
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
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  .update-action-btn {
    padding: 8px 14px;
    background-color: var(--color-accent-primary);
    color: #000;
    font-size: 13px;
    font-weight: 700;
    border-radius: var(--radius-sm);
    white-space: nowrap;
    cursor: pointer;
    border: none;
  }

  .btn-danger-subtle {
    color: var(--color-text-secondary);
  }
  .btn-danger-subtle:hover {
    color: var(--color-accent-danger);
  }
</style>
