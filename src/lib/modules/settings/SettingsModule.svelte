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
  import HoldToAction from '../../components/ui/HoldToAction.svelte';
  import {
    ArrowsClockwise,
    RocketLaunch,
    SpinnerGap,
    CheckCircle,
    DownloadSimple,
    ShieldCheck,
    ShieldWarning,
    CaretDown
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

  const vs = versionService.state;

  // The result is shown in place (button, badge, version rows), so no toasts here.
  async function handleCheckUpdates() {
    settings.vibrate(20);
    await versionService.checkUpdates();
  }

  async function handleApplyUpdate() {
    try {
      settings.vibrate(30);
      if (vs.dbUpdateAvailable) {
        if (!(await versionService.downloadDb())) return;
        if (!vs.appUpdateAvailable) toast.show('Slovník aktualizován', { type: 'success' });
      }
      if (vs.appUpdateAvailable) {
        // Reloads into the new version when done.
        await versionService.updateApp();
      }
    } catch (err: any) {
      toast.show(`Chyba aktualizace: ${err?.message || 'Neznámá chyba'}`, { type: 'danger' });
    }
  }

  /** Update download in flight (a manual dictionary download is not an update). */
  let isUpdating = $derived(
    vs.status === 'downloading_app' || (vs.status === 'downloading_db' && vs.dbUpdateAvailable)
  );

  /** Badge reflects what the last check really found, never an unverified "up to date". */
  let statusBadge = $derived.by(() => {
    if (vs.updateAvailable) return { kind: 'update', label: 'Nová verze' };
    if (vs.lastCheck === 'ok') return { kind: 'online', label: 'Aktuální' };
    if (vs.lastCheck === 'failed') return { kind: 'offline', label: 'Nelze ověřit' };
    return null;
  });

  let newAppVersion = $derived(
    vs.appUpdateAvailable && vs.remoteVersion ? formatTimestamp(vs.remoteVersion.buildTime) : null
  );
  let newDbVersion = $derived(
    vs.dbUpdateAvailable && vs.remoteVersion
      ? formatTimestamp(vs.remoteVersion.dbUpdated || vs.remoteVersion.dbVersion)
      : null
  );

  /**
   * Versioned parts of the app, one row each. Everyday use only needs "current or not";
   * exact versions live under Diagnostika. New parts (map, OCR…) add a row here.
   */
  type PartState = 'ok' | 'update' | 'missing' | 'busy' | 'unknown';
  interface VersionedPart {
    id: string;
    name: string;
    detail?: string;
    state: PartState;
    actionLabel: string;
    onDownload: () => void;
    onCancel?: () => void;
  }

  let parts = $derived.by<VersionedPart[]>(() => {
    const checked = vs.lastCheck === 'ok';
    const app: VersionedPart = {
      id: 'app',
      name: 'Aplikace',
      state:
        vs.status === 'downloading_app'
          ? 'busy'
          : vs.appUpdateAvailable
            ? 'update'
            : checked
              ? 'ok'
              : 'unknown',
      actionLabel: 'Aktualizovat aplikaci',
      onDownload: handleUpdateAppOnly
    };
    const db: VersionedPart = {
      id: 'db',
      name: 'Slovník',
      detail: versionService.formattedDbSize,
      state:
        vs.status === 'downloading_db'
          ? 'busy'
          : !vs.isDbInstalled
            ? 'missing'
            : vs.dbUpdateAvailable
              ? 'update'
              : checked
                ? 'ok'
                : 'unknown',
      actionLabel: vs.isDbInstalled ? 'Aktualizovat slovník' : 'Stáhnout slovník',
      onDownload: handleDownloadDbManual,
      onCancel: () => versionService.cancelDownload()
    };
    return [app, db];
  });

  async function handleUpdateAppOnly() {
    try {
      settings.vibrate(30);
      await versionService.updateApp();
    } catch (err: any) {
      toast.show(`Chyba aktualizace: ${err?.message || 'Neznámá chyba'}`, { type: 'danger' });
    }
  }

  let showDiagnostics = $state(false);

  async function handleDownloadDbManual() {
    try {
      settings.vibrate(20);
      const wasInstalled = vs.isDbInstalled;
      if (await versionService.downloadDb()) {
        toast.show(wasInstalled ? 'Slovník aktualizován' : 'Slovník stažen', { type: 'success' });
      }
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

  function handleResetAllData() {
    // Navigates away on its own and never fails, so the button stays locked.
    isResetting = true;
    versionService.resetAllData();
  }
</script>

<div class="settings-scroll">
  <div class="settings-container">
    <!-- 1. Aktualizace (Na samém vrcholu) -->
    <section class="card update-card">
      <!-- The status sits on the title line; the description gets the full width under it -->
      <div>
        <div class="card-header-row">
          <h2 class="card-title">Aktualizace</h2>
          {#if statusBadge}
            <span class="badge-status {statusBadge.kind}">
              {#if statusBadge.kind === 'online'}
                <CheckCircle size={14} weight="fill" />
              {:else if statusBadge.kind === 'update'}
                <RocketLaunch size={14} weight="fill" />
              {/if}
              <span>{statusBadge.label}</span>
            </span>
          {/if}
        </div>
        <p class="card-desc">Aplikace i data fungují offline.</p>
      </div>

      <!-- One row per versioned part: current ✓, or a download key that updates just that part -->
      <ul class="parts-list">
        {#each parts as part (part.id)}
          <li class="part-row">
            <span class="part-name">
              {part.name}
              {#if part.detail}<span class="part-detail">{part.detail}</span>{/if}
            </span>
            {#if part.state === 'busy'}
              <span class="part-progress">
                <SpinnerGap size={16} class="spin" />
                {vs.progress} %
              </span>
              {#if part.onCancel && vs.status === 'downloading_db'}
                <button type="button" class="part-cancel" onclick={part.onCancel}>Zrušit</button>
              {/if}
            {:else if part.state === 'update' || part.state === 'missing'}
              <button
                type="button"
                class="part-download"
                aria-label={part.actionLabel}
                title={part.actionLabel}
                disabled={versionService.isBusy}
                onclick={part.onDownload}
              >
                <DownloadSimple size={18} weight="bold" />
                {#if part.state === 'missing'}<span>Stáhnout</span>{/if}
              </button>
            {:else if part.state === 'ok'}
              <span class="part-ok" role="img" aria-label="Aktuální" title="Aktuální">
                <CheckCircle size={22} weight="fill" />
              </span>
            {:else}
              <span class="part-unknown" title="Neověřeno">neověřeno</span>
            {/if}
          </li>
        {/each}
      </ul>

      {#if vs.error}
        <div class="update-error-banner">
          <span>{vs.error}</span>
        </div>
      {/if}

      <!-- Jedno tlačítko, které se mění na místě: Zkontrolovat → Aktualizovat vše → Stahuji -->
      <div class="update-actions-cluster">
        {#if vs.updateAvailable}
          <button class="update-action-btn" disabled={versionService.isBusy} onclick={handleApplyUpdate}>
            {#if isUpdating}
              <SpinnerGap size={16} class="spin" />
              <span>Stahuji ({vs.progress} %)…</span>
            {:else}
              <RocketLaunch size={16} weight="bold" />
              <span>{vs.error ? 'Zkusit znovu' : 'Aktualizovat vše'}</span>
            {/if}
          </button>
        {:else}
          <button class="secondary-btn flex-1" disabled={versionService.isBusy} onclick={handleCheckUpdates}>
            {#if vs.status === 'checking'}
              <SpinnerGap size={16} class="spin" />
              <span>Kontroluji…</span>
            {:else}
              <ArrowsClockwise size={16} weight="bold" />
              <span>{vs.lastCheck === 'failed' ? 'Zkusit znovu' : 'Zkontrolovat aktualizace'}</span>
            {/if}
          </button>
        {/if}
      </div>

      {#if vs.isDbInstalled}
        <HoldToAction
          onAction={handleDeleteDbManual}
          disabled={versionService.isBusy}
          showLabel={true}
          label="Smazat slovník ({versionService.formattedDbSize})"
          confirmedLabel="Slovník smazán"
          ariaLabel="Podržte pro smazání slovníku"
          holdDuration={600}
          variant="outline"
        />
      {/if}

      <!-- Exact versions only on demand: for bug reports, not everyday use -->
      <button
        type="button"
        class="diag-toggle"
        aria-expanded={showDiagnostics}
        onclick={() => {
          settings.vibrate(15);
          showDiagnostics = !showDiagnostics;
        }}
      >
        <span>Diagnostika</span>
        <span class="diag-caret" class:is-open={showDiagnostics}><CaretDown size={14} weight="bold" /></span>
      </button>
      {#if showDiagnostics}
        <dl class="diag-box">
          <dt>Aplikace</dt>
          <dd>{vs.appVersion} · {formattedAppVersion}</dd>
          {#if newAppVersion}
            <dt>Aplikace na serveru</dt>
            <dd class="is-new">{vs.remoteVersion?.appVersion} · {newAppVersion}</dd>
          {/if}
          <dt>Slovník</dt>
          <dd>
            {formattedDbVersion}{#if vs.dbMeta?.dbHash} · {vs.dbMeta.dbHash}{/if}
          </dd>
          {#if newDbVersion}
            <dt>Slovník na serveru</dt>
            <dd class="is-new">{newDbVersion}{#if vs.remoteVersion?.dbHash} · {vs.remoteVersion.dbHash}{/if}</dd>
          {/if}
          <dt>Poslední kontrola</dt>
          <dd>{vs.lastCheck === 'ok' ? 'Server odpověděl' : vs.lastCheck === 'failed' ? 'Server nedostupný' : 'Neproběhla'}</dd>
        </dl>
      {/if}
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

      <HoldToAction
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
    padding: var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .card-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    min-height: 28px;
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

  .badge-status.update {
    background-color: var(--color-accent-primary-subtle);
    color: var(--color-accent-primary);
    border: 1px solid var(--color-accent-primary);
  }

  .badge-status.offline {
    background-color: var(--color-surface-2);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border-subtle);
  }



  .version-badge {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  /* Versioned parts: one box with hairlines like the alphabet list, status in one column */
  .parts-list {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .part-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-height: 44px;
    padding: var(--space-xs) var(--space-sm) var(--space-xs) var(--space-md);
  }

  .part-row + .part-row {
    border-top: 1px solid var(--color-border-subtle);
  }

  .part-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    font-size: var(--text-sm);
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .part-detail {
    margin-left: var(--space-xs);
    font-size: var(--text-xs);
    font-weight: 400;
    color: var(--color-text-muted);
  }

  .part-ok {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    color: var(--color-accent-success);
  }

  .part-unknown {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    padding-right: var(--space-xs);
  }

  .part-progress {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: var(--text-xs);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--color-accent-primary);
  }

  .part-download {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 40px;
    height: var(--control-min-height);
    padding: 0 var(--space-sm);
    background-color: var(--color-accent-primary-subtle);
    border: 1px solid var(--color-accent-primary);
    border-radius: var(--radius-sm);
    color: var(--color-accent-primary);
    font-size: var(--text-xs);
    font-weight: 700;
    cursor: pointer;
  }

  .part-download:active:not(:disabled) {
    background-color: var(--color-surface-active);
  }

  .part-download:disabled > :global(*) {
    opacity: 0.5;
  }

  .part-cancel {
    height: var(--control-min-height);
    padding: 0 var(--space-sm);
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-danger, #ef4444);
    cursor: pointer;
  }

  .diag-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: var(--control-min-height);
    padding: 0;
    background: none;
    border: none;
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-secondary);
    cursor: pointer;
  }

  .diag-caret {
    display: flex;
    transition: transform 0.15s ease;
  }

  .diag-caret.is-open {
    transform: rotate(180deg);
  }

  /* Label above value: long timestamps and hashes never share a line with the label */
  .diag-box {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: var(--space-sm) var(--space-md);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
  }

  .diag-box dt {
    margin-top: var(--space-sm);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .diag-box dt:first-child {
    margin-top: 0;
  }

  .diag-box dd {
    margin: 0;
    font-size: var(--text-xs);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--color-text-primary);
    overflow-wrap: anywhere;
  }

  .diag-box dd.is-new {
    color: var(--color-accent-primary);
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
    align-items: baseline;
    gap: var(--space-md);
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .update-actions-cluster {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  .flex-1 {
    flex: 1;
  }



  .update-error-banner {
    padding: 8px 12px;
    background-color: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: var(--radius-sm);
    color: var(--color-text-danger, #ef4444);
    font-size: var(--text-xs);
    line-height: 1.4;
  }

  :global(.spin) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
