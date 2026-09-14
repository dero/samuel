import type { ModuleId, SubView } from '../types';
import { MODULES } from '../types';

class NavigationState {
  activeModuleId = $state<ModuleId | null>(null);
  subView = $state<SubView>('none');
  isLauncherOpen = $state<boolean>(false);

  activeModule = $derived(
    this.activeModuleId ? (MODULES.find((m) => m.id === this.activeModuleId) ?? null) : null
  );

  constructor() {
    if (typeof window !== 'undefined') {
      this.syncFromHash();
      window.addEventListener('hashchange', () => this.syncFromHash());
    }
  }

  private syncFromHash() {
    const raw = window.location.hash.replace(/^#\/?/, '').trim();
    if (!raw) {
      this.activeModuleId = null;
      this.subView = 'none';
      return;
    }

    const parts = raw.split('/');
    const modId = parts[0] as ModuleId;
    const sub = (parts[1] as SubView) || 'none';

    if (MODULES.some((m) => m.id === modId)) {
      this.activeModuleId = modId;
      this.subView = sub === 'menu' || sub === 'ref' ? sub : 'none';
    } else if (raw === 'menu') {
      this.activeModuleId = null;
      this.subView = 'menu';
    } else {
      this.activeModuleId = null;
      this.subView = 'none';
    }
    this.isLauncherOpen = false;
  }

  /**
   * Navigate to a module. Enforces strict stack depth: Dash > Module.
   * If already inside a module, replaces state so history doesn't pile up.
   */
  openModule(id: ModuleId) {
    this.isLauncherOpen = false;
    const targetHash = `#/${id}`;

    if (this.activeModuleId && this.activeModuleId !== id) {
      // Replacing current module: Dash > NewModule
      window.history.replaceState(null, '', targetHash);
      this.syncFromHash();
    } else if (this.activeModuleId === id) {
      if (this.subView !== 'none') {
        window.history.back();
      }
    } else {
      // From dashboard: Dash > NewModule
      window.location.hash = targetHash;
    }
  }

  /**
   * Open the dashboard.
   */
  openDashboard() {
    this.isLauncherOpen = false;
    if (this.activeModuleId) {
      window.location.hash = '#/';
    }
  }

  /**
   * Open module contextual menu or dashboard main menu (pushes state: Dash > Menu or Dash > Module > Menu)
   */
  openMenu() {
    this.isLauncherOpen = false;
    if (this.activeModuleId) {
      window.location.hash = `#/${this.activeModuleId}/menu`;
    } else {
      window.location.hash = '#/menu';
    }
  }

  /**
   * Open module reference cheat sheet (pushes state: Dash > Module > Ref)
   */
  openRef() {
    if (!this.activeModuleId) return;
    this.isLauncherOpen = false;
    window.location.hash = `#/${this.activeModuleId}/ref`;
  }

  /**
   * Close any modal (menu/ref) and return to previous view.
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
