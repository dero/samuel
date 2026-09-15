import { localSettingsService } from '../services/localSettingsService';

export interface AlphabetLayout {
  id: string;
  name: string;
  letters: string[];
  isBuiltin?: boolean;
}

const DEFAULT_CZECH_27 = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'CH', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

const DEFAULT_ENGLISH_26 = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

class AlphabetState {
  activeId = $state<string>('czech-27');
  layouts = $state<AlphabetLayout[]>([
    {
      id: 'czech-27',
      name: 'Česká (27 znaků s CH)',
      letters: DEFAULT_CZECH_27,
      isBuiltin: true
    },
    {
      id: 'english-26',
      name: 'Anglická / Mezinárodní (26)',
      letters: DEFAULT_ENGLISH_26,
      isBuiltin: true
    }
  ]);

  currentLayout = $derived(
    this.layouts.find((l) => l.id === this.activeId) ?? this.layouts[0]
  );

  currentLetters = $derived(this.currentLayout.letters);
  length = $derived(this.currentLetters.length);

  constructor() {
    if (typeof window !== 'undefined') {
      const alphaScope = localSettingsService.forSection('alphabet');
      const storedActive = alphaScope.getString('activeId');
      const storedLayouts = alphaScope.getJSON<AlphabetLayout[] | null>('layouts', null);

      if (storedActive) {
        this.activeId = storedActive;
      }
      if (Array.isArray(storedLayouts) && storedLayouts.length > 0) {
        this.layouts = storedLayouts;
      }

      $effect.root(() => {
        $effect(() => {
          alphaScope.setString('activeId', this.activeId);
          alphaScope.setJSON('layouts', this.layouts);
        });
      });
    }
  }

  setActiveLayout(id: string) {
    if (this.layouts.some((l) => l.id === id)) {
      this.activeId = id;
    }
  }

  addCustomLayout(name: string, letters: string[]): string {
    const id = 'custom-' + Date.now();
    this.layouts = [...this.layouts, { id, name, letters, isBuiltin: false }];
    this.activeId = id;
    return id;
  }

  deleteCustomLayout(id: string) {
    this.layouts = this.layouts.filter((l) => l.id !== id || l.isBuiltin);
    if (this.activeId === id) {
      this.activeId = 'czech-27';
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
