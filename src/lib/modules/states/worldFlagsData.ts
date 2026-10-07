/**
 * World Flags Data Models & Taxonomy Definitions
 */

export type WorldContinent = 'europe' | 'asia' | 'africa' | 'oceania' | 'americas' | 'all';

export type WorldFlagColorId =
  | 'blue'
  | 'yellow'
  | 'black'
  | 'green'
  | 'red'
  | 'white';

export type WorldFlagFeatureId =
  | 'horizontal_stripes'
  | 'vertical_stripes'
  | 'diagonal_stripes'
  | 'cross'
  | 'triangle'
  | 'canton'
  | 'stars'
  | 'sun_circle'
  | 'crescent'
  | 'emblem'
  | 'text'
  | 'animal';

export interface WorldColorDef {
  id: WorldFlagColorId;
  name: string;
  hex: string;
  borderHex: string;
}

export interface WorldFeatureDef {
  id: WorldFlagFeatureId;
  name: string;
}

export interface ContinentDef {
  id: WorldContinent;
  name: string;
}

// 6 continents in Olympic ring order + All
export const WORLD_CONTINENTS: ContinentDef[] = [
  { id: 'europe', name: 'Evropa' },
  { id: 'asia', name: 'Asie' },
  { id: 'africa', name: 'Afrika' },
  { id: 'oceania', name: 'Oceánie' },
  { id: 'americas', name: 'Amerika' },
  { id: 'all', name: 'Vše' }
];

// 6 colors directly corresponding to Olympic ring order above + White flag canvas
export const WORLD_FLAG_COLORS: WorldColorDef[] = [
  { id: 'blue', name: 'Modrá', hex: '#2563eb', borderHex: '#1d4ed8' },
  { id: 'yellow', name: 'Žlutá', hex: '#eab308', borderHex: '#ca8a04' },
  { id: 'black', name: 'Černá', hex: '#18181b', borderHex: '#3f3f46' },
  { id: 'green', name: 'Zelená', hex: '#16a34a', borderHex: '#15803d' },
  { id: 'red', name: 'Červená', hex: '#dc2626', borderHex: '#b91c1c' },
  { id: 'white', name: 'Bílá', hex: '#f8fafc', borderHex: '#94a3b8' }
];

// 12 features (2 rows x 6 items)
export const WORLD_FLAG_FEATURES: WorldFeatureDef[] = [
  // Row 1: Geometry & Layout
  { id: 'horizontal_stripes', name: 'Horiz. pruhy' },
  { id: 'vertical_stripes', name: 'Vertik. pruhy' },
  { id: 'diagonal_stripes', name: 'Diagonála' },
  { id: 'cross', name: 'Kříž' },
  { id: 'triangle', name: 'Klín' },
  { id: 'canton', name: 'Kanton' },
  // Row 2: Symbols & Figures
  { id: 'stars', name: 'Hvězdy' },
  { id: 'sun_circle', name: 'Slunce / Kruh' },
  { id: 'crescent', name: 'Půlměsíc' },
  { id: 'emblem', name: 'Znak / Emblém' },
  { id: 'text', name: 'Nápis / Text' },
  { id: 'animal', name: 'Zvíře / Fauna' }
];
