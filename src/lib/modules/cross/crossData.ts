export type CrossType = 'large-polish' | 'small-polish';

export interface CrossTypeConfig {
  id: CrossType;
  name: string;
  shortName: string;
  description: string;
  hasAlphabet?: boolean;
  capacity?: number;
  defaultAlphabetId?: string;
  standardAlphabetIds?: string[];
}

export const CROSS_TYPES: CrossTypeConfig[] = [
  {
    id: 'large-polish',
    name: 'Velký polský kříž',
    shortName: '3×3×3',
    description: 'Mřížka 3×3, 1–3 tečky',
    hasAlphabet: true,
    capacity: 27,
    defaultAlphabetId: 'english-ch-27',
    standardAlphabetIds: ['english-ch-27', 'english-26']
  },
  {
    id: 'small-polish',
    name: 'Pigpen',
    shortName: '9+9+4+4',
    description: 'Malý polský kříž',
    hasAlphabet: true,
    capacity: 26,
    defaultAlphabetId: 'english-26',
    standardAlphabetIds: ['english-26']
  }
];

export interface CrossAxis {
  label: string;
  options: { value: number; label: string; sub: string }[];
}

/** Coordinate keypad of the large cross, one axis per column. */
export const LARGE_CROSS_AXES: CrossAxis[] = [
  {
    label: 'Řádek',
    options: [
      { value: 1, label: '1', sub: 'Horní' },
      { value: 2, label: '2', sub: 'Střední' },
      { value: 3, label: '3', sub: 'Dolní' }
    ]
  },
  {
    label: 'Sloupec',
    options: [
      { value: 1, label: '1', sub: 'Levý' },
      { value: 2, label: '2', sub: 'Střední' },
      { value: 3, label: '3', sub: 'Pravý' }
    ]
  },
  {
    label: 'Pozice',
    options: [
      { value: 1, label: '1', sub: 'tečka' },
      { value: 2, label: '2', sub: 'tečky' },
      { value: 3, label: '3', sub: 'tečky' }
    ]
  }
];
