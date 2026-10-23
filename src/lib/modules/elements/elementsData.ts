export type StateOfMatter = 'solid' | 'liquid' | 'gas';

export type ElementCategory =
  | 'alkali-metal'
  | 'alkaline-earth'
  | 'transition-metal'
  | 'post-transition-metal'
  | 'metalloid'
  | 'reactive-nonmetal'
  | 'halogen'
  | 'noble-gas'
  | 'lanthanoid'
  | 'actinoid'
  | 'unknown';

export interface ChemicalElement {
  z: number;                    // 1 - 118
  symbol: string;               // e.g. "Fe"
  nameCs: string;               // e.g. "Železo"
  nameLa: string;               // e.g. "Ferrum"
  period: number;               // 1 - 7
  group: number;                // 1 - 18
  groupRoman?: string;          // e.g. "VIII.B"
  block: 's' | 'p' | 'd' | 'f';
  category: ElementCategory;
  atomicMass: string;           // e.g. "55.845"
  state: StateOfMatter;
  electronConfig: string;       // e.g. "[Ar] 3d⁶ 4s²"
  oxidationStates: string;      // e.g. "+II, +III"
  czechDiffersFromLatin: boolean;
  gridRow: number;              // 1 - 10
  gridCol: number;              // 1 - 18
}

export type TacticalFilter = 'none' | 'letters' | 'state' | 'spdf' | 'radioactive' | 'czech';

export function isElementRadioactive(element: ChemicalElement): boolean {
  return element.z === 43 || element.z === 61 || element.z >= 84;
}

export interface GroupMeta {
  group: number;
  roman: string;
}

export const GROUPS_META: GroupMeta[] = [
  { group: 1, roman: 'I.A' },
  { group: 2, roman: 'II.A' },
  { group: 3, roman: 'III.B' },
  { group: 4, roman: 'IV.B' },
  { group: 5, roman: 'V.B' },
  { group: 6, roman: 'VI.B' },
  { group: 7, roman: 'VII.B' },
  { group: 8, roman: 'VIII.B' },
  { group: 9, roman: 'VIII.B' },
  { group: 10, roman: 'VIII.B' },
  { group: 11, roman: 'I.B' },
  { group: 12, roman: 'II.B' },
  { group: 13, roman: 'III.A' },
  { group: 14, roman: 'IV.A' },
  { group: 15, roman: 'V.A' },
  { group: 16, roman: 'VI.A' },
  { group: 17, roman: 'VII.A' },
  { group: 18, roman: 'VIII.A' }
];

export const PERIODS_META = [1, 2, 3, 4, 5, 6, 7];

export const ELEMENTS: ChemicalElement[] = [
  // Period 1
  {
    z: 1, symbol: 'H', nameCs: 'Vodík', nameLa: 'Hydrogenium',
    period: 1, group: 1, groupRoman: 'I.A', block: 's', category: 'reactive-nonmetal',
    atomicMass: '1.008', state: 'gas', electronConfig: '1s¹', oxidationStates: '+I, -I',
    czechDiffersFromLatin: true, gridRow: 1, gridCol: 1
  },
  {
    z: 2, symbol: 'He', nameCs: 'Helium', nameLa: 'Helium',
    period: 1, group: 18, groupRoman: 'VIII.A', block: 's', category: 'noble-gas',
    atomicMass: '4.0026', state: 'gas', electronConfig: '1s²', oxidationStates: '0',
    czechDiffersFromLatin: false, gridRow: 1, gridCol: 18
  },

  // Period 2
  {
    z: 3, symbol: 'Li', nameCs: 'Lithium', nameLa: 'Lithium',
    period: 2, group: 1, groupRoman: 'I.A', block: 's', category: 'alkali-metal',
    atomicMass: '6.94', state: 'solid', electronConfig: '[He] 2s¹', oxidationStates: '+I',
    czechDiffersFromLatin: false, gridRow: 2, gridCol: 1
  },
  {
    z: 4, symbol: 'Be', nameCs: 'Beryllium', nameLa: 'Beryllium',
    period: 2, group: 2, groupRoman: 'II.A', block: 's', category: 'alkaline-earth',
    atomicMass: '9.0122', state: 'solid', electronConfig: '[He] 2s²', oxidationStates: '+II',
    czechDiffersFromLatin: false, gridRow: 2, gridCol: 2
  },
  {
    z: 5, symbol: 'B', nameCs: 'Bor', nameLa: 'Borum',
    period: 2, group: 13, groupRoman: 'III.A', block: 'p', category: 'metalloid',
    atomicMass: '10.81', state: 'solid', electronConfig: '[He] 2s² 2p¹', oxidationStates: '+III',
    czechDiffersFromLatin: false, gridRow: 2, gridCol: 13
  },
  {
    z: 6, symbol: 'C', nameCs: 'Uhlík', nameLa: 'Carboneum',
    period: 2, group: 14, groupRoman: 'IV.A', block: 'p', category: 'reactive-nonmetal',
    atomicMass: '12.011', state: 'solid', electronConfig: '[He] 2s² 2p²', oxidationStates: '-IV, +II, +IV',
    czechDiffersFromLatin: true, gridRow: 2, gridCol: 14
  },
  {
    z: 7, symbol: 'N', nameCs: 'Dusík', nameLa: 'Nitrogenium',
    period: 2, group: 15, groupRoman: 'V.A', block: 'p', category: 'reactive-nonmetal',
    atomicMass: '14.007', state: 'gas', electronConfig: '[He] 2s² 2p³', oxidationStates: '-III, +I..+V',
    czechDiffersFromLatin: true, gridRow: 2, gridCol: 15
  },
  {
    z: 8, symbol: 'O', nameCs: 'Kyslík', nameLa: 'Oxygenium',
    period: 2, group: 16, groupRoman: 'VI.A', block: 'p', category: 'reactive-nonmetal',
    atomicMass: '15.999', state: 'gas', electronConfig: '[He] 2s² 2p⁴', oxidationStates: '-II, -I',
    czechDiffersFromLatin: true, gridRow: 2, gridCol: 16
  },
  {
    z: 9, symbol: 'F', nameCs: 'Fluor', nameLa: 'Fluorum',
    period: 2, group: 17, groupRoman: 'VII.A', block: 'p', category: 'halogen',
    atomicMass: '18.998', state: 'gas', electronConfig: '[He] 2s² 2p⁵', oxidationStates: '-I',
    czechDiffersFromLatin: false, gridRow: 2, gridCol: 17
  },
  {
    z: 10, symbol: 'Ne', nameCs: 'Neon', nameLa: 'Neon',
    period: 2, group: 18, groupRoman: 'VIII.A', block: 'p', category: 'noble-gas',
    atomicMass: '20.180', state: 'gas', electronConfig: '[He] 2s² 2p⁶', oxidationStates: '0',
    czechDiffersFromLatin: false, gridRow: 2, gridCol: 18
  },

  // Period 3
  {
    z: 11, symbol: 'Na', nameCs: 'Sodík', nameLa: 'Natrium',
    period: 3, group: 1, groupRoman: 'I.A', block: 's', category: 'alkali-metal',
    atomicMass: '22.990', state: 'solid', electronConfig: '[Ne] 3s¹', oxidationStates: '+I',
    czechDiffersFromLatin: true, gridRow: 3, gridCol: 1
  },
  {
    z: 12, symbol: 'Mg', nameCs: 'Hořčík', nameLa: 'Magnesium',
    period: 3, group: 2, groupRoman: 'II.A', block: 's', category: 'alkaline-earth',
    atomicMass: '24.305', state: 'solid', electronConfig: '[Ne] 3s²', oxidationStates: '+II',
    czechDiffersFromLatin: true, gridRow: 3, gridCol: 2
  },
  {
    z: 13, symbol: 'Al', nameCs: 'Hliník', nameLa: 'Aluminium',
    period: 3, group: 13, groupRoman: 'III.A', block: 'p', category: 'post-transition-metal',
    atomicMass: '26.982', state: 'solid', electronConfig: '[Ne] 3s² 3p¹', oxidationStates: '+III',
    czechDiffersFromLatin: true, gridRow: 3, gridCol: 13
  },
  {
    z: 14, symbol: 'Si', nameCs: 'Křemík', nameLa: 'Silicium',
    period: 3, group: 14, groupRoman: 'IV.A', block: 'p', category: 'metalloid',
    atomicMass: '28.085', state: 'solid', electronConfig: '[Ne] 3s² 3p²', oxidationStates: '-IV, +II, +IV',
    czechDiffersFromLatin: true, gridRow: 3, gridCol: 14
  },
  {
    z: 15, symbol: 'P', nameCs: 'Fosfor', nameLa: 'Phosphorus',
    period: 3, group: 15, groupRoman: 'V.A', block: 'p', category: 'reactive-nonmetal',
    atomicMass: '30.974', state: 'solid', electronConfig: '[Ne] 3s² 3p³', oxidationStates: '-III, +III, +V',
    czechDiffersFromLatin: false, gridRow: 3, gridCol: 15
  },
  {
    z: 16, symbol: 'S', nameCs: 'Síra', nameLa: 'Sulfur',
    period: 3, group: 16, groupRoman: 'VI.A', block: 'p', category: 'reactive-nonmetal',
    atomicMass: '32.06', state: 'solid', electronConfig: '[Ne] 3s² 3p⁴', oxidationStates: '-II, +IV, +VI',
    czechDiffersFromLatin: true, gridRow: 3, gridCol: 16
  },
  {
    z: 17, symbol: 'Cl', nameCs: 'Chlor', nameLa: 'Chlorum',
    period: 3, group: 17, groupRoman: 'VII.A', block: 'p', category: 'halogen',
    atomicMass: '35.45', state: 'gas', electronConfig: '[Ne] 3s² 3p⁵', oxidationStates: '-I, +I..+VII',
    czechDiffersFromLatin: false, gridRow: 3, gridCol: 17
  },
  {
    z: 18, symbol: 'Ar', nameCs: 'Argon', nameLa: 'Argon',
    period: 3, group: 18, groupRoman: 'VIII.A', block: 'p', category: 'noble-gas',
    atomicMass: '39.95', state: 'gas', electronConfig: '[Ne] 3s² 3p⁶', oxidationStates: '0',
    czechDiffersFromLatin: false, gridRow: 3, gridCol: 18
  },

  // Period 4
  {
    z: 19, symbol: 'K', nameCs: 'Draslík', nameLa: 'Kalium',
    period: 4, group: 1, groupRoman: 'I.A', block: 's', category: 'alkali-metal',
    atomicMass: '39.098', state: 'solid', electronConfig: '[Ar] 4s¹', oxidationStates: '+I',
    czechDiffersFromLatin: true, gridRow: 4, gridCol: 1
  },
  {
    z: 20, symbol: 'Ca', nameCs: 'Vápník', nameLa: 'Calcium',
    period: 4, group: 2, groupRoman: 'II.A', block: 's', category: 'alkaline-earth',
    atomicMass: '40.078', state: 'solid', electronConfig: '[Ar] 4s²', oxidationStates: '+II',
    czechDiffersFromLatin: true, gridRow: 4, gridCol: 2
  },
  {
    z: 21, symbol: 'Sc', nameCs: 'Skandium', nameLa: 'Scandium',
    period: 4, group: 3, groupRoman: 'III.B', block: 'd', category: 'transition-metal',
    atomicMass: '44.956', state: 'solid', electronConfig: '[Ar] 3d¹ 4s²', oxidationStates: '+III',
    czechDiffersFromLatin: false, gridRow: 4, gridCol: 3
  },
  {
    z: 22, symbol: 'Ti', nameCs: 'Titan', nameLa: 'Titanium',
    period: 4, group: 4, groupRoman: 'IV.B', block: 'd', category: 'transition-metal',
    atomicMass: '47.867', state: 'solid', electronConfig: '[Ar] 3d² 4s²', oxidationStates: '+II, +III, +IV',
    czechDiffersFromLatin: false, gridRow: 4, gridCol: 4
  },
  {
    z: 23, symbol: 'V', nameCs: 'Vanad', nameLa: 'Vanadium',
    period: 4, group: 5, groupRoman: 'V.B', block: 'd', category: 'transition-metal',
    atomicMass: '50.942', state: 'solid', electronConfig: '[Ar] 3d³ 4s²', oxidationStates: '+II..+V',
    czechDiffersFromLatin: false, gridRow: 4, gridCol: 5
  },
  {
    z: 24, symbol: 'Cr', nameCs: 'Chrom', nameLa: 'Chromium',
    period: 4, group: 6, groupRoman: 'VI.B', block: 'd', category: 'transition-metal',
    atomicMass: '51.996', state: 'solid', electronConfig: '[Ar] 3d⁵ 4s¹', oxidationStates: '+II, +III, +VI',
    czechDiffersFromLatin: false, gridRow: 4, gridCol: 6
  },
  {
    z: 25, symbol: 'Mn', nameCs: 'Mangan', nameLa: 'Manganum',
    period: 4, group: 7, groupRoman: 'VII.B', block: 'd', category: 'transition-metal',
    atomicMass: '54.938', state: 'solid', electronConfig: '[Ar] 3d⁵ 4s²', oxidationStates: '+II..+VII',
    czechDiffersFromLatin: false, gridRow: 4, gridCol: 7
  },
  {
    z: 26, symbol: 'Fe', nameCs: 'Železo', nameLa: 'Ferrum',
    period: 4, group: 8, groupRoman: 'VIII.B', block: 'd', category: 'transition-metal',
    atomicMass: '55.845', state: 'solid', electronConfig: '[Ar] 3d⁶ 4s²', oxidationStates: '+II, +III',
    czechDiffersFromLatin: true, gridRow: 4, gridCol: 8
  },
  {
    z: 27, symbol: 'Co', nameCs: 'Kobalt', nameLa: 'Cobaltum',
    period: 4, group: 9, groupRoman: 'VIII.B', block: 'd', category: 'transition-metal',
    atomicMass: '58.933', state: 'solid', electronConfig: '[Ar] 3d⁷ 4s²', oxidationStates: '+II, +III',
    czechDiffersFromLatin: false, gridRow: 4, gridCol: 9
  },
  {
    z: 28, symbol: 'Ni', nameCs: 'Nikl', nameLa: 'Niccolum',
    period: 4, group: 10, groupRoman: 'VIII.B', block: 'd', category: 'transition-metal',
    atomicMass: '58.693', state: 'solid', electronConfig: '[Ar] 3d⁸ 4s²', oxidationStates: '+II, +III',
    czechDiffersFromLatin: false, gridRow: 4, gridCol: 10
  },
  {
    z: 29, symbol: 'Cu', nameCs: 'Měď', nameLa: 'Cuprum',
    period: 4, group: 11, groupRoman: 'I.B', block: 'd', category: 'transition-metal',
    atomicMass: '63.546', state: 'solid', electronConfig: '[Ar] 3d¹⁰ 4s¹', oxidationStates: '+I, +II',
    czechDiffersFromLatin: true, gridRow: 4, gridCol: 11
  },
  {
    z: 30, symbol: 'Zn', nameCs: 'Zinek', nameLa: 'Zincum',
    period: 4, group: 12, groupRoman: 'II.B', block: 'd', category: 'transition-metal',
    atomicMass: '65.38', state: 'solid', electronConfig: '[Ar] 3d¹⁰ 4s²', oxidationStates: '+II',
    czechDiffersFromLatin: false, gridRow: 4, gridCol: 12
  },
  {
    z: 31, symbol: 'Ga', nameCs: 'Gallium', nameLa: 'Gallium',
    period: 4, group: 13, groupRoman: 'III.A', block: 'p', category: 'post-transition-metal',
    atomicMass: '69.723', state: 'solid', electronConfig: '[Ar] 3d¹⁰ 4s² 4p¹', oxidationStates: '+III',
    czechDiffersFromLatin: false, gridRow: 4, gridCol: 13
  },
  {
    z: 32, symbol: 'Ge', nameCs: 'Germanium', nameLa: 'Germanium',
    period: 4, group: 14, groupRoman: 'IV.A', block: 'p', category: 'metalloid',
    atomicMass: '72.630', state: 'solid', electronConfig: '[Ar] 3d¹⁰ 4s² 4p²', oxidationStates: '+II, +IV',
    czechDiffersFromLatin: false, gridRow: 4, gridCol: 14
  },
  {
    z: 33, symbol: 'As', nameCs: 'Arsen', nameLa: 'Arsenicum',
    period: 4, group: 15, groupRoman: 'V.A', block: 'p', category: 'metalloid',
    atomicMass: '74.922', state: 'solid', electronConfig: '[Ar] 3d¹⁰ 4s² 4p³', oxidationStates: '-III, +III, +V',
    czechDiffersFromLatin: false, gridRow: 4, gridCol: 15
  },
  {
    z: 34, symbol: 'Se', nameCs: 'Selen', nameLa: 'Selenium',
    period: 4, group: 16, groupRoman: 'VI.A', block: 'p', category: 'reactive-nonmetal',
    atomicMass: '78.971', state: 'solid', electronConfig: '[Ar] 3d¹⁰ 4s² 4p⁴', oxidationStates: '-II, +IV, +VI',
    czechDiffersFromLatin: false, gridRow: 4, gridCol: 16
  },
  {
    z: 35, symbol: 'Br', nameCs: 'Brom', nameLa: 'Bromum',
    period: 4, group: 17, groupRoman: 'VII.A', block: 'p', category: 'halogen',
    atomicMass: '79.904', state: 'liquid', electronConfig: '[Ar] 3d¹⁰ 4s² 4p⁵', oxidationStates: '-I, +I..+VII',
    czechDiffersFromLatin: false, gridRow: 4, gridCol: 17
  },
  {
    z: 36, symbol: 'Kr', nameCs: 'Krypton', nameLa: 'Krypton',
    period: 4, group: 18, groupRoman: 'VIII.A', block: 'p', category: 'noble-gas',
    atomicMass: '83.798', state: 'gas', electronConfig: '[Ar] 3d¹⁰ 4s² 4p⁶', oxidationStates: '0, +II',
    czechDiffersFromLatin: false, gridRow: 4, gridCol: 18
  },

  // Period 5
  {
    z: 37, symbol: 'Rb', nameCs: 'Rubidium', nameLa: 'Rubidium',
    period: 5, group: 1, groupRoman: 'I.A', block: 's', category: 'alkali-metal',
    atomicMass: '85.468', state: 'solid', electronConfig: '[Kr] 5s¹', oxidationStates: '+I',
    czechDiffersFromLatin: false, gridRow: 5, gridCol: 1
  },
  {
    z: 38, symbol: 'Sr', nameCs: 'Stroncium', nameLa: 'Strontium',
    period: 5, group: 2, groupRoman: 'II.A', block: 's', category: 'alkaline-earth',
    atomicMass: '87.62', state: 'solid', electronConfig: '[Kr] 5s²', oxidationStates: '+II',
    czechDiffersFromLatin: false, gridRow: 5, gridCol: 2
  },
  {
    z: 39, symbol: 'Y', nameCs: 'Yttrium', nameLa: 'Yttrium',
    period: 5, group: 3, groupRoman: 'III.B', block: 'd', category: 'transition-metal',
    atomicMass: '88.906', state: 'solid', electronConfig: '[Kr] 4d¹ 5s²', oxidationStates: '+III',
    czechDiffersFromLatin: false, gridRow: 5, gridCol: 3
  },
  {
    z: 40, symbol: 'Zr', nameCs: 'Zirkonium', nameLa: 'Zirconium',
    period: 5, group: 4, groupRoman: 'IV.B', block: 'd', category: 'transition-metal',
    atomicMass: '91.224', state: 'solid', electronConfig: '[Kr] 4d² 5s²', oxidationStates: '+IV',
    czechDiffersFromLatin: false, gridRow: 5, gridCol: 4
  },
  {
    z: 41, symbol: 'Nb', nameCs: 'Niob', nameLa: 'Niobium',
    period: 5, group: 5, groupRoman: 'V.B', block: 'd', category: 'transition-metal',
    atomicMass: '92.906', state: 'solid', electronConfig: '[Kr] 4d⁴ 5s¹', oxidationStates: '+III, +V',
    czechDiffersFromLatin: false, gridRow: 5, gridCol: 5
  },
  {
    z: 42, symbol: 'Mo', nameCs: 'Molybden', nameLa: 'Molybdenum',
    period: 5, group: 6, groupRoman: 'VI.B', block: 'd', category: 'transition-metal',
    atomicMass: '95.95', state: 'solid', electronConfig: '[Kr] 4d⁵ 5s¹', oxidationStates: '+II..+VI',
    czechDiffersFromLatin: false, gridRow: 5, gridCol: 6
  },
  {
    z: 43, symbol: 'Tc', nameCs: 'Technecium', nameLa: 'Technetium',
    period: 5, group: 7, groupRoman: 'VII.B', block: 'd', category: 'transition-metal',
    atomicMass: '[97]', state: 'solid', electronConfig: '[Kr] 4d⁵ 5s²', oxidationStates: '+IV, +VII',
    czechDiffersFromLatin: false, gridRow: 5, gridCol: 7
  },
  {
    z: 44, symbol: 'Ru', nameCs: 'Ruthenium', nameLa: 'Ruthenium',
    period: 5, group: 8, groupRoman: 'VIII.B', block: 'd', category: 'transition-metal',
    atomicMass: '101.07', state: 'solid', electronConfig: '[Kr] 4d⁷ 5s¹', oxidationStates: '+II..+VIII',
    czechDiffersFromLatin: false, gridRow: 5, gridCol: 8
  },
  {
    z: 45, symbol: 'Rh', nameCs: 'Rhodium', nameLa: 'Rhodium',
    period: 5, group: 9, groupRoman: 'VIII.B', block: 'd', category: 'transition-metal',
    atomicMass: '102.91', state: 'solid', electronConfig: '[Kr] 4d⁸ 5s¹', oxidationStates: '+II, +III, +IV',
    czechDiffersFromLatin: false, gridRow: 5, gridCol: 9
  },
  {
    z: 46, symbol: 'Pd', nameCs: 'Palladium', nameLa: 'Palladium',
    period: 5, group: 10, groupRoman: 'VIII.B', block: 'd', category: 'transition-metal',
    atomicMass: '106.42', state: 'solid', electronConfig: '[Kr] 4d¹⁰', oxidationStates: '+II, +IV',
    czechDiffersFromLatin: false, gridRow: 5, gridCol: 10
  },
  {
    z: 47, symbol: 'Ag', nameCs: 'Stříbro', nameLa: 'Argentum',
    period: 5, group: 11, groupRoman: 'I.B', block: 'd', category: 'transition-metal',
    atomicMass: '107.87', state: 'solid', electronConfig: '[Kr] 4d¹⁰ 5s¹', oxidationStates: '+I, +II',
    czechDiffersFromLatin: true, gridRow: 5, gridCol: 11
  },
  {
    z: 48, symbol: 'Cd', nameCs: 'Kadmium', nameLa: 'Cadmium',
    period: 5, group: 12, groupRoman: 'II.B', block: 'd', category: 'transition-metal',
    atomicMass: '112.41', state: 'solid', electronConfig: '[Kr] 4d¹⁰ 5s²', oxidationStates: '+II',
    czechDiffersFromLatin: false, gridRow: 5, gridCol: 12
  },
  {
    z: 49, symbol: 'In', nameCs: 'Indium', nameLa: 'Indium',
    period: 5, group: 13, groupRoman: 'III.A', block: 'p', category: 'post-transition-metal',
    atomicMass: '114.82', state: 'solid', electronConfig: '[Kr] 4d¹⁰ 5s² 5p¹', oxidationStates: '+I, +III',
    czechDiffersFromLatin: false, gridRow: 5, gridCol: 13
  },
  {
    z: 50, symbol: 'Sn', nameCs: 'Cín', nameLa: 'Stannum',
    period: 5, group: 14, groupRoman: 'IV.A', block: 'p', category: 'post-transition-metal',
    atomicMass: '118.71', state: 'solid', electronConfig: '[Kr] 4d¹⁰ 5s² 5p²', oxidationStates: '+II, +IV',
    czechDiffersFromLatin: true, gridRow: 5, gridCol: 14
  },
  {
    z: 51, symbol: 'Sb', nameCs: 'Antimon', nameLa: 'Stibium',
    period: 5, group: 15, groupRoman: 'V.A', block: 'p', category: 'metalloid',
    atomicMass: '121.76', state: 'solid', electronConfig: '[Kr] 4d¹⁰ 5s² 5p³', oxidationStates: '-III, +III, +V',
    czechDiffersFromLatin: true, gridRow: 5, gridCol: 15
  },
  {
    z: 52, symbol: 'Te', nameCs: 'Tellur', nameLa: 'Tellurium',
    period: 5, group: 16, groupRoman: 'VI.A', block: 'p', category: 'metalloid',
    atomicMass: '127.60', state: 'solid', electronConfig: '[Kr] 4d¹⁰ 5s² 5p⁴', oxidationStates: '-II, +IV, +VI',
    czechDiffersFromLatin: false, gridRow: 5, gridCol: 16
  },
  {
    z: 53, symbol: 'I', nameCs: 'Jod', nameLa: 'Iodum',
    period: 5, group: 17, groupRoman: 'VII.A', block: 'p', category: 'halogen',
    atomicMass: '126.90', state: 'solid', electronConfig: '[Kr] 4d¹⁰ 5s² 5p⁵', oxidationStates: '-I, +I..+VII',
    czechDiffersFromLatin: false, gridRow: 5, gridCol: 17
  },
  {
    z: 54, symbol: 'Xe', nameCs: 'Xenon', nameLa: 'Xenon',
    period: 5, group: 18, groupRoman: 'VIII.A', block: 'p', category: 'noble-gas',
    atomicMass: '131.29', state: 'gas', electronConfig: '[Kr] 4d¹⁰ 5s² 5p⁶', oxidationStates: '0, +II..+VIII',
    czechDiffersFromLatin: false, gridRow: 5, gridCol: 18
  },

  // Period 6
  {
    z: 55, symbol: 'Cs', nameCs: 'Cesium', nameLa: 'Caesium',
    period: 6, group: 1, groupRoman: 'I.A', block: 's', category: 'alkali-metal',
    atomicMass: '132.91', state: 'solid', electronConfig: '[Xe] 6s¹', oxidationStates: '+I',
    czechDiffersFromLatin: false, gridRow: 6, gridCol: 1
  },
  {
    z: 56, symbol: 'Ba', nameCs: 'Baryum', nameLa: 'Barium',
    period: 6, group: 2, groupRoman: 'II.A', block: 's', category: 'alkaline-earth',
    atomicMass: '137.33', state: 'solid', electronConfig: '[Xe] 6s²', oxidationStates: '+II',
    czechDiffersFromLatin: false, gridRow: 6, gridCol: 2
  },

  // Lanthanoids (placed in row 9, cols 4..18)
  {
    z: 57, symbol: 'La', nameCs: 'Lanthan', nameLa: 'Lanthanum',
    period: 6, group: 3, groupRoman: 'III.B', block: 'd', category: 'lanthanoid',
    atomicMass: '138.91', state: 'solid', electronConfig: '[Xe] 5d¹ 6s²', oxidationStates: '+III',
    czechDiffersFromLatin: false, gridRow: 9, gridCol: 4
  },
  {
    z: 58, symbol: 'Ce', nameCs: 'Cer', nameLa: 'Cerium',
    period: 6, group: 3, groupRoman: 'III.B', block: 'f', category: 'lanthanoid',
    atomicMass: '140.12', state: 'solid', electronConfig: '[Xe] 4f¹ 5d¹ 6s²', oxidationStates: '+III, +IV',
    czechDiffersFromLatin: false, gridRow: 9, gridCol: 5
  },
  {
    z: 59, symbol: 'Pr', nameCs: 'Praseodym', nameLa: 'Praseodymium',
    period: 6, group: 3, groupRoman: 'III.B', block: 'f', category: 'lanthanoid',
    atomicMass: '140.91', state: 'solid', electronConfig: '[Xe] 4f³ 6s²', oxidationStates: '+III, +IV',
    czechDiffersFromLatin: false, gridRow: 9, gridCol: 6
  },
  {
    z: 60, symbol: 'Nd', nameCs: 'Neodym', nameLa: 'Neodymium',
    period: 6, group: 3, groupRoman: 'III.B', block: 'f', category: 'lanthanoid',
    atomicMass: '144.24', state: 'solid', electronConfig: '[Xe] 4f⁴ 6s²', oxidationStates: '+III',
    czechDiffersFromLatin: false, gridRow: 9, gridCol: 7
  },
  {
    z: 61, symbol: 'Pm', nameCs: 'Promethium', nameLa: 'Promethium',
    period: 6, group: 3, groupRoman: 'III.B', block: 'f', category: 'lanthanoid',
    atomicMass: '[145]', state: 'solid', electronConfig: '[Xe] 4f⁵ 6s²', oxidationStates: '+III',
    czechDiffersFromLatin: false, gridRow: 9, gridCol: 8
  },
  {
    z: 62, symbol: 'Sm', nameCs: 'Samarium', nameLa: 'Samarium',
    period: 6, group: 3, groupRoman: 'III.B', block: 'f', category: 'lanthanoid',
    atomicMass: '150.36', state: 'solid', electronConfig: '[Xe] 4f⁶ 6s²', oxidationStates: '+II, +III',
    czechDiffersFromLatin: false, gridRow: 9, gridCol: 9
  },
  {
    z: 63, symbol: 'Eu', nameCs: 'Europium', nameLa: 'Europium',
    period: 6, group: 3, groupRoman: 'III.B', block: 'f', category: 'lanthanoid',
    atomicMass: '151.96', state: 'solid', electronConfig: '[Xe] 4f⁷ 6s²', oxidationStates: '+II, +III',
    czechDiffersFromLatin: false, gridRow: 9, gridCol: 10
  },
  {
    z: 64, symbol: 'Gd', nameCs: 'Gadolinium', nameLa: 'Gadolinium',
    period: 6, group: 3, groupRoman: 'III.B', block: 'f', category: 'lanthanoid',
    atomicMass: '157.25', state: 'solid', electronConfig: '[Xe] 4f⁷ 5d¹ 6s²', oxidationStates: '+III',
    czechDiffersFromLatin: false, gridRow: 9, gridCol: 11
  },
  {
    z: 65, symbol: 'Tb', nameCs: 'Terbium', nameLa: 'Terbium',
    period: 6, group: 3, groupRoman: 'III.B', block: 'f', category: 'lanthanoid',
    atomicMass: '158.93', state: 'solid', electronConfig: '[Xe] 4f⁹ 6s²', oxidationStates: '+III, +IV',
    czechDiffersFromLatin: false, gridRow: 9, gridCol: 12
  },
  {
    z: 66, symbol: 'Dy', nameCs: 'Dysprosium', nameLa: 'Dysprosium',
    period: 6, group: 3, groupRoman: 'III.B', block: 'f', category: 'lanthanoid',
    atomicMass: '162.50', state: 'solid', electronConfig: '[Xe] 4f¹⁰ 6s²', oxidationStates: '+III',
    czechDiffersFromLatin: false, gridRow: 9, gridCol: 13
  },
  {
    z: 67, symbol: 'Ho', nameCs: 'Holmium', nameLa: 'Holmium',
    period: 6, group: 3, groupRoman: 'III.B', block: 'f', category: 'lanthanoid',
    atomicMass: '164.93', state: 'solid', electronConfig: '[Xe] 4f¹¹ 6s²', oxidationStates: '+III',
    czechDiffersFromLatin: false, gridRow: 9, gridCol: 14
  },
  {
    z: 68, symbol: 'Er', nameCs: 'Erbium', nameLa: 'Erbium',
    period: 6, group: 3, groupRoman: 'III.B', block: 'f', category: 'lanthanoid',
    atomicMass: '167.26', state: 'solid', electronConfig: '[Xe] 4f¹² 6s²', oxidationStates: '+III',
    czechDiffersFromLatin: false, gridRow: 9, gridCol: 15
  },
  {
    z: 69, symbol: 'Tm', nameCs: 'Thulium', nameLa: 'Thulium',
    period: 6, group: 3, groupRoman: 'III.B', block: 'f', category: 'lanthanoid',
    atomicMass: '168.93', state: 'solid', electronConfig: '[Xe] 4f¹³ 6s²', oxidationStates: '+II, +III',
    czechDiffersFromLatin: false, gridRow: 9, gridCol: 16
  },
  {
    z: 70, symbol: 'Yb', nameCs: 'Ytterbium', nameLa: 'Ytterbium',
    period: 6, group: 3, groupRoman: 'III.B', block: 'f', category: 'lanthanoid',
    atomicMass: '173.05', state: 'solid', electronConfig: '[Xe] 4f¹⁴ 6s²', oxidationStates: '+II, +III',
    czechDiffersFromLatin: false, gridRow: 9, gridCol: 17
  },
  {
    z: 71, symbol: 'Lu', nameCs: 'Lutecium', nameLa: 'Lutetium',
    period: 6, group: 3, groupRoman: 'III.B', block: 'd', category: 'lanthanoid',
    atomicMass: '174.97', state: 'solid', electronConfig: '[Xe] 4f¹⁴ 5d¹ 6s²', oxidationStates: '+III',
    czechDiffersFromLatin: false, gridRow: 9, gridCol: 18
  },

  // Period 6 continued (cols 4..18)
  {
    z: 72, symbol: 'Hf', nameCs: 'Hafnium', nameLa: 'Hafnium',
    period: 6, group: 4, groupRoman: 'IV.B', block: 'd', category: 'transition-metal',
    atomicMass: '178.49', state: 'solid', electronConfig: '[Xe] 4f¹⁴ 5d² 6s²', oxidationStates: '+IV',
    czechDiffersFromLatin: false, gridRow: 6, gridCol: 4
  },
  {
    z: 73, symbol: 'Ta', nameCs: 'Tantal', nameLa: 'Tantalum',
    period: 6, group: 5, groupRoman: 'V.B', block: 'd', category: 'transition-metal',
    atomicMass: '180.95', state: 'solid', electronConfig: '[Xe] 4f¹⁴ 5d³ 6s²', oxidationStates: '+V',
    czechDiffersFromLatin: false, gridRow: 6, gridCol: 5
  },
  {
    z: 74, symbol: 'W', nameCs: 'Wolfram', nameLa: 'Wolframium',
    period: 6, group: 6, groupRoman: 'VI.B', block: 'd', category: 'transition-metal',
    atomicMass: '183.84', state: 'solid', electronConfig: '[Xe] 4f¹⁴ 5d⁴ 6s²', oxidationStates: '+II..+VI',
    czechDiffersFromLatin: false, gridRow: 6, gridCol: 6
  },
  {
    z: 75, symbol: 'Re', nameCs: 'Rhenium', nameLa: 'Rhenium',
    period: 6, group: 7, groupRoman: 'VII.B', block: 'd', category: 'transition-metal',
    atomicMass: '186.21', state: 'solid', electronConfig: '[Xe] 4f¹⁴ 5d⁵ 6s²', oxidationStates: '-I, +I..+VII',
    czechDiffersFromLatin: false, gridRow: 6, gridCol: 7
  },
  {
    z: 76, symbol: 'Os', nameCs: 'Osmium', nameLa: 'Osmium',
    period: 6, group: 8, groupRoman: 'VIII.B', block: 'd', category: 'transition-metal',
    atomicMass: '190.23', state: 'solid', electronConfig: '[Xe] 4f¹⁴ 5d⁶ 6s²', oxidationStates: '+II..+VIII',
    czechDiffersFromLatin: false, gridRow: 6, gridCol: 8
  },
  {
    z: 77, symbol: 'Ir', nameCs: 'Iridium', nameLa: 'Iridium',
    period: 6, group: 9, groupRoman: 'VIII.B', block: 'd', category: 'transition-metal',
    atomicMass: '192.22', state: 'solid', electronConfig: '[Xe] 4f¹⁴ 5d⁷ 6s²', oxidationStates: '+I..+VI',
    czechDiffersFromLatin: false, gridRow: 6, gridCol: 9
  },
  {
    z: 78, symbol: 'Pt', nameCs: 'Platina', nameLa: 'Platinum',
    period: 6, group: 10, groupRoman: 'VIII.B', block: 'd', category: 'transition-metal',
    atomicMass: '195.08', state: 'solid', electronConfig: '[Xe] 4f¹⁴ 5d⁹ 6s¹', oxidationStates: '+II, +IV',
    czechDiffersFromLatin: false, gridRow: 6, gridCol: 10
  },
  {
    z: 79, symbol: 'Au', nameCs: 'Zlato', nameLa: 'Aurum',
    period: 6, group: 11, groupRoman: 'I.B', block: 'd', category: 'transition-metal',
    atomicMass: '196.97', state: 'solid', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', oxidationStates: '+I, +III',
    czechDiffersFromLatin: true, gridRow: 6, gridCol: 11
  },
  {
    z: 80, symbol: 'Hg', nameCs: 'Rtuť', nameLa: 'Hydrargyrum',
    period: 6, group: 12, groupRoman: 'II.B', block: 'd', category: 'transition-metal',
    atomicMass: '200.59', state: 'liquid', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s²', oxidationStates: '+I, +II',
    czechDiffersFromLatin: true, gridRow: 6, gridCol: 12
  },
  {
    z: 81, symbol: 'Tl', nameCs: 'Thallium', nameLa: 'Thallium',
    period: 6, group: 13, groupRoman: 'III.A', block: 'p', category: 'post-transition-metal',
    atomicMass: '204.38', state: 'solid', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹', oxidationStates: '+I, +III',
    czechDiffersFromLatin: false, gridRow: 6, gridCol: 13
  },
  {
    z: 82, symbol: 'Pb', nameCs: 'Olovo', nameLa: 'Plumbum',
    period: 6, group: 14, groupRoman: 'IV.A', block: 'p', category: 'post-transition-metal',
    atomicMass: '207.2', state: 'solid', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²', oxidationStates: '+II, +IV',
    czechDiffersFromLatin: true, gridRow: 6, gridCol: 14
  },
  {
    z: 83, symbol: 'Bi', nameCs: 'Bismut', nameLa: 'Bismuthum',
    period: 6, group: 15, groupRoman: 'V.A', block: 'p', category: 'post-transition-metal',
    atomicMass: '208.98', state: 'solid', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³', oxidationStates: '+III, +V',
    czechDiffersFromLatin: false, gridRow: 6, gridCol: 15
  },
  {
    z: 84, symbol: 'Po', nameCs: 'Polonium', nameLa: 'Polonium',
    period: 6, group: 16, groupRoman: 'VI.A', block: 'p', category: 'post-transition-metal',
    atomicMass: '[209]', state: 'solid', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴', oxidationStates: '+II, +IV',
    czechDiffersFromLatin: false, gridRow: 6, gridCol: 16
  },
  {
    z: 85, symbol: 'At', nameCs: 'Astat', nameLa: 'Astatium',
    period: 6, group: 17, groupRoman: 'VII.A', block: 'p', category: 'halogen',
    atomicMass: '[210]', state: 'solid', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵', oxidationStates: '-I, +I..+VII',
    czechDiffersFromLatin: false, gridRow: 6, gridCol: 17
  },
  {
    z: 86, symbol: 'Rn', nameCs: 'Radon', nameLa: 'Radon',
    period: 6, group: 18, groupRoman: 'VIII.A', block: 'p', category: 'noble-gas',
    atomicMass: '[222]', state: 'gas', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶', oxidationStates: '0, +II',
    czechDiffersFromLatin: false, gridRow: 6, gridCol: 18
  },

  // Period 7
  {
    z: 87, symbol: 'Fr', nameCs: 'Francium', nameLa: 'Francium',
    period: 7, group: 1, groupRoman: 'I.A', block: 's', category: 'alkali-metal',
    atomicMass: '[223]', state: 'solid', electronConfig: '[Rn] 7s¹', oxidationStates: '+I',
    czechDiffersFromLatin: false, gridRow: 7, gridCol: 1
  },
  {
    z: 88, symbol: 'Ra', nameCs: 'Radium', nameLa: 'Radium',
    period: 7, group: 2, groupRoman: 'II.A', block: 's', category: 'alkaline-earth',
    atomicMass: '[226]', state: 'solid', electronConfig: '[Rn] 7s²', oxidationStates: '+II',
    czechDiffersFromLatin: false, gridRow: 7, gridCol: 2
  },

  // Actinoids (placed in row 10, cols 4..18)
  {
    z: 89, symbol: 'Ac', nameCs: 'Aktinium', nameLa: 'Actinium',
    period: 7, group: 3, groupRoman: 'III.B', block: 'd', category: 'actinoid',
    atomicMass: '[227]', state: 'solid', electronConfig: '[Rn] 6d¹ 7s²', oxidationStates: '+III',
    czechDiffersFromLatin: false, gridRow: 10, gridCol: 4
  },
  {
    z: 90, symbol: 'Th', nameCs: 'Thorium', nameLa: 'Thorium',
    period: 7, group: 3, groupRoman: 'III.B', block: 'f', category: 'actinoid',
    atomicMass: '232.04', state: 'solid', electronConfig: '[Rn] 6d² 7s²', oxidationStates: '+IV',
    czechDiffersFromLatin: false, gridRow: 10, gridCol: 5
  },
  {
    z: 91, symbol: 'Pa', nameCs: 'Protaktinium', nameLa: 'Protactinium',
    period: 7, group: 3, groupRoman: 'III.B', block: 'f', category: 'actinoid',
    atomicMass: '231.04', state: 'solid', electronConfig: '[Rn] 5f² 6d¹ 7s²', oxidationStates: '+IV, +V',
    czechDiffersFromLatin: false, gridRow: 10, gridCol: 6
  },
  {
    z: 92, symbol: 'U', nameCs: 'Uran', nameLa: 'Uranium',
    period: 7, group: 3, groupRoman: 'III.B', block: 'f', category: 'actinoid',
    atomicMass: '238.03', state: 'solid', electronConfig: '[Rn] 5f³ 6d¹ 7s²', oxidationStates: '+III..+VI',
    czechDiffersFromLatin: false, gridRow: 10, gridCol: 7
  },
  {
    z: 93, symbol: 'Np', nameCs: 'Neptunium', nameLa: 'Neptunium',
    period: 7, group: 3, groupRoman: 'III.B', block: 'f', category: 'actinoid',
    atomicMass: '[237]', state: 'solid', electronConfig: '[Rn] 5f⁴ 6d¹ 7s²', oxidationStates: '+III..+VI',
    czechDiffersFromLatin: false, gridRow: 10, gridCol: 8
  },
  {
    z: 94, symbol: 'Pu', nameCs: 'Plutonium', nameLa: 'Plutonium',
    period: 7, group: 3, groupRoman: 'III.B', block: 'f', category: 'actinoid',
    atomicMass: '[244]', state: 'solid', electronConfig: '[Rn] 5f⁶ 7s²', oxidationStates: '+III..+VI',
    czechDiffersFromLatin: false, gridRow: 10, gridCol: 9
  },
  {
    z: 95, symbol: 'Am', nameCs: 'Americium', nameLa: 'Americium',
    period: 7, group: 3, groupRoman: 'III.B', block: 'f', category: 'actinoid',
    atomicMass: '[243]', state: 'solid', electronConfig: '[Rn] 5f⁷ 7s²', oxidationStates: '+II..+VI',
    czechDiffersFromLatin: false, gridRow: 10, gridCol: 10
  },
  {
    z: 96, symbol: 'Cm', nameCs: 'Curium', nameLa: 'Curium',
    period: 7, group: 3, groupRoman: 'III.B', block: 'f', category: 'actinoid',
    atomicMass: '[247]', state: 'solid', electronConfig: '[Rn] 5f⁷ 6d¹ 7s²', oxidationStates: '+III, +IV',
    czechDiffersFromLatin: false, gridRow: 10, gridCol: 11
  },
  {
    z: 97, symbol: 'Bk', nameCs: 'Berkelium', nameLa: 'Berkelium',
    period: 7, group: 3, groupRoman: 'III.B', block: 'f', category: 'actinoid',
    atomicMass: '[247]', state: 'solid', electronConfig: '[Rn] 5f⁹ 7s²', oxidationStates: '+III, +IV',
    czechDiffersFromLatin: false, gridRow: 10, gridCol: 12
  },
  {
    z: 98, symbol: 'Cf', nameCs: 'Kalifornium', nameLa: 'Californium',
    period: 7, group: 3, groupRoman: 'III.B', block: 'f', category: 'actinoid',
    atomicMass: '[251]', state: 'solid', electronConfig: '[Rn] 5f¹⁰ 7s²', oxidationStates: '+III, +IV',
    czechDiffersFromLatin: false, gridRow: 10, gridCol: 13
  },
  {
    z: 99, symbol: 'Es', nameCs: 'Einsteinium', nameLa: 'Einsteinium',
    period: 7, group: 3, groupRoman: 'III.B', block: 'f', category: 'actinoid',
    atomicMass: '[252]', state: 'solid', electronConfig: '[Rn] 5f¹¹ 7s²', oxidationStates: '+III',
    czechDiffersFromLatin: false, gridRow: 10, gridCol: 14
  },
  {
    z: 100, symbol: 'Fm', nameCs: 'Fermium', nameLa: 'Fermium',
    period: 7, group: 3, groupRoman: 'III.B', block: 'f', category: 'actinoid',
    atomicMass: '[257]', state: 'solid', electronConfig: '[Rn] 5f¹² 7s²', oxidationStates: '+III',
    czechDiffersFromLatin: false, gridRow: 10, gridCol: 15
  },
  {
    z: 101, symbol: 'Md', nameCs: 'Mendelevium', nameLa: 'Mendelevium',
    period: 7, group: 3, groupRoman: 'III.B', block: 'f', category: 'actinoid',
    atomicMass: '[258]', state: 'solid', electronConfig: '[Rn] 5f¹³ 7s²', oxidationStates: '+II, +III',
    czechDiffersFromLatin: false, gridRow: 10, gridCol: 16
  },
  {
    z: 102, symbol: 'No', nameCs: 'Nobelium', nameLa: 'Nobelium',
    period: 7, group: 3, groupRoman: 'III.B', block: 'f', category: 'actinoid',
    atomicMass: '[259]', state: 'solid', electronConfig: '[Rn] 5f¹⁴ 7s²', oxidationStates: '+II, +III',
    czechDiffersFromLatin: false, gridRow: 10, gridCol: 17
  },
  {
    z: 103, symbol: 'Lr', nameCs: 'Lawrencium', nameLa: 'Lawrencium',
    period: 7, group: 3, groupRoman: 'III.B', block: 'd', category: 'actinoid',
    atomicMass: '[266]', state: 'solid', electronConfig: '[Rn] 5f¹⁴ 7s² 7p¹', oxidationStates: '+III',
    czechDiffersFromLatin: false, gridRow: 10, gridCol: 18
  },

  // Period 7 continued (cols 4..18)
  {
    z: 104, symbol: 'Rf', nameCs: 'Rutherfordium', nameLa: 'Rutherfordium',
    period: 7, group: 4, groupRoman: 'IV.B', block: 'd', category: 'transition-metal',
    atomicMass: '[267]', state: 'solid', electronConfig: '[Rn] 5f¹⁴ 6d² 7s²', oxidationStates: '+IV',
    czechDiffersFromLatin: false, gridRow: 7, gridCol: 4
  },
  {
    z: 105, symbol: 'Db', nameCs: 'Dubnium', nameLa: 'Dubnium',
    period: 7, group: 5, groupRoman: 'V.B', block: 'd', category: 'transition-metal',
    atomicMass: '[268]', state: 'solid', electronConfig: '[Rn] 5f¹⁴ 6d³ 7s²', oxidationStates: '+V',
    czechDiffersFromLatin: false, gridRow: 7, gridCol: 5
  },
  {
    z: 106, symbol: 'Sg', nameCs: 'Seaborgium', nameLa: 'Seaborgium',
    period: 7, group: 6, groupRoman: 'VI.B', block: 'd', category: 'transition-metal',
    atomicMass: '[269]', state: 'solid', electronConfig: '[Rn] 5f¹⁴ 6d⁴ 7s²', oxidationStates: '+VI',
    czechDiffersFromLatin: false, gridRow: 7, gridCol: 6
  },
  {
    z: 107, symbol: 'Bh', nameCs: 'Bohrium', nameLa: 'Bohrium',
    period: 7, group: 7, groupRoman: 'VII.B', block: 'd', category: 'transition-metal',
    atomicMass: '[270]', state: 'solid', electronConfig: '[Rn] 5f¹⁴ 6d⁵ 7s²', oxidationStates: '+VII',
    czechDiffersFromLatin: false, gridRow: 7, gridCol: 7
  },
  {
    z: 108, symbol: 'Hs', nameCs: 'Hassium', nameLa: 'Hassium',
    period: 7, group: 8, groupRoman: 'VIII.B', block: 'd', category: 'transition-metal',
    atomicMass: '[277]', state: 'solid', electronConfig: '[Rn] 5f¹⁴ 6d⁶ 7s²', oxidationStates: '+VIII',
    czechDiffersFromLatin: false, gridRow: 7, gridCol: 8
  },
  {
    z: 109, symbol: 'Mt', nameCs: 'Meitnerium', nameLa: 'Meitnerium',
    period: 7, group: 9, groupRoman: 'VIII.B', block: 'd', category: 'transition-metal',
    atomicMass: '[278]', state: 'solid', electronConfig: '[Rn] 5f¹⁴ 6d⁷ 7s²', oxidationStates: '+III, +IV',
    czechDiffersFromLatin: false, gridRow: 7, gridCol: 9
  },
  {
    z: 110, symbol: 'Ds', nameCs: 'Darmstadtium', nameLa: 'Darmstadtium',
    period: 7, group: 10, groupRoman: 'VIII.B', block: 'd', category: 'transition-metal',
    atomicMass: '[281]', state: 'solid', electronConfig: '[Rn] 5f¹⁴ 6d⁸ 7s²', oxidationStates: '+II, +IV',
    czechDiffersFromLatin: false, gridRow: 7, gridCol: 10
  },
  {
    z: 111, symbol: 'Rg', nameCs: 'Roentgenium', nameLa: 'Roentgenium',
    period: 7, group: 11, groupRoman: 'I.B', block: 'd', category: 'transition-metal',
    atomicMass: '[282]', state: 'solid', electronConfig: '[Rn] 5f¹⁴ 6d⁹ 7s²', oxidationStates: '+III',
    czechDiffersFromLatin: false, gridRow: 7, gridCol: 11
  },
  {
    z: 112, symbol: 'Cn', nameCs: 'Copernicium', nameLa: 'Copernicium',
    period: 7, group: 12, groupRoman: 'II.B', block: 'd', category: 'transition-metal',
    atomicMass: '[285]', state: 'solid', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s²', oxidationStates: '+II',
    czechDiffersFromLatin: false, gridRow: 7, gridCol: 12
  },
  {
    z: 113, symbol: 'Nh', nameCs: 'Nihonium', nameLa: 'Nihonium',
    period: 7, group: 13, groupRoman: 'III.A', block: 'p', category: 'post-transition-metal',
    atomicMass: '[286]', state: 'solid', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹', oxidationStates: '+I, +III',
    czechDiffersFromLatin: false, gridRow: 7, gridCol: 13
  },
  {
    z: 114, symbol: 'Fl', nameCs: 'Flerovium', nameLa: 'Flerovium',
    period: 7, group: 14, groupRoman: 'IV.A', block: 'p', category: 'post-transition-metal',
    atomicMass: '[289]', state: 'solid', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²', oxidationStates: '+II, +IV',
    czechDiffersFromLatin: false, gridRow: 7, gridCol: 14
  },
  {
    z: 115, symbol: 'Mc', nameCs: 'Moscovium', nameLa: 'Moscovium',
    period: 7, group: 15, groupRoman: 'V.A', block: 'p', category: 'post-transition-metal',
    atomicMass: '[290]', state: 'solid', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³', oxidationStates: '+I, +III',
    czechDiffersFromLatin: false, gridRow: 7, gridCol: 15
  },
  {
    z: 116, symbol: 'Lv', nameCs: 'Livermorium', nameLa: 'Livermorium',
    period: 7, group: 16, groupRoman: 'VI.A', block: 'p', category: 'post-transition-metal',
    atomicMass: '[293]', state: 'solid', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴', oxidationStates: '+II, +IV',
    czechDiffersFromLatin: false, gridRow: 7, gridCol: 16
  },
  {
    z: 117, symbol: 'Ts', nameCs: 'Tennessin', nameLa: 'Tennessine',
    period: 7, group: 17, groupRoman: 'VII.A', block: 'p', category: 'halogen',
    atomicMass: '[294]', state: 'solid', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵', oxidationStates: '-I, +I, +III, +V',
    czechDiffersFromLatin: false, gridRow: 7, gridCol: 17
  },
  {
    z: 118, symbol: 'Og', nameCs: 'Oganesson', nameLa: 'Oganesson',
    period: 7, group: 18, groupRoman: 'VIII.A', block: 'p', category: 'noble-gas',
    atomicMass: '[294]', state: 'solid', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶', oxidationStates: '0, +II, +IV',
    czechDiffersFromLatin: false, gridRow: 7, gridCol: 18
  }
];

export interface PlaceholderCell {
  labelRange: string;
  labelSymbols: string;
  name: string;
  category: ElementCategory;
  gridRow: number;
  gridCol: number;
}

export const PLACEHOLDERS: PlaceholderCell[] = [
  {
    labelRange: '57–71',
    labelSymbols: 'La–Lu',
    name: 'Lanthanoidy',
    category: 'lanthanoid',
    gridRow: 6,
    gridCol: 3
  },
  {
    labelRange: '89–103',
    labelSymbols: 'Ac–Lr',
    name: 'Aktinoidy',
    category: 'actinoid',
    gridRow: 7,
    gridCol: 3
  }
];

export function normalizeText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Searches the 118 elements according to strict cipher priority:
 * 1. Exact match on Symbol (e.g. "C" -> Uhlík #1)
 * 2. Exact match on Atomic Number (e.g. "6" or "26")
 * 3. Prefix of Symbol (e.g. "C" -> Ca, Cd, Cl...)
 * 4. Prefix of Czech name (e.g. "C" -> Cer, Cesium)
 * 5. Prefix of Latin name (e.g. "C" -> Calcium, Cadmium, Cuprum)
 * 6. Substring in Czech name
 * 7. Substring in Latin name
 * 8. Prefix of Atomic Number
 */
export function searchElements(rawQuery: string): ChemicalElement[] {
  const q = rawQuery.trim();
  if (!q) return [];

  const qUpper = q.toUpperCase();
  const qNorm = normalizeText(q);
  const isNumeric = /^\d+$/.test(q);

  interface ScoredElement {
    element: ChemicalElement;
    score: number;
  }

  const scored: ScoredElement[] = [];

  for (const el of ELEMENTS) {
    const symUpper = el.symbol.toUpperCase();
    const nameCsNorm = normalizeText(el.nameCs);
    const nameLaNorm = normalizeText(el.nameLa);
    const zStr = String(el.z);

    let score = 0;

    // 1. Exact match on Symbol (highest priority)
    if (symUpper === qUpper) {
      score = 10000;
    }
    // 2. Exact match on Atomic number
    else if (isNumeric && zStr === q) {
      score = 9000;
    }
    // 3. Symbol starts with query (if query <= 2 chars)
    else if (symUpper.startsWith(qUpper)) {
      score = 8000;
    }
    // 4. Czech name starts with query
    else if (nameCsNorm.startsWith(qNorm)) {
      score = 7000;
    }
    // 5. Latin name starts with query
    else if (nameLaNorm.startsWith(qNorm)) {
      score = 6000;
    }
    // 6. Substring in Czech name
    else if (nameCsNorm.includes(qNorm)) {
      score = 5000;
    }
    // 7. Substring in Latin name
    else if (nameLaNorm.includes(qNorm)) {
      score = 4000;
    }
    // 8. Atomic number starts with query
    else if (isNumeric && zStr.startsWith(q)) {
      score = 3000;
    }

    if (score > 0) {
      scored.push({ element: el, score });
    }
  }

  // Sort by score descending, then by Z ascending
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.element.z - b.element.z;
  });

  return scored.map((s) => s.element);
}

/**
 * Returns distinct visual styling depending on the active tactical filter.
 */
export function getElementFilterStyle(element: ChemicalElement, filter: TacticalFilter): {
  color: string;
  bgTint: string;
  borderTint: string;
  dimmed: boolean;
} {
  if (filter === 'letters') {
    const isOneLetter = element.symbol.length === 1;
    if (isOneLetter) {
      return {
        color: '#f59e0b', // Amber/gold
        bgTint: 'rgba(245, 158, 11, 0.16)',
        borderTint: 'rgba(245, 158, 11, 0.85)',
        dimmed: false
      };
    } else {
      return {
        color: '#94a3b8',
        bgTint: 'rgba(148, 163, 184, 0.04)',
        borderTint: 'rgba(148, 163, 184, 0.25)',
        dimmed: true
      };
    }
  }

  if (filter === 'state') {
    if (element.state === 'gas') {
      return {
        color: '#38bdf8', // Sky blue
        bgTint: 'rgba(56, 189, 248, 0.18)',
        borderTint: 'rgba(56, 189, 248, 0.8)',
        dimmed: false
      };
    }
    if (element.state === 'liquid') {
      return {
        color: '#fb923c', // Amber / orange (Brom, Rtuť)
        bgTint: 'rgba(251, 146, 60, 0.24)',
        borderTint: 'rgba(251, 146, 60, 0.95)',
        dimmed: false
      };
    }
    // Solid
    return {
      color: '#94a3b8', // Slate / solid
      bgTint: 'rgba(148, 163, 184, 0.08)',
      borderTint: 'rgba(148, 163, 184, 0.4)',
      dimmed: false
    };
  }

  if (filter === 'spdf') {
    switch (element.block) {
      case 's':
        return {
          color: '#ef4444', // Red/crimson for s-block
          bgTint: 'rgba(239, 68, 68, 0.18)',
          borderTint: 'rgba(239, 68, 68, 0.85)',
          dimmed: false
        };
      case 'p':
        return {
          color: '#10b981', // Emerald green for p-block
          bgTint: 'rgba(16, 185, 129, 0.18)',
          borderTint: 'rgba(16, 185, 129, 0.85)',
          dimmed: false
        };
      case 'd':
        return {
          color: '#3b82f6', // Vivid blue for d-block
          bgTint: 'rgba(59, 130, 246, 0.18)',
          borderTint: 'rgba(59, 130, 246, 0.85)',
          dimmed: false
        };
      case 'f':
        return {
          color: '#a855f7', // Purple/violet for f-block
          bgTint: 'rgba(168, 85, 247, 0.18)',
          borderTint: 'rgba(168, 85, 247, 0.85)',
          dimmed: false
        };
    }
  }

  if (filter === 'radioactive') {
    const isRad = isElementRadioactive(element);
    if (isRad) {
      return {
        color: '#facc15', // Vivid radioactive warning yellow
        bgTint: 'rgba(250, 204, 21, 0.22)',
        borderTint: 'rgba(250, 204, 21, 0.95)',
        dimmed: false
      };
    } else {
      return {
        color: '#64748b',
        bgTint: 'rgba(100, 116, 139, 0.04)',
        borderTint: 'rgba(100, 116, 139, 0.18)',
        dimmed: true
      };
    }
  }

  if (filter === 'czech') {
    if (element.czechDiffersFromLatin) {
      return {
        color: '#10b981', // Vivid Emerald
        bgTint: 'rgba(16, 185, 129, 0.20)',
        borderTint: 'rgba(16, 185, 129, 0.85)',
        dimmed: false
      };
    } else {
      return {
        color: '#64748b',
        bgTint: 'rgba(100, 116, 139, 0.04)',
        borderTint: 'rgba(100, 116, 139, 0.18)',
        dimmed: true
      };
    }
  }

  // Default: color-coded by category
  return getCategoryColors(element.category);
}

export function getCategoryColors(category: ElementCategory): {
  color: string;
  bgTint: string;
  borderTint: string;
  dimmed: boolean;
} {
  switch (category) {
    case 'alkali-metal':
      return { color: '#ef4444', bgTint: 'rgba(239, 68, 68, 0.12)', borderTint: 'rgba(239, 68, 68, 0.55)', dimmed: false };
    case 'alkaline-earth':
      return { color: '#f97316', bgTint: 'rgba(249, 115, 22, 0.12)', borderTint: 'rgba(249, 115, 22, 0.55)', dimmed: false };
    case 'transition-metal':
      return { color: '#3b82f6', bgTint: 'rgba(59, 130, 246, 0.12)', borderTint: 'rgba(59, 130, 246, 0.55)', dimmed: false };
    case 'post-transition-metal':
      return { color: '#10b981', bgTint: 'rgba(16, 185, 129, 0.12)', borderTint: 'rgba(16, 185, 129, 0.55)', dimmed: false };
    case 'metalloid':
      return { color: '#06b6d4', bgTint: 'rgba(6, 182, 212, 0.12)', borderTint: 'rgba(6, 182, 212, 0.55)', dimmed: false };
    case 'reactive-nonmetal':
      return { color: '#84cc16', bgTint: 'rgba(132, 204, 22, 0.12)', borderTint: 'rgba(132, 204, 22, 0.55)', dimmed: false };
    case 'halogen':
      return { color: '#eab308', bgTint: 'rgba(234, 179, 8, 0.12)', borderTint: 'rgba(234, 179, 8, 0.55)', dimmed: false };
    case 'noble-gas':
      return { color: '#a855f7', bgTint: 'rgba(168, 85, 247, 0.12)', borderTint: 'rgba(168, 85, 247, 0.55)', dimmed: false };
    case 'lanthanoid':
      return { color: '#ec4899', bgTint: 'rgba(236, 72, 153, 0.12)', borderTint: 'rgba(236, 72, 153, 0.55)', dimmed: false };
    case 'actinoid':
      return { color: '#8b5cf6', bgTint: 'rgba(139, 92, 246, 0.12)', borderTint: 'rgba(139, 92, 246, 0.55)', dimmed: false };
    default:
      return { color: '#94a3b8', bgTint: 'rgba(148, 163, 184, 0.08)', borderTint: 'rgba(148, 163, 184, 0.35)', dimmed: false };
  }
}

export function getStateLabel(state: StateOfMatter): string {
  switch (state) {
    case 'gas': return 'plyn';
    case 'liquid': return 'kapalina';
    case 'solid': return 'pevná';
  }
}
