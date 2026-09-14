export const APP_NAME = 'Samuel';
export const APP_CODENAME = 'Samuel';
export const APP_PREFIX = 'samuel';
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.1.0';
export const APP_BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 0;

export const STORAGE_KEYS = {
  SETTINGS: `${APP_PREFIX}_settings`,
  ALPHABET_ACTIVE: `${APP_PREFIX}_alphabet_active`,
  ALPHABET_LAYOUTS: `${APP_PREFIX}_alphabet_layouts`,
  MODULE_PREFIX: `${APP_PREFIX}_mod_`
} as const;
