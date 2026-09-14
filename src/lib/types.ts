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
  { id: 'morse', name: 'Morseovka', icon: 'Broadcast' },
  { id: 'braille', name: 'Braille', icon: 'DotsSixVertical' },
  { id: 'semaphore', name: 'Semafor', icon: 'FlagBanner' },
  { id: 'flags', name: 'Vlajky', icon: 'FlagCheckered' },
  { id: 'cross', name: 'Kříže', icon: 'Hash', hasAlphabet: true },
  { id: 'numbers', name: 'Čísla', icon: 'Calculator', hasAlphabet: true },
  { id: 'shifts', name: 'Posuny', icon: 'ArrowsClockwise', hasAlphabet: true },
  { id: 'substitution', name: 'Substituce', icon: 'TextAa', hasAlphabet: true },
  { id: 'freq-ocr', name: 'Frekvence', icon: 'ChartBar' },
  { id: 'grille', name: 'Mřížka', icon: 'GridFour' },
  { id: 'words', name: 'Slovník', icon: 'BookOpen' },
  { id: 'calendar', name: 'Kalendář', icon: 'CalendarBlank' },
  { id: 'facts', name: 'Fakta', icon: 'Lightbulb' },
  { id: 'colors', name: 'Barvy', icon: 'Palette' },
  { id: 'help', name: 'Nápověda', icon: 'Question', isSystem: true },
  { id: 'settings', name: 'Nastavení', icon: 'Gear', isSystem: true }
];

export const CIPHER_MODULES = MODULES.filter((m) => !m.isSystem);
export const SYSTEM_MODULES = MODULES.filter((m) => m.isSystem);
