export type ModuleId =
  | 'morse'
  | 'braille'
  | 'semaphore'
  | 'flags'
  | 'cross'
  | 'numbers'
  | 'shifts'
  | 'substitution'
  | 'freq-ocr'
  | 'grille'
  | 'words'
  | 'calendar'
  | 'facts'
  | 'colors'
  | 'settings'
  | 'help';

export type SubView = 'none' | 'menu' | 'ref';

export interface ModuleMeta {
  id: ModuleId;
  name: string;
  icon: string;
  hasAlphabet?: boolean;
  isSystem?: boolean;
}

export const MODULES: ModuleMeta[] = [
  { id: 'morse', name: 'Morseovka', icon: '📡' },
  { id: 'braille', name: 'Braille', icon: '⠃' },
  { id: 'semaphore', name: 'Semafor', icon: '🚩' },
  { id: 'flags', name: 'Vlajky', icon: '🏁' },
  { id: 'cross', name: 'Kříže', icon: '⌗', hasAlphabet: true },
  { id: 'numbers', name: 'Čísla', icon: '🔢', hasAlphabet: true },
  { id: 'shifts', name: 'Posuny', icon: '🔄', hasAlphabet: true },
  { id: 'substitution', name: 'Substituce', icon: '🔤', hasAlphabet: true },
  { id: 'freq-ocr', name: 'Frekvence', icon: '📊' },
  { id: 'grille', name: 'Mřížka', icon: '▦' },
  { id: 'words', name: 'Slovník', icon: '📖' },
  { id: 'calendar', name: 'Kalendář', icon: '📅' },
  { id: 'facts', name: 'Fakta', icon: '💡' },
  { id: 'colors', name: 'Barvy', icon: '🎨' },
  { id: 'help', name: 'Nápověda', icon: '❓', isSystem: true },
  { id: 'settings', name: 'Nastavení', icon: '⚙️', isSystem: true }
];

export const CIPHER_MODULES = MODULES.filter((m) => !m.isSystem);
export const SYSTEM_MODULES = MODULES.filter((m) => m.isSystem);
