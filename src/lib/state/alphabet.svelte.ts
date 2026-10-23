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

const DEFAULT_ALPHANUMERIC_36 = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
];

export const BUILTIN_LAYOUTS: AlphabetLayout[] = [
  {
    id: 'english-26',
    name: 'Anglická (26)',
    letters: DEFAULT_ENGLISH_26,
    isBuiltin: true,
    description: 'A–Z bez CH'
  },
  {
    id: 'english-ch-27',
    name: 'Anglická + CH (27)',
    letters: DEFAULT_ENGLISH_CH_27,
    isBuiltin: true,
    description: 'A–Z a CH'
  },
  {
    id: 'alphanumeric-36',
    name: 'Alfanumerická (36)',
    letters: DEFAULT_ALPHANUMERIC_36,
    isBuiltin: true,
    description: 'A–Z a 0–9'
  },
  {
    id: 'czech-42',
    name: 'Česká (42)',
    letters: DEFAULT_CZECH_42,
    isBuiltin: true,
    description: 'S diakritikou a CH'
  }
];

class AlphabetState {
  layouts = $state<AlphabetLayout[]>([...BUILTIN_LAYOUTS]);

  constructor() {
    if (typeof window !== 'undefined') {
      const alphaScope = localSettingsService.forSection('alphabet');
      const storedLayouts = alphaScope.getJSON<AlphabetLayout[] | null>('layouts', null);

      // Built-ins always come from code; only custom layouts are persisted.
      const customLayouts = Array.isArray(storedLayouts)
        ? storedLayouts.filter((l) => !l.isBuiltin)
        : [];
      this.layouts = [...BUILTIN_LAYOUTS, ...customLayouts];

      // Tools pick their own alphabet; the former global "active" id is obsolete.
      alphaScope.removeItem('activeId');

      $effect.root(() => {
        $effect(() => {
          alphaScope.setJSON(
            'layouts',
            this.layouts.filter((l) => !l.isBuiltin)
          );
        });
      });
    }
  }

  getLayout(id: string): AlphabetLayout | undefined {
    return this.layouts.find((l) => l.id === id);
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

  /**
   * Deletes a custom layout and resets every tool that referenced it to its own
   * default alphabet. Returns ids of the modules that were reset.
   */
  deleteCustomLayout(id: string): string[] {
    const target = this.layouts.find((l) => l.id === id);
    if (!target || target.isBuiltin) return [];

    this.layouts = this.layouts.filter((l) => l.id !== id);
    return this.dropLayoutReferences(id);
  }

  /**
   * Tools persist the chosen layout id in their module settings (`alphabet_id`,
   * `alphabet:<variant>`, `polybius:omitted:<size>:<id>`). Removing those keys
   * makes the tool fall back to its default on next open. Safe to run while the
   * Settings module is active: no tool is mounted, so none can write the id back.
   */
  private dropLayoutReferences(id: string): string[] {
    const modules = localSettingsService.getRootData().modules ?? {};
    const affected: string[] = [];
    for (const [moduleId, store] of Object.entries(modules)) {
      const scope = localSettingsService.forModule(moduleId);
      let touched = false;
      for (const [key, value] of Object.entries(store)) {
        if ((value === id && key.startsWith('alphabet')) || key.endsWith(':' + id)) {
          scope.removeItem(key);
          touched = true;
        }
      }
      if (touched) affected.push(moduleId);
    }
    return affected;
  }
}

export const alphabet = new AlphabetState();
