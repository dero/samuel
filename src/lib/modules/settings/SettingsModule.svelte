<script lang="ts">
  import { onMount } from 'svelte';
  import AlphabetLayoutManager from './AlphabetLayoutManager.svelte';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import { versionService } from '../../services/versionService.svelte';
  import {
    isStoragePersisted,
    requestStoragePersistence,
    getStorageEstimate,
    isLikelyIos
  } from '../../services/storageService';
  import SlideToAction from '../../components/ui/SlideToAction.svelte';
  import {
    ArrowsClockwise,
    RocketLaunch,
    SpinnerGap,
    CheckCircle,
    DownloadSimple,
    ShieldCheck,
    ShieldWarning
  } from 'phosphor-svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';

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
    formatTimestamp(versionService.state.buildTime)
  );

  let formattedDbVersion = $derived(
    !versionService.state.isDbInstalled
      ? 'Nestaženo'
      : versionService.state.dbMeta?.dbUpdated
        ? formatTimestamp(versionService.state.dbMeta.dbUpdated)
        : versionService.state.dbMeta?.dbVersion
          ? formatTimestamp(versionService.state.dbMeta.dbVersion)
          : 'Nainstalováno'
  );

  async function handleCheckUpdates() {
    try {
      settings.vibrate(20);
      toast.show('Kontroluji aktualizace...', { type: 'info', duration: 2000 });
      const { updateAvailable } = await versionService.checkUpdates();
      if (!updateAvailable) {
        toast.show('Máte nejnovější verzi', { type: 'success', duration: 2500 });
      } else {
        toast.show('Je dostupná nová verze', { type: 'warning', duration: 3000 });
      }
    } catch {
      toast.show('Chyba kontroly', { type: 'danger' });
    }
  }

  async function handleApplyUpdate() {
    try {
      settings.vibrate(30);
      if (versionService.state.dbUpdateAvailable) {
        toast.show('Stahuji slovník…', { type: 'info' });
        await versionService.downloadDb();
        toast.show('Slovník aktualizován', { type: 'success' });
      } else if (versionService.state.appUpdateAvailable) {
        toast.show('Stahuji novou verzi...', { type: 'info' });
        await versionService.updateApp();
        toast.show('Aplikace aktualizována', { type: 'success' });
      }
    } catch {
      toast.show('Chyba aktualizace', { type: 'danger' });
    }
  }

  async function handleDownloadDbManual() {
    try {
      settings.vibrate(20);
      toast.show('Stahuji slovník…', { type: 'info' });
      await versionService.downloadDb();
      toast.show('Slovník stažen', { type: 'success' });
    } catch (err: any) {
      toast.show(`Chyba: ${err?.message || 'Nepodařilo se stáhnout'}`, { type: 'danger' });
    }
  }

  async function handleDeleteDbManual() {
    try {
      await versionService.deleteDb();
      toast.show('Slovník smazán', { type: 'info' });
    } catch {
      toast.show('Chyba při mazání slovníku', { type: 'danger' });
    }
  }

  // --- Persistentní úložiště (ochrana proti automatickému smazání mezipaměti) ---
  let storagePersisted = $state(false);
  let storageUsageBytes = $state<number | null>(null);
  let storageQuotaBytes = $state<number | null>(null);
  let isRequestingPersistence = $state(false);
  const iosDevice = isLikelyIos();

  function formatMegabytes(bytes: number | null): string {
    if (bytes === null) return '?';
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  }

  async function refreshStorageStatus() {
    storagePersisted = await isStoragePersisted();
    const estimate = await getStorageEstimate();
    storageUsageBytes = estimate.usageBytes;
    storageQuotaBytes = estimate.quotaBytes;
  }

  onMount(() => {
    refreshStorageStatus();
  });

  async function handleRequestPersistence() {
    settings.vibrate(20);
    isRequestingPersistence = true;
    try {
      const granted = await requestStoragePersistence();
      await refreshStorageStatus();
      toast.show(
        granted ? 'Úložiště je nyní trvalé' : 'Prohlížeč trvalé úložiště nepovolil',
        { type: granted ? 'success' : 'warning' }
      );
    } catch {
      toast.show('Chyba při žádosti o úložiště', { type: 'danger' });
    } finally {
      isRequestingPersistence = false;
    }
  }

  let isResetting = $state(false);

  async function handleResetAllData() {
    isResetting = true;
    try {
      await versionService.resetAllData();
    } catch (err) {
      console.error('Failed to reset all data:', err);
      isResetting = false;
      toast.show('Chyba při resetu dat', { type: 'danger' });
    }
  }
</script>

<div class="settings-scroll">
  <div class="settings-container">
    <!-- 1. Aktualizace (Na samém vrcholu) -->
    <section class="card update-card">
      <div class="card-header-row">
        <div>
          <h2 class="card-title">Aktualizace</h2>
          <p class="card-desc">Aplikace i data fungují offline.</p>
        </div>
        {#if !versionService.state.updateAvailable && versionService.state.status === 'idle'}
          <span class="badge-status online">
            <CheckCircle size={14} weight="fill" />
            <span>Aktuální</span>
          </span>
        {/if}
      </div>

      <!-- Banner s výzvou k aktualizaci, pokud je k dispozici -->
      {#if versionService.state.updateAvailable}
        <div class="update-banner">
          <div class="update-banner-info">
            <div class="update-title">
              <RocketLaunch size={18} weight="duotone" />
              <span>Nová verze</span>
            </div>
            <div class="update-subtitle">
              {#if versionService.state.dbUpdateAvailable && versionService.state.remoteVersion}
                Slovník z {formatTimestamp(versionService.state.remoteVersion.dbUpdated || versionService.state.remoteVersion.dbVersion)}
              {:else if versionService.state.appUpdateAvailable && versionService.state.remoteVersion}
                Aplikace z {formatTimestamp(versionService.state.remoteVersion.buildTime)}
              {:else}
                Novější verze na serveru
              {/if}
            </div>
          </div>
          <button
            class="update-action-btn"
            disabled={versionService.state.status !== 'idle'}
            onclick={handleApplyUpdate}
          >
            {#if versionService.state.status === 'downloading_app' || versionService.state.status === 'downloading_db'}
              <SpinnerGap size={15} class="spin" />
              <span>Stahuji ({versionService.state.progress} %)...</span>
            {:else}
              <RocketLaunch size={16} weight="bold" />
              <span>Aktualizovat</span>
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
          <span>Slovník</span>
          <span class="version-badge">{formattedDbVersion}</span>
        </div>
      </div>

      <!-- Tlačítko pro stažení / smazání slovníku -->
      {#if !versionService.state.isDbInstalled}
        <button
          class="secondary-btn"
          disabled={versionService.state.status !== 'idle'}
          onclick={handleDownloadDbManual}
        >
          {#if versionService.state.status === 'downloading_db'}
            <SpinnerGap size={16} class="spin" />
            <span>Stahuji slovník ({versionService.state.progress} %)...</span>
          {:else}
            <DownloadSimple size={16} weight="bold" />
            <span>Stáhnout slovník ({versionService.formattedDbSize})</span>
          {/if}
        </button>
      {:else}
        <SlideToAction
          onAction={handleDeleteDbManual}
          disabled={versionService.state.status !== 'idle'}
          showLabel={true}
          label="Smazat slovník ({versionService.formattedDbSize})"
          confirmedLabel="Slovník smazán"
          ariaLabel="Podržte pro smazání slovníku"
          holdDuration={600}
          variant="outline"
        />
      {/if}

      <!-- Tlačítko kontroly aktualizací -->
      <button
        class="secondary-btn"
        disabled={versionService.state.status !== 'idle'}
        onclick={handleCheckUpdates}
      >
        {#if versionService.state.status === 'checking'}
          <SpinnerGap size={16} class="spin" />
          <span>Kontroluji aktualizace...</span>
        {:else}
          <ArrowsClockwise size={16} weight="bold" />
          <span>Zkontrolovat aktualizace</span>
        {/if}
      </button>
    </section>

    <!-- 2. Správa abeced -->
    <AlphabetLayoutManager />

    <!-- 3. Předvolby aplikace -->
    <section class="card">
      <h2 class="card-title">Předvolby</h2>

      <OptionRow
        label="Haptická odezva"
        hint="Vibrace při stisku kláves"
        type="switch"
        checked={settings.hapticsEnabled}
        onChange={(val) => {
          settings.hapticsEnabled = val;
        }}
      />

      <OptionRow
        label="Nezhasínat obrazovku"
        type="switch"
        checked={settings.wakeLockEnabled}
        onChange={(val) => {
          settings.wakeLockEnabled = val;
        }}
      />
    </section>

    <!-- 4. Trvalé úložiště -->
    <section class="card">
      <div class="card-header-row">
        <div>
          <h2 class="card-title">Trvalé úložiště</h2>
          <p class="card-desc">Chrání offline data před smazáním prohlížečem.</p>
        </div>
        {#if storagePersisted}
          <span class="badge-status online">
            <ShieldCheck size={14} weight="fill" />
            <span>Trvalé</span>
          </span>
        {/if}
      </div>

      <div class="version-box">
        <div class="sys-row">
          <span>Stav úložiště</span>
          <span class="version-badge">{storagePersisted ? 'Trvalé' : 'Dočasné'}</span>
        </div>
        <div class="sys-row">
          <span>Využito místa</span>
          <span class="version-badge">
            {formatMegabytes(storageUsageBytes)} / {formatMegabytes(storageQuotaBytes)}
          </span>
        </div>
      </div>

      {#if !storagePersisted}
        <button
          class="secondary-btn"
          disabled={isRequestingPersistence}
          onclick={handleRequestPersistence}
        >
          {#if isRequestingPersistence}
            <SpinnerGap size={16} class="spin" />
            <span>Žádám…</span>
          {:else}
            <ShieldWarning size={16} weight="bold" />
            <span>Povolit trvalé úložiště</span>
          {/if}
        </button>
        {#if iosDevice}
          <p class="card-desc">
            Na iPhonu a iPadu přidejte Samuela na plochu (Sdílet → Přidat na plochu), jinak může Safari data smazat.
          </p>
        {/if}
      {/if}
    </section>

    <!-- 5. Reset a správa úložiště -->
    <section class="card">
      <h2 class="card-title">Reset dat</h2>
      <p class="card-desc">Smaže všechna offline data včetně slovníku.</p>

      <SlideToAction
        onAction={handleResetAllData}
        disabled={isResetting}
        showLabel={true}
        label={isResetting ? "Resetuji…" : "Reset všech dat"}
        confirmedLabel="Resetuji…"
        ariaLabel="Podržte pro reset všech dat"
        holdDuration={800}
        variant="outline"
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
