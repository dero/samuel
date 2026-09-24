import { localSettingsService } from '../services/localSettingsService';

/**
 * Creates reactive module state with automated localStorage persistence and reset capabilities.
 * Eliminates repetitive localSettingsService.forModule() boilerplate and manual persistence $effects across modules.
 */
export function createModuleState<T extends Record<string, any>>(
  moduleId: string,
  defaults: T
): { state: T; reset: () => void } {
  const modSettings = localSettingsService.forModule(moduleId);

  const initial = {} as T;
  for (const [key, defaultVal] of Object.entries(defaults)) {
    if (typeof defaultVal === 'boolean') {
      (initial as any)[key] = modSettings.getBoolean(key, defaultVal);
    } else if (typeof defaultVal === 'number') {
      (initial as any)[key] = modSettings.getNumber(key, defaultVal);
    } else if (typeof defaultVal === 'string') {
      (initial as any)[key] = modSettings.getString(key, defaultVal);
    } else {
      (initial as any)[key] = modSettings.getJSON(key, defaultVal);
    }
  }

  const state = $state<T>(initial);

  $effect(() => {
    const toSave: Record<string, any> = {};
    for (const key of Object.keys(defaults)) {
      toSave[key] = (state as any)[key];
    }
    modSettings.update(toSave);
  });

  function reset() {
    for (const [key, defaultVal] of Object.entries(defaults)) {
      (state as any)[key] = defaultVal;
    }
  }

  return { state, reset };
}
