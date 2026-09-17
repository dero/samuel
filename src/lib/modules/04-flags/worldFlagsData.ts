/**
 * World Flags Data Models & Taxonomy Definitions
 */

export type WorldContinent = 'all' | 'europe' | 'asia' | 'africa' | 'americas' | 'oceania';

export type WorldFlagColorId =
  | 'red'
  | 'blue'
  | 'white'
  | 'green'
  | 'yellow'
  | 'black'
  | 'orange'
  | 'cyan'
  | 'brown'
  | 'purple';

export type WorldFlagFeatureId =
  | 'horizontal_stripes'
  | 'vertical_stripes'
  | 'stars'
  | 'cross'
  | 'triangle'
  | 'diagonal_stripes'
  | 'emblem'
  | 'crescent'
  | 'sun_circle'
  | 'canton';

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

export const WORLD_CONTINENTS: ContinentDef[] = [
  { id: 'all', name: 'Vše' },
  { id: 'europe', name: 'Evropa' },
  { id: 'asia', name: 'Asie' },
  { id: 'africa', name: 'Afrika' },
  { id: 'americas', name: 'Amerika' },
  { id: 'oceania', name: 'Oceánie' }
];

export const WORLD_FLAG_COLORS: WorldColorDef[] = [
  { id: 'red', name: 'Červená', hex: '#dc2626', borderHex: '#b91c1c' },
  { id: 'blue', name: 'Modrá', hex: '#1d4ed8', borderHex: '#1e40af' },
  { id: 'white', name: 'Bílá', hex: '#f8fafc', borderHex: '#94a3b8' },
  { id: 'green', name: 'Zelená', hex: '#15803d', borderHex: '#166534' },
  { id: 'yellow', name: 'Žlutá', hex: '#facc15', borderHex: '#eab308' },
  { id: 'black', name: 'Černá', hex: '#18181b', borderHex: '#3f3f46' },
  { id: 'orange', name: 'Oranžová', hex: '#ea580c', borderHex: '#c2410c' },
  { id: 'cyan', name: 'Sv. modrá', hex: '#38bdf8', borderHex: '#0ea5e9' },
  { id: 'brown', name: 'Hnědá', hex: '#78350f', borderHex: '#92400e' },
  { id: 'purple', name: 'Fialová', hex: '#7e22ce', borderHex: '#6b21a8' }
];

export const WORLD_FLAG_FEATURES: WorldFeatureDef[] = [
  { id: 'horizontal_stripes', name: 'Horiz. pruhy' },
  { id: 'vertical_stripes', name: 'Vertik. pruhy' },
  { id: 'stars', name: 'Hvězdy' },
  { id: 'cross', name: 'Kříž' },
  { id: 'triangle', name: 'Klín' },
  { id: 'diagonal_stripes', name: 'Diagonála' },
  { id: 'emblem', name: 'Emblém' },
  { id: 'crescent', name: 'Půlměsíc' },
  { id: 'sun_circle', name: 'Slunce / Kruh' },
  { id: 'canton', name: 'Kanton' }
];
