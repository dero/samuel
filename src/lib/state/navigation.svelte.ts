import type { ModuleId, SubView } from '../types';
import { MODULES } from '../types';
import { localSettingsService } from '../services/localSettingsService';

const DEFAULT_FIRST_MODULE: ModuleId = 'help';

class NavigationState {
  activeModuleId = $state<ModuleId>(DEFAULT_FIRST_MODULE);
  subView = $state<SubView>('none');
  isLauncherOpen = $state<boolean>(false);

  activeModule = $derived(
    MODULES.find((m) => m.id === this.activeModuleId) ?? MODULES.find((m) => m.id === DEFAULT_FIRST_MODULE)!
  );

  constructor() {
    if (typeof window !== 'undefined') {
      this.syncFromHash();
      window.addEventListener('hashchange', () => this.syncFromHash());
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

  private syncFromHash() {
    const raw = window.location.hash.replace(/^#\/?/, '').trim();
    if (!raw) {
      // Empty hash: redirect to last used module or help
      const target = this.getPersistedModule();
      this.activeModuleId = target;
      this.subView = 'none';
      window.location.replace(`#/${target}`);
      return;
    }

    const parts = raw.split('/');
    const modId = parts[0] as ModuleId;
    const sub = (parts[1] as SubView) || 'none';

    if (MODULES.some((m) => m.id === modId)) {
      this.activeModuleId = modId;
      this.subView = sub === 'menu' || sub === 'ref' ? sub : 'none';
      this.persistModule(modId);
    } else {
      // Invalid module id in URL: fallback to persisted or help
      const target = this.getPersistedModule();
      this.activeModuleId = target;
      this.subView = 'none';
      window.location.replace(`#/${target}`);
    }
    this.isLauncherOpen = false;
  }

  /**
   * Navigate to a module.
   */
  openModule(id: ModuleId) {
    this.isLauncherOpen = false;
    this.persistModule(id);
    const targetHash = `#/${id}`;

    if (this.activeModuleId !== id) {
      window.history.replaceState(null, '', targetHash);
      this.syncFromHash();
    } else if (this.subView !== 'none') {
      window.history.back();
    }
  }

  /**
   * Open module contextual menu (pushes state: Module > Menu)
   */
  openMenu() {
    this.isLauncherOpen = false;
    window.location.hash = `#/${this.activeModuleId}/menu`;
  }

  /**
   * Open module reference cheat sheet (pushes state: Module > Ref)
   */
  openRef() {
    this.isLauncherOpen = false;
    window.location.hash = `#/${this.activeModuleId}/ref`;
  }

  /**
   * Close any modal (menu/ref) and return to module view.
   */
  closeSubView() {
    if (this.subView !== 'none') {
      window.history.back();
    }
  }

  toggleLauncher() {
    this.isLauncherOpen = !this.isLauncherOpen;
  }

  closeLauncher() {
    this.isLauncherOpen = false;
  }
}

export const navigation = new NavigationState();
