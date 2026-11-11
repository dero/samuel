import type { ModuleId, ModuleMeta, ModuleShortcut, SubView } from '../types';
import { MODULES } from '../types';
import { localSettingsService } from '../services/localSettingsService';
import { launcher } from './launcher.svelte';

const DEFAULT_FIRST_MODULE: ModuleId = 'help';
const LAUNCHER_ROUTE = 'nastroje';
/** Older links and bookmarks. */
const LEGACY_LAUNCHER_ROUTE = 'moduly';

/** Hash segment of each view; the interaction view is the bare module route. */
const VIEW_SEGMENT: Record<SubView, string> = {
  none: '',
  podklad: 'podklad',
  menu: 'menu',
  tahak: 'tahak',
  detail: 'detail'
};

class NavigationState {
  activeModuleId = $state<ModuleId>(DEFAULT_FIRST_MODULE);
  subView = $state<SubView>('none');
  /** Item shown by the `detail` view (`#/facts/detail/<id>`). */
  detailId = $state<string | null>(null);
  isLauncherOpen = $state<boolean>(false);
  hasMenuWarning = $state<boolean>(false);
  /** Reported by ModuleShell: the active module has options or a reset to show in the Menu tab. */
  hasMenu = $state<boolean>(false);
  activeModuleKey = $state<number>(0);
  /** Launcher tile that opened the active module (a shortcut id, or the module id). */
  activeEntryId = $state<string>(DEFAULT_FIRST_MODULE);

  activeModule = $derived(
    MODULES.find((m) => m.id === this.activeModuleId) ?? MODULES.find((m) => m.id === DEFAULT_FIRST_MODULE)!
  );

  private handleHashChange = () => this.syncFromHash();

  constructor() {
    if (typeof window !== 'undefined') {
      // The launcher route names no module: the last one stays open underneath it
      const persisted = this.getPersistedModule();
      this.activeModuleId = persisted;
      this.activeEntryId = persisted;
      this.syncFromHash();
      window.addEventListener('hashchange', this.handleHashChange);
    }
  }

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('hashchange', this.handleHashChange);
    }
  }

  private getPersistedModule(): ModuleId {
    const appScope = localSettingsService.forSection('app');
    const saved = appScope.getString('last_module', '') as ModuleId;
    if (saved && MODULES.some((m) => m.id === saved)) {
      return saved;
    }
    return DEFAULT_FIRST_MODULE;
  }

  private persistModule(id: ModuleId) {
    const appScope = localSettingsService.forSection('app');
    appScope.setString('last_module', id);
  }

  private viewHash(view: SubView, moduleId: ModuleId = this.activeModuleId): string {
    const segment = VIEW_SEGMENT[view];
    return segment ? `#/${moduleId}/${segment}` : `#/${moduleId}`;
  }

  /** Every change of view is a new hash and one Back step. */
  private go(hash: string) {
    if (window.location.hash === hash) return;
    window.history.pushState({ app: true }, '', hash);
    this.syncFromHash();
  }

  private redirect(hash: string) {
    window.history.replaceState(window.history.state, '', hash);
    this.syncFromHash();
  }

  private syncFromHash() {
    const raw = window.location.hash.replace(/^#\/?/, '').trim();

    if (raw === LAUNCHER_ROUTE) {
      this.isLauncherOpen = true;
      return;
    }
    if (raw === LEGACY_LAUNCHER_ROUTE) {
      this.redirect(`#/${LAUNCHER_ROUTE}`);
      return;
    }

    if (!raw) {
      this.redirect(this.viewHash('none', this.getPersistedModule()));
      return;
    }

    const parts = raw.split('/');
    const mod = MODULES.find((m) => m.id === parts[0]);
    if (!mod) {
      this.redirect(this.viewHash('none', this.getPersistedModule()));
      return;
    }

    if (this.activeModuleId !== mod.id) {
      this.hasMenuWarning = false;
      this.activeEntryId = mod.id;
    }
    this.isLauncherOpen = false;
    this.activeModuleId = mod.id;
    this.persistModule(mod.id);

    const detailId = parts[1] === 'detail' && parts[2] ? decodeSegment(parts[2]) : null;
    const view = parseView(parts[1], mod, detailId);
    this.detailId = view === 'detail' ? detailId : null;
    this.subView = view;
    if (parts[1] && view === 'none') {
      window.history.replaceState(window.history.state, '', this.viewHash('none', mod.id));
    }
  }

  openModule(id: ModuleId) {
    this.persistModule(id);
    this.go(this.viewHash('none', id));
  }

  /** Open a launcher shortcut: its target module with the shortcut's preset. */
  openShortcut(shortcut: ModuleShortcut) {
    launcher.pendingPreset = { target: shortcut.target, preset: shortcut.preset };
    this.openModule(shortcut.target);
    this.activeEntryId = shortcut.id;
  }

  openView(view: SubView) {
    this.go(this.viewHash(view));
  }

  /** The module cannot show this view (no podklad, required podklad missing…): no Back step. */
  replaceView(view: SubView) {
    this.redirect(this.viewHash(view));
  }

  openMenu() {
    if (this.hasMenu) this.openView('menu');
  }

  openTahak() {
    this.openView('tahak');
  }

  /** One item of a Přehled module over the whole area; Back or ✕ returns to the list. */
  openDetail(id: string) {
    this.go(`#/${this.activeModuleId}/detail/${encodeURIComponent(id)}`);
  }

  closeDetail() {
    this.leaveOverlay(this.viewHash('none'));
  }

  /** Back to the module's interaction. */
  closeSubView() {
    this.openView('none');
  }

  closeTahak() {
    this.leaveOverlay(this.viewHash('none'));
  }

  toggleLauncher() {
    if (this.isLauncherOpen) this.closeLauncher();
    else this.go(`#/${LAUNCHER_ROUTE}`);
  }

  closeLauncher() {
    this.leaveOverlay(this.viewHash('none'));
  }

  /** Closing an overlay is the same as Back; a deep link has nothing behind it to return to. */
  private leaveOverlay(fallback: string) {
    if (window.history.state?.app) window.history.back();
    else this.go(fallback);
  }

  setMenuWarning(hasWarning: boolean) {
    this.hasMenuWarning = hasWarning;
  }

  /** Forces a remount of the currently active module (e.g. after dictionary DB is installed). */
  reloadActiveModule() {
    this.activeModuleKey++;
  }
}

/** A malformed link (`%E0%A4`) names no item instead of crashing the app on start. */
function decodeSegment(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

function parseView(segment: string | undefined, mod: ModuleMeta, detailId: string | null): SubView {
  if (!segment || mod.isSystem) return 'none';
  if (segment === 'detail') return detailId ? 'detail' : 'none';
  if (segment === 'menu' || segment === 'podklad') return segment;
  if (segment === 'tahak' && mod.hasReference !== false) return 'tahak';
  return 'none';
}

export const navigation = new NavigationState();
