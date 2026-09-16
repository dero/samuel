import { localSettingsService } from '../services/localSettingsService';

export interface AlphabetLayout {
  id: string;
  name: string;
  letters: string[];
  isBuiltin?: boolean;
  description?: string;
}

const DEFAULT_ENGLISH_26 = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

const DEFAULT_ENGLISH_CH_27 = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'CH', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

const DEFAULT_CZECH_42 = [
  'A', 'Á', 'B', 'C', 'Č', 'D', 'Ď', 'E', 'É', 'Ě', 'F', 'G', 'H', 'CH',
  'I', 'Í', 'J', 'K', 'L', 'M', 'N', 'Ň', 'O', 'Ó', 'P', 'Q', 'R', 'Ř',
  'S', 'Š', 'T', 'Ť', 'U', 'Ú', 'Ů', 'V', 'W', 'X', 'Y', 'Ý', 'Z', 'Ž'
];

export const BUILTIN_LAYOUTS: AlphabetLayout[] = [
  {
    id: 'english-26',
    name: 'Anglická (26)',
    letters: DEFAULT_ENGLISH_26,
    isBuiltin: true,
    description: 'Základní 26znakový standard A–Z (bez CH)'
  },
  {
    id: 'english-ch-27',
    name: 'Anglická + CH (27)',
    letters: DEFAULT_ENGLISH_CH_27,
    isBuiltin: true,
    description: 'Standard pro 3×3×3 mřížku: A–H, CH, I–Z (27 znaků)'
  },
  {
    id: 'czech-42',
    name: 'Česká (42)',
    letters: DEFAULT_CZECH_42,
    isBuiltin: true,
    description: 'Kompletní česká abeceda s diakritikou (42 znaků)'
  }
];

class AlphabetState {
  activeId = $state<string>('english-ch-27');
  layouts = $state<AlphabetLayout[]>([...BUILTIN_LAYOUTS]);

  currentLayout = $derived(
    this.layouts.find((l) => l.id === this.activeId) ?? this.layouts[0]
  );

  currentLetters = $derived(this.currentLayout.letters);
  length = $derived(this.currentLetters.length);

  constructor() {
    if (typeof window !== 'undefined') {
      const alphaScope = localSettingsService.forSection('alphabet');
      let storedActive = alphaScope.getString('activeId');
      const storedLayouts = alphaScope.getJSON<AlphabetLayout[] | null>('layouts', null);

      if (storedActive === 'czech-27') {
        storedActive = 'english-ch-27';
      }

      if (Array.isArray(storedLayouts) && storedLayouts.length > 0) {
        const customLayouts = storedLayouts.filter((l) => !l.isBuiltin);
        this.layouts = [...BUILTIN_LAYOUTS, ...customLayouts];
      } else {
        this.layouts = [...BUILTIN_LAYOUTS];
      }

      if (storedActive && this.layouts.some((l) => l.id === storedActive)) {
        this.activeId = storedActive;
      }

      $effect.root(() => {
        $effect(() => {
          alphaScope.setString('activeId', this.activeId);
          alphaScope.setJSON('layouts', this.layouts);
        });
      });
    }
  }

  getLayout(id: string): AlphabetLayout | undefined {
    return this.layouts.find((l) => l.id === id);
  }

  setActiveLayout(id: string) {
    if (this.layouts.some((l) => l.id === id)) {
      this.activeId = id;
    }
  }

  addCustomLayout(name: string, letters: string[], description?: string): string {
    const id = 'custom-' + Date.now();
    this.layouts = [
      ...this.layouts,
      {
        id,
        name,
        letters,
        isBuiltin: false,
        description: description || 'Uživatelská abeceda'
      }
    ];
    this.activeId = id;
    return id;
  }

  updateCustomLayout(id: string, letters: string[]) {
    const idx = this.layouts.findIndex((l) => l.id === id && !l.isBuiltin);
    if (idx !== -1) {
      const updated = [...this.layouts];
      updated[idx] = {
        ...updated[idx],
        letters: [...letters]
      };
      this.layouts = updated;
    }
  }

  deleteCustomLayout(id: string) {
    this.layouts = this.layouts.filter((l) => l.id !== id || l.isBuiltin);
    if (this.activeId === id) {
      this.activeId = 'english-ch-27';
    }
  }

  letterToIndex(char: string): number {
    return this.currentLetters.indexOf(char.toUpperCase());
  }

  indexToLetter(idx: number): string {
    if (this.length === 0) return '';
    const norm = ((idx % this.length) + this.length) % this.length;
    return this.currentLetters[norm] ?? '';
  }
}

export const alphabet = new AlphabetState();
