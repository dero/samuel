import type { ModuleId, SubView } from '../types';
import { MODULES } from '../types';
import { localSettingsService } from '../services/localSettingsService';

const DEFAULT_FIRST_MODULE: ModuleId = 'help';

class NavigationState {
  activeModuleId = $state<ModuleId>(DEFAULT_FIRST_MODULE);
  subView = $state<SubView>('none');
  isLauncherOpen = $state<boolean>(false);
  hasMenuWarning = $state<boolean>(false);

  activeModule = $derived(
    MODULES.find((m) => m.id === this.activeModuleId) ?? MODULES.find((m) => m.id === DEFAULT_FIRST_MODULE)!
  );

  private handleHashChange = () => this.syncFromHash();

  constructor() {
    if (typeof window !== 'undefined') {
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
      if (this.activeModuleId !== modId) {
        this.hasMenuWarning = false;
        this.isLauncherOpen = false;
      }
      this.activeModuleId = modId;
      this.subView = sub === 'menu' || sub === 'ref' ? sub : 'none';
      this.persistModule(modId);
    } else {
      // Invalid module id in URL: fallback to persisted or help
      const target = this.getPersistedModule();
      this.activeModuleId = target;
      this.subView = 'none';
      this.isLauncherOpen = false;
      window.location.replace(`#/${target}`);
    }
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
      this.closeSubView();
    }
  }

  /**
   * Open module contextual menu (pushes state: Module > Menu)
   */
  openMenu() {
    this.isLauncherOpen = false;
    this.subView = 'menu';
    const targetHash = `#/${this.activeModuleId}/menu`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
  }

  /**
   * Toggle module contextual menu
   */
  toggleMenu() {
    if (this.subView === 'menu') {
      this.closeSubView();
    } else {
      this.openMenu();
    }
  }

  /**
   * Open module reference cheat sheet (pushes state: Module > Ref)
   */
  openRef() {
    this.isLauncherOpen = false;
    this.subView = 'ref';
    const targetHash = `#/${this.activeModuleId}/ref`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
  }

  /**
   * Toggle module reference cheat sheet
   */
  toggleRef() {
    if (this.subView === 'ref') {
      this.closeSubView();
    } else {
      this.openRef();
    }
  }

  /**
   * Close any modal (menu/ref) and return to module view.
   */
  closeSubView() {
    if (this.subView !== 'none') {
      this.subView = 'none';
      const targetHash = `#/${this.activeModuleId}`;
      if (window.location.hash !== targetHash) {
        window.history.replaceState(null, '', targetHash);
      }
    }
  }

  toggleLauncher() {
    this.isLauncherOpen = !this.isLauncherOpen;
  }

  closeLauncher() {
    this.isLauncherOpen = false;
  }

  setMenuWarning(hasWarning: boolean) {
    this.hasMenuWarning = hasWarning;
  }
}

export const navigation = new NavigationState();
