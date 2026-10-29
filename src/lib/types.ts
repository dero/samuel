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
  | 'nonogram'
  | 'chess'
  // PLANNED: Future modules (render GenericModulePlaceholder)
  | 'grille'
  | 'turtle'
  | 'plotter'
  | 'words'
  | 'calendar'
  | 'facts'
  | 'colors'
  | 'elements'
  | 'settings'
  | 'help';

export type SubView = 'none' | 'menu' | 'ref';

export type ModuleGroupId = 'coding' | 'text' | 'realia' | 'puzzles' | 'drawing' | 'app';

export interface ModuleGroup {
  id: ModuleGroupId;
  name: string;
  color: string;
}

/** Launcher groups in display order. Color is a CSS variable reference. */
export const MODULE_GROUPS: ModuleGroup[] = [
  { id: 'coding', name: 'Kódování', color: 'var(--color-group-coding)' },
  { id: 'text', name: 'Text', color: 'var(--color-group-text)' },
  { id: 'realia', name: 'Reálie', color: 'var(--color-group-realia)' },
  { id: 'puzzles', name: 'Rébusy', color: 'var(--color-group-puzzles)' },
  { id: 'drawing', name: 'Kreslení', color: 'var(--color-group-drawing)' },
  { id: 'app', name: 'Aplikace', color: 'var(--color-group-app)' }
];

export interface ModuleMeta {
  id: ModuleId;
  name: string;
  icon: string;
  /** Launcher group (block with a colored side label). */
  group: ModuleGroupId;
  hasAlphabet?: boolean;
  isSystem?: boolean;
  hasReference?: boolean;
  hasMenu?: boolean;
}

export const MODULES: ModuleMeta[] = [
  { id: 'morse', name: 'Morse', icon: 'Broadcast', group: 'coding' },
  { id: 'braille', name: 'Braille', icon: 'DotsSixVertical', group: 'coding' },
  { id: 'semaphore', name: 'Semafor', icon: 'FlagBanner', group: 'coding' },
  { id: 'flags', name: 'Vlajky', icon: 'FlagCheckered', group: 'coding' },
  { id: 'states', name: 'Státy', icon: 'GlobeSimple', group: 'realia', hasReference: false, hasMenu: false },
  { id: 'cross', name: 'Kříže', icon: 'Hash', group: 'coding', hasAlphabet: true },
  { id: 'polybius', name: 'Polybius', icon: 'GridFour', group: 'coding', hasAlphabet: true },
  { id: 'mobile', name: 'Mobil', icon: 'DeviceMobile', group: 'coding' },
  { id: 'numbers', name: 'Čísla', icon: 'Calculator', group: 'coding', hasAlphabet: true },
  { id: 'shifts', name: 'Posuny', icon: 'ArrowsClockwise', group: 'text', hasAlphabet: true },
  { id: 'substitution', name: 'Substituce', icon: 'TextAa', group: 'text', hasAlphabet: true },
  { id: 'freq', name: 'Frekvence', icon: 'ChartBar', group: 'text' },
  { id: 'sudoku', name: 'Sudoku', icon: 'GridNine', group: 'puzzles' },
  { id: 'nonogram', name: 'Nonogram', icon: 'PaintBrushBroad', group: 'puzzles' },
  { id: 'chess', name: 'Šachy', icon: 'Horse', group: 'puzzles' },
  { id: 'grille', name: 'Mřížka', icon: 'SquaresFour', group: 'text' },
  { id: 'turtle', name: 'Želva', icon: 'Path', group: 'drawing' },
  { id: 'plotter', name: 'Plotr', icon: 'Compass', group: 'drawing' },
  { id: 'words', name: 'Slovník', icon: 'BookOpen', group: 'text' },
  { id: 'calendar', name: 'Kalendář', icon: 'CalendarBlank', group: 'realia', hasMenu: false },
  { id: 'facts', name: 'Fakta', icon: 'Lightbulb', group: 'realia', hasReference: false, hasMenu: false },
  { id: 'colors', name: 'Barvy', icon: 'Palette', group: 'realia', hasReference: true, hasMenu: false },
  { id: 'elements', name: 'Chemie', icon: 'Atom', group: 'realia', hasReference: true, hasMenu: false },
  { id: 'help', name: 'Nápověda', icon: 'Question', group: 'app', isSystem: true },
  { id: 'settings', name: 'Nastavení', icon: 'Gear', group: 'app', isSystem: true }
];
