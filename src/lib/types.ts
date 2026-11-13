export type ModuleId =
  | 'morse'
  | 'braille'
  | 'semaphore'
  | 'flags'
  | 'states'
  | 'cross'
  | 'cube'
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
  | 'graph'
  | 'words'
  | 'calendar'
  | 'facts'
  | 'colors'
  | 'elements'
  | 'settings'
  | 'help';

/** What the module shows: its interaction ('none'), a lower-panel tab, or the cheat sheet. */
/** `detail` is one item of a Přehled module over the whole area (a Fakta article), named by `navigation.detailId`. */
export type SubView = 'none' | 'podklad' | 'menu' | 'tahak' | 'detail';

export type ModuleGroupId = 'coding' | 'text' | 'realia' | 'puzzles' | 'drawing' | 'app';

export interface ModuleGroup {
  id: ModuleGroupId;
  name: string;
}

/** Categories are not shown any more; their names stay as search words ("kódování" finds Morse). */
export const MODULE_GROUPS: ModuleGroup[] = [
  { id: 'coding', name: 'Kódování' },
  { id: 'text', name: 'Text' },
  { id: 'realia', name: 'Reálie' },
  { id: 'puzzles', name: 'Rébusy' },
  { id: 'drawing', name: 'Kreslení' },
  { id: 'app', name: 'Aplikace' }
];

export interface ModuleMeta {
  id: ModuleId;
  name: string;
  icon: string;
  /** Category, only as a search word in the launcher. */
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
  { id: 'cube', name: 'Krychle', icon: 'Cube', group: 'coding', hasAlphabet: true },
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
  { id: 'graph', name: 'Graf', icon: 'Graph', group: 'drawing' },
  { id: 'words', name: 'Slovník', icon: 'BookOpen', group: 'text' },
  { id: 'calendar', name: 'Kalendář', icon: 'CalendarBlank', group: 'realia', hasMenu: false },
  { id: 'facts', name: 'Fakta', icon: 'Lightbulb', group: 'realia', hasReference: false, hasMenu: false },
  { id: 'colors', name: 'Barvy', icon: 'Palette', group: 'realia', hasReference: true, hasMenu: false },
  { id: 'elements', name: 'Chemie', icon: 'Atom', group: 'realia', hasReference: true, hasMenu: false },
  { id: 'help', name: 'Nápověda', icon: 'Question', group: 'app', isSystem: true },
  { id: 'settings', name: 'Nastavení', icon: 'Gear', group: 'app', isSystem: true }
];

/** Search aliases for the launcher (matched by word prefix, without diacritics). */
export const MODULE_KEYWORDS: Partial<Record<ModuleId, string[]>> = {
  morse: ['morseovka', 'tečky', 'čárky', 'telegraf'],
  braille: ['braillovo písmo', 'slepecké písmo', 'body'],
  semaphore: ['praporky', 'praporková abeceda'],
  flags: ['námořní vlajky', 'signální vlajky'],
  states: ['země', 'státní vlajky', 'hlavní města'],
  cross: ['polský kříž', 'pigpen', 'zednářská šifra', 'kříž'],
  cube: ['kostka', '3d', 'vrstvy', 'vrcholy', 'hrany', 'stěny', 'polský kříž'],
  polybius: ['polybiův čtverec', 'souřadnice', 'tabulka 5x5'],
  mobile: ['sms', 't9', 'telefon', 'klávesnice telefonu'],
  numbers: [
    'soustavy',
    'binárka',
    'dvojkovka',
    'binární',
    'trojkovka',
    'ternárka',
    'ternární',
    'osmičková',
    'šestnáctková',
    'hex',
    'římská čísla',
    'a1z26',
    'ascii',
    'čísla na písmena'
  ],
  shifts: ['caesar', 'cézar', 'vigenère', 'vigenere', 'autokey', 'rot13', 'posun abecedy'],
  substitution: ['záměna', 'šifrová abeceda', 'monoalfabetická'],
  freq: ['četnost', 'frekvenční analýza', 'index koincidence', 'ioc'],
  nonogram: ['malovaná křížovka', 'japonská křížovka'],
  chess: ['fen', 'pgn', 'partie', 'mat'],
  grille: ['otočná mřížka', 'fleissner', 'grille', 'transpozice'],
  turtle: ['želví grafika', 'kreslení', 'logo'],
  plotter: ['souřadnice', 'kreslení', 'graf'],
  graph: ['uzly', 'hrany', 'orientovaný', 'síť', 'vztahy', 'vazby', 'strom', 'cesta'],
  words: ['slova', 'maska', 'přesmyčka', 'anagram', 'doplňovačka'],
  calendar: ['datum', 'den v týdnu', 'svátky'],
  colors: ['rgb', 'cmy', 'barevný filtr', 'brýle'],
  elements: ['prvky', 'periodická tabulka', 'psp']
};

/** Launcher tiles that open an existing module with a preset (e.g. Binárka → Čísla 2 → znak). */
export interface ModuleShortcut {
  id: string;
  name: string;
  /** Key for <ModuleIcon>. */
  icon: string;
  group: ModuleGroupId;
  target: ModuleId;
  /** Where it leads, shown under the name (e.g. "v Číslech"). */
  via: string;
  keywords: string[];
  preset: ShortcutPreset;
}

/** Čísla: the source and target system (a base, Roman numerals, or letters). */
export interface NumbersPreset {
  source: number | 'roman';
  target: number | 'char';
}

/** Kříže: which cross opens. */
export interface CrossPreset {
  crossType: 'large-polish' | 'small-polish';
}

export type ShortcutPreset = NumbersPreset | CrossPreset;

export const MODULE_SHORTCUTS: ModuleShortcut[] = [
  {
    id: 'binary',
    name: 'Binárka',
    icon: 'binary',
    group: 'coding',
    target: 'numbers',
    via: 'v Číslech',
    keywords: ['dvojkovka', 'binární', 'bin', 'dvojková soustava'],
    preset: { source: 2, target: 'char' }
  },
  {
    id: 'ternary',
    name: 'Trojkovka',
    icon: 'ternary',
    group: 'coding',
    target: 'numbers',
    via: 'v Číslech',
    keywords: ['ternárka', 'ternární', 'tern', 'trojková soustava'],
    preset: { source: 3, target: 'char' }
  },
  {
    id: 'roman',
    name: 'Římská',
    icon: 'roman',
    group: 'coding',
    target: 'numbers',
    via: 'v Číslech',
    keywords: ['římská čísla', 'římské číslice', 'roman', 'latinská čísla'],
    preset: { source: 'roman', target: 10 }
  },
  {
    id: 'polak',
    name: 'Polák',
    icon: 'hash',
    group: 'coding',
    target: 'cross',
    via: 'v Křížích',
    keywords: ['polský kříž', 'velký kříž'],
    preset: { crossType: 'large-polish' }
  }
];
