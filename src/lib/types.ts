export type ModuleId =
  | 'morse'
  | 'braille'
  | 'semaphore'
  | 'flags'
  | 'states'
  | 'cross'
  | 'polybius'
  | 'mobile'
  | 'numbers'
  | 'shifts'
  | 'substitution'
  | 'freq'
  | 'sudoku'
  // PLANNED: Future modules (render GenericModulePlaceholder)
  | 'grille'
  | 'turtle'
  | 'words'
  | 'calendar'
  | 'facts'
  | 'colors'
  | 'elements'
  | 'settings'
  | 'help';

export type SubView = 'none' | 'menu' | 'ref';

export interface ModuleMeta {
  id: ModuleId;
  name: string;
  icon: string;
  hasAlphabet?: boolean;
  isSystem?: boolean;
  hasReference?: boolean;
  hasMenu?: boolean;
}

export const MODULES: ModuleMeta[] = [
  { id: 'morse', name: 'Morse', icon: 'Broadcast' },
  { id: 'braille', name: 'Braille', icon: 'DotsSixVertical' },
  { id: 'semaphore', name: 'Semafor', icon: 'FlagBanner' },
  { id: 'flags', name: 'Vlajky', icon: 'FlagCheckered' },
  { id: 'states', name: 'Státy', icon: 'GlobeSimple', hasReference: false, hasMenu: false },
  { id: 'cross', name: 'Kříže', icon: 'Hash', hasAlphabet: true },
  { id: 'polybius', name: 'Polybius', icon: 'GridFour', hasAlphabet: true },
  { id: 'mobile', name: 'Mobil', icon: 'DeviceMobile' },
  { id: 'numbers', name: 'Čísla', icon: 'Calculator', hasAlphabet: true },
  { id: 'shifts', name: 'Posuny', icon: 'ArrowsClockwise', hasAlphabet: true },
  { id: 'substitution', name: 'Substituce', icon: 'TextAa', hasAlphabet: true },
  { id: 'freq', name: 'Frekvence', icon: 'ChartBar' },
  { id: 'sudoku', name: 'Sudoku atd.', icon: 'GridNine', hasReference: true, hasMenu: true },
  { id: 'grille', name: 'Mřížka', icon: 'SquaresFour' },
  { id: 'turtle', name: 'Želva', icon: 'Path' },
  { id: 'words', name: 'Slovník', icon: 'BookOpen' },
  { id: 'calendar', name: 'Kalendář', icon: 'CalendarBlank', hasMenu: false },
  { id: 'facts', name: 'Fakta', icon: 'Lightbulb', hasReference: false, hasMenu: false },
  { id: 'colors', name: 'Barvy', icon: 'Palette', hasReference: true, hasMenu: false },
  { id: 'elements', name: 'PSP', icon: 'Atom', hasReference: false, hasMenu: false },
  { id: 'help', name: 'Nápověda', icon: 'Question', isSystem: true },
  { id: 'settings', name: 'Nastavení', icon: 'Gear', isSystem: true }
];
