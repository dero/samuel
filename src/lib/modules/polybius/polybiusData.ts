export type PolybiusSize = '5x5' | '6x6';
export type PolybiusCoordLabel = 'numbers' | 'letters';

export interface PolybiusConfig {
  size: PolybiusSize;
  sizeNum: number;
  capacity: number;
  defaultAlphabetId: string;
  standardAlphabetIds: string[];
}

export const POLYBIUS_CONFIGS: Record<PolybiusSize, PolybiusConfig> = {
  '5x5': {
    size: '5x5',
    sizeNum: 5,
    capacity: 25,
    defaultAlphabetId: 'english-26',
    standardAlphabetIds: ['english-26', 'alphanumeric-36']
  },
  '6x6': {
    size: '6x6',
    sizeNum: 6,
    capacity: 36,
    defaultAlphabetId: 'alphanumeric-36',
    standardAlphabetIds: ['alphanumeric-36', 'english-26']
  }
};

export { polybiusCoordToChar } from './polybiusSolver';
