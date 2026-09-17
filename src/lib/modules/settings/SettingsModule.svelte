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
      toast.show('Kontroluji aktualizace...', { type: 'info', duration: 2000 });
      await checkUpdatesOnInit();
      if (!dbState.updateAvailable) {
        toast.show('Máte nejnovější verzi', { type: 'success', duration: 2500 });
      } else {
        toast.show('Dostupná nová verze!', { type: 'warning', duration: 3000 });
      }
    } catch {
      toast.show('Chyba kontroly', { type: 'danger' });
    } finally {
      isCheckingUpdates = false;
    }
  }

  async function handleApplyUpdate() {
    try {
      settings.vibrate(30);
      if (dbState.dbUpdateAvailable) {
        toast.show('Stahuji slovník...', { type: 'info' });
        await getDatabase({ forceRefresh: true });
        toast.show('Slovník aktualizován', { type: 'success' });
      } else if (dbState.appUpdateAvailable) {
        toast.show('Načítám novou verzi...', { type: 'info' });
        window.location.reload();
      }
    } catch {
      toast.show('Chyba aktualizace', { type: 'danger' });
    }
  }

  let inspectedLayoutId = $state<string>(alphabet.layouts[0]?.id ?? 'english-26');

  let inspectedLayout = $derived(
    alphabet.getLayout(inspectedLayoutId) ?? alphabet.layouts[0]
  );

  function handleCreateLayout() {
    if (!newLayoutName.trim()) {
      toast.show('Zadejte název abecedy', { type: 'danger' });
      return;
    }
    const id = alphabet.addCustomLayout(
      newLayoutName.trim(),
      [...inspectedLayout.letters]
    );
    inspectedLayoutId = id;
    newLayoutName = '';
    isCreatingLayout = false;
    toast.show('Abeceda vytvořena', { type: 'success' });
  }

  function toggleLetter(char: string) {
    if (inspectedLayout.isBuiltin) {
      toast.show('Vestavěné nelze upravit', { type: 'info' });
      return;
    }
    settings.vibrate(25);
    const letters = inspectedLayout.letters;
    const idx = letters.indexOf(char);
    let updated: string[];
    if (idx >= 0) {
      updated = letters.filter((l) => l !== char);
    } else {
      updated = [...letters, char].sort();
    }
    alphabet.updateCustomLayout(inspectedLayoutId, updated);
  }
</script>

<div class="settings-scroll">
  <div class="settings-container">
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

    <!-- 2. Správa abeced -->
    <section class="card">
      <h2 class="card-title">Správa abeced</h2>
      <p class="card-desc">
        Přehled vestavěných abeced a tvorba vlastních sad znaků pro šifrovací nástroje. Volba konkrétní abecedy se provádí přímo v menu jednotlivých nástrojů.
      </p>

      <div class="layouts-list">
        {#each alphabet.layouts as layout (layout.id)}
          {@const isInspected = layout.id === inspectedLayoutId}
          <div class="layout-row" class:active={isInspected}>
            <button
              type="button"
              class="layout-select-btn"
              onclick={() => {
                settings.vibrate(20);
                inspectedLayoutId = layout.id;
              }}
            >
              <span class="layout-name">{layout.name}</span>
              <span class="layout-count">({layout.letters.length} znaků)</span>
              {#if layout.isBuiltin}
                <span class="builtin-badge">Vestavěná</span>
              {:else}
                <span class="custom-badge">Vlastní</span>
              {/if}
            </button>

            {#if !layout.isBuiltin}
              <button
                type="button"
                class="delete-btn"
                title="Smazat vlastní abecedu"
                onclick={() => {
                  settings.vibrate(35);
                  alphabet.deleteCustomLayout(layout.id);
                  if (inspectedLayoutId === layout.id) {
                    inspectedLayoutId = alphabet.layouts[0]?.id ?? 'english-26';
                  }
                  toast.show('Abeceda smazána', { type: 'info' });
                }}
              >
                ✕
              </button>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Letters grid for inspected layout -->
      <div class="letters-preview">
        <div class="preview-label">
          Znaky: <strong>{inspectedLayout.name}</strong> ({inspectedLayout.letters.length}):
        </div>
        {#if inspectedLayout.description}
          <div class="preview-desc">{inspectedLayout.description}</div>
        {/if}
        <div class="letters-chips">
          {#each inspectedLayout.letters as letter}
            <button
              type="button"
              class="letter-chip"
              class:disabled-edit={inspectedLayout.isBuiltin}
              onclick={() => toggleLetter(letter)}
            >
              {letter}
            </button>
          {/each}
        </div>
        {#if inspectedLayout.isBuiltin}
          <div class="preview-hint">
            Vestavěné abecedy jsou chráněné proti úpravám. Chcete-li znaky měnit, vytvořte si kopii tlačítkem níže.
          </div>
        {/if}
      </div>

      <!-- Create Custom Layout -->
      {#if !isCreatingLayout}
        <button
          type="button"
          class="secondary-btn"
          onclick={() => {
            settings.vibrate(25);
            isCreatingLayout = true;
          }}
        >
          + Vytvořit vlastní abecedu (kopie: {inspectedLayout.name})
        </button>
      {:else}
        <div class="new-layout-form">
          <input
            type="text"
            placeholder="Název nové abecedy (např. S heslem KOS)"
            bind:value={newLayoutName}
          />
          <div class="form-actions">
            <button type="button" class="save-btn" onclick={handleCreateLayout}>Uložit</button>
            <button type="button" class="cancel-btn" onclick={() => (isCreatingLayout = false)}>Zrušit</button>
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
        }}
      />

      <OptionRow
        label="Zabránit zhasnutí obrazovky (Wake Lock)"
        hint="Udržuje displej rozsvícený během luštění šifry"
        type="switch"
        checked={settings.wakeLockEnabled}
        onChange={(val) => {
          settings.wakeLockEnabled = val;
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
    gap: var(--space-md);
  }

  .card-title {
    font-size: var(--text-base);
    font-weight: 700;
    margin: 0;
  }

  .card-desc {
    font-size: var(--text-sm);
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
    font-size: var(--text-xs);
    font-weight: 700;
    flex-shrink: 0;
  }

  .badge-status.online {
    background-color: var(--color-accent-success-subtle);
    color: var(--color-accent-success);
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .version-box {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    background-color: var(--color-surface-2);
    padding: var(--space-md);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border-subtle);
  }

  .version-badge {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .update-banner {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-md);
    background-color: var(--color-accent-primary-subtle);
    border: 1px solid var(--color-accent-primary);
    border-radius: var(--radius-sm);
    padding: var(--space-md);
  }

  .update-banner-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .update-title {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-accent-primary);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .update-subtitle {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: 1.35;
  }

  .update-action-btn {
    width: 100%;
    padding: 10px 14px;
    background-color: var(--color-accent-primary);
    color: var(--color-text-inverse);
    font-size: var(--text-sm);
    font-weight: 700;
    border-radius: var(--radius-sm);
    cursor: pointer;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
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
    gap: var(--space-sm);
    flex: 1;
    text-align: left;
    padding: 6px 0;
  }

  .layout-name {
    font-size: var(--text-sm);
    font-weight: 600;
  }

  .layout-count {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  .builtin-badge {
    font-size: var(--text-2xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    padding: 1px 6px;
    border-radius: var(--radius-full);
    background-color: var(--color-surface-active);
    color: var(--color-text-secondary);
  }

  .custom-badge {
    font-size: var(--text-2xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    padding: 1px 6px;
    border-radius: var(--radius-full);
    background-color: var(--color-accent-primary-subtle);
    color: var(--color-accent-primary);
  }

  .delete-btn {
    padding: 6px 10px;
    color: var(--color-accent-danger);
    font-size: var(--text-sm);
  }

  .letters-preview {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-md);
    background-color: var(--color-surface-1);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border-subtle);
  }

  .preview-label {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .preview-desc {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    line-height: 1.35;
  }

  .preview-hint {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    font-style: italic;
    line-height: 1.35;
    margin-top: 4px;
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
    border-radius: var(--radius-xs);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
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
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-accent-primary);
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
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
    gap: var(--space-sm);
  }

  .new-layout-form input {
    padding: 10px 12px;
    font-size: var(--text-sm);
  }

  .form-actions {
    display: flex;
    gap: var(--space-sm);
  }

  .save-btn {
    flex: 1;
    padding: 10px;
    background-color: var(--color-accent-primary);
    color: var(--color-text-inverse);
    font-weight: 700;
    border-radius: var(--radius-sm);
  }

  .cancel-btn {
    padding: 10px 16px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
  }

  .sys-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--text-sm);
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
