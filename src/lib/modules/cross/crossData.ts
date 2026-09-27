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
  axis1Label: string;
  axis1Short: string;
  axis1Options: { value: number; label: string; sub?: string }[];
  axis2Label: string;
  axis2Short: string;
  axis2Options: { value: number; label: string; sub?: string }[];
  axis3Label?: string;
  axis3Short?: string;
  axis3Options?: { value: number; label: string; sub?: string }[];
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
    standardAlphabetIds: ['english-ch-27', 'english-26'],
    axis1Label: 'Řádek',
    axis1Short: 'Ř',
    axis1Options: [
      { value: 1, label: '1', sub: 'Horní' },
      { value: 2, label: '2', sub: 'Střední' },
      { value: 3, label: '3', sub: 'Dolní' }
    ],
    axis2Label: 'Sloupec',
    axis2Short: 'S',
    axis2Options: [
      { value: 1, label: '1', sub: 'Levý' },
      { value: 2, label: '2', sub: 'Střední' },
      { value: 3, label: '3', sub: 'Pravý' }
    ],
    axis3Label: 'Pozice',
    axis3Short: 'P',
    axis3Options: [
      { value: 1, label: '1', sub: '1 tečka' },
      { value: 2, label: '2', sub: '2 tečky' },
      { value: 3, label: '3', sub: '3 tečky' }
    ]
  },
  {
    id: 'small-polish',
    name: 'Pigpen',
    shortName: '9+9+4+4',
    description: 'Malý polský kříž',
    hasAlphabet: true,
    capacity: 26,
    defaultAlphabetId: 'english-26',
    standardAlphabetIds: ['english-26'],
    axis1Label: 'Geometrie',
    axis1Short: 'Geo',
    axis1Options: [
      { value: 1, label: '3×3', sub: 'Mřížka' },
      { value: 2, label: 'X', sub: 'Šikmý kříž' }
    ],
    axis2Label: 'Varianta',
    axis2Short: 'Var',
    axis2Options: [
      { value: 1, label: 'Bez', sub: 'Bez tečky' },
      { value: 2, label: '•', sub: 'S tečkou' }
    ]
  }
];
