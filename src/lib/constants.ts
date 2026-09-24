export const APP_NAME = 'Samuel';
const APP_PREFIX = 'samuel';
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.1.0';
export const APP_BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 0;

export const STORAGE_KEYS = {
  SETTINGS: `${APP_PREFIX}_settings`
} as const;
