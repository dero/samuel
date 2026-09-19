import { STORAGE_KEYS } from '../constants';

export interface RootSettingsData {
  app?: Record<string, any>;
  alphabet?: Record<string, any>;
  modules?: Record<string, Record<string, any>>;
  [key: string]: any;
}

export abstract class KeyValueScope {
  abstract getStore(): Record<string, any>;
  abstract onSave(): void;

  get<T>(key: string, defaultValue: T): T {
    const store = this.getStore();
    if (store[key] !== undefined && store[key] !== null) {
      return store[key] as T;
    }
    return defaultValue;
  }

  set<T>(key: string, value: T): void {
    const store = this.getStore();
    if (store[key] === value) return;
    store[key] = value;
    this.onSave();
  }

  has(key: string): boolean {
    const store = this.getStore();
    return store[key] !== undefined && store[key] !== null;
  }

  removeItem(key: string): void {
    const store = this.getStore();
    if (key in store) {
      delete store[key];
      this.onSave();
    }
  }

  getString(key: string, defaultValue = ''): string {
    const val = this.get(key, defaultValue);
    return typeof val === 'string' ? val : String(val ?? defaultValue);
  }

  setString(key: string, value: string): void {
    this.set(key, value);
  }

  getBoolean(key: string, defaultValue: boolean): boolean {
    const val = this.get(key, defaultValue);
    if (typeof val === 'boolean') return val;
    if (val === 'true' || val === '1' || val === 1) return true;
    if (val === 'false' || val === '0' || val === 0) return false;
    return defaultValue;
  }

  setBoolean(key: string, value: boolean): void {
    this.set(key, Boolean(value));
  }

  getNumber(key: string, defaultValue: number): number {
    const val = this.get(key, defaultValue);
    if (typeof val === 'number' && !isNaN(val)) return val;
    const num = Number(val);
    return isNaN(num) ? defaultValue : num;
  }

  setNumber(key: string, value: number): void {
    this.set(key, Number(value));
  }

  getJSON<T>(key: string, defaultValue: T): T {
    const val = this.get<T>(key, defaultValue);
    if (val === undefined || val === null) return defaultValue;
    if (typeof val === 'string') {
      try {
        return JSON.parse(val) as T;
      } catch {
        return defaultValue;
      }
    }
    return val;
  }

  setJSON<T>(key: string, value: T): void {
    this.set(key, value);
  }

  /**
   * Batch update multiple key-value pairs with a single persistence save.
   */
  update(entries: Record<string, any>): void {
    const store = this.getStore();
    let changed = false;
    for (const [key, val] of Object.entries(entries)) {
      if (store[key] !== val) {
        store[key] = val;
        changed = true;
      }
    }
    if (changed) {
      this.onSave();
    }
  }

  getAll(): Record<string, any> {
    return { ...this.getStore() };
  }

  clear(): void {
    const store = this.getStore();
    let changed = false;
    for (const k of Object.keys(store)) {
      delete store[k];
      changed = true;
    }
    if (changed) this.onSave();
  }
}

/**
 * Scoped settings access for a specific section or module.
 * All mutations automatically persist to the single root settings object in localStorage.
 */
export class SettingsScope extends KeyValueScope {
  constructor(
    private readonly storeGetter: () => Record<string, any>,
    private readonly saveHandler: () => void,
    public readonly scopePath: string
  ) {
    super();
  }

  getStore(): Record<string, any> {
    return this.storeGetter();
  }

  onSave(): void {
    this.saveHandler();
  }
}

/**
 * Centralized service managing a single persistent settings JSON object in localStorage.
 * Consolidates all app, alphabet, and module settings into one single storage key (`samuel_settings`).
 */
export class LocalSettingsService extends KeyValueScope {
  private readonly storageKey = STORAGE_KEYS.SETTINGS;
  private readonly isStorageAvailable: boolean;
  private data: RootSettingsData;
  private readonly scopes = new Map<string, SettingsScope>();
  private isSaveScheduled = false;

  constructor() {
    super();
    this.isStorageAvailable = this.checkStorageAvailability();
    this.data = this.loadInitialData();
  }

  getStore(): Record<string, any> {
    return this.data;
  }

  onSave(): void {
    this.scheduleSave();
  }

  private checkStorageAvailability(): boolean {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return false;
    }
    try {
      const testKey = '__samuel_storage_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private loadInitialData(): RootSettingsData {
    if (this.isStorageAvailable) {
      try {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as RootSettingsData;
          }
        }
      } catch (e) {
        console.warn('LocalSettingsService: Error parsing localStorage settings, initializing fresh.', e);
      }
    }
    return {};
  }

  private commitSave(): void {
    this.isSaveScheduled = false;
    if (!this.isStorageAvailable) return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.warn('LocalSettingsService: Failed to save settings to localStorage', e);
    }
  }

  /**
   * Batches asynchronous save writes within the same microtask / event loop tick
   * to eliminate duplicate JSON.stringify and localStorage writes during reactive updates.
   */
  public scheduleSave(): void {
    if (this.isSaveScheduled) return;
    this.isSaveScheduled = true;
    queueMicrotask(() => {
      if (this.isSaveScheduled) {
        this.commitSave();
      }
    });
  }

  /**
   * Synchronously flushes any pending saves immediately.
   */
  public flush(): void {
    if (this.isSaveScheduled) {
      this.commitSave();
    }
  }

  get isAvailable(): boolean {
    return this.isStorageAvailable;
  }

  /**
   * Scoped settings for a specific module (stored under `data.modules[moduleId]`).
   */
  forModule(moduleId: string): SettingsScope {
    const scopeKey = `module:${moduleId}`;
    let scope = this.scopes.get(scopeKey);
    if (!scope) {
      scope = new SettingsScope(
        () => {
          if (!this.data.modules || typeof this.data.modules !== 'object' || Array.isArray(this.data.modules)) {
            this.data.modules = {};
          }
          if (!this.data.modules[moduleId] || typeof this.data.modules[moduleId] !== 'object' || Array.isArray(this.data.modules[moduleId])) {
            this.data.modules[moduleId] = {};
          }
          return this.data.modules[moduleId];
        },
        () => this.scheduleSave(),
        `modules.${moduleId}`
      );
      this.scopes.set(scopeKey, scope);
    }
    return scope;
  }

  /**
   * Scoped settings for a top-level section (stored under `data[sectionName]`).
   */
  forSection(sectionName: string): SettingsScope {
    const scopeKey = `section:${sectionName}`;
    let scope = this.scopes.get(scopeKey);
    if (!scope) {
      scope = new SettingsScope(
        () => {
          if (!this.data[sectionName] || typeof this.data[sectionName] !== 'object' || Array.isArray(this.data[sectionName])) {
            this.data[sectionName] = {};
          }
          return this.data[sectionName];
        },
        () => this.scheduleSave(),
        sectionName
      );
      this.scopes.set(scopeKey, scope);
    }
    return scope;
  }

  /**
   * Returns a deep copy of the entire settings root object.
   */
  getRootData(): RootSettingsData {
    return JSON.parse(JSON.stringify(this.data));
  }

  /**
   * Replaces entire root data with imported settings and saves.
   */
  importRootData(newData: RootSettingsData): void {
    if (newData && typeof newData === 'object' && !Array.isArray(newData)) {
      this.data = JSON.parse(JSON.stringify(newData));
      this.commitSave();
    }
  }

  /**
   * Resets all settings by clearing the root object and removing the single LS entry.
   */
  clear(): void {
    this.isSaveScheduled = false;
    this.data = {};
    if (this.isStorageAvailable) {
      try {
        localStorage.removeItem(this.storageKey);
      } catch {
        // ignore
      }
    }
  }
}

export const localSettingsService = new LocalSettingsService();
export const localSettings = localSettingsService;

