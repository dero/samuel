import type { SegmentOption } from '../../components/ui/SegmentedControl.svelte';
import type { RadioOption } from '../../components/ui/RadioGroup.svelte';

export type ShiftType = 'caesar' | 'vigenere' | 'autokey';

export interface ShiftTypeConfig {
  id: ShiftType;
  name: string;
  shortName: string;
  description: string;
}

export const SHIFT_TYPES: ShiftTypeConfig[] = [
  {
    id: 'caesar',
    name: 'Cézar',
    shortName: 'Cézar',
    description: 'Posun o konstantu s přehledem všech posunů a Markovovou heatmapou'
  },
  {
    id: 'vigenere',
    name: 'Vigenère',
    shortName: 'Vigenère',
    description: 'Posun o klíčové heslo nebo číslice (Gronsfeld)'
  },
  {
    id: 'autokey',
    name: 'Autokey',
    shortName: 'Autokey',
    description: 'Dešifrování navazujícím otevřeným či šifrovým textem'
  }
];

export const SHIFT_SEGMENT_OPTIONS: SegmentOption<ShiftType>[] = SHIFT_TYPES.map((t) => ({
  id: t.id,
  label: t.shortName
}));

export const SHIFT_TYPE_RADIO_OPTIONS: RadioOption<ShiftType>[] = SHIFT_TYPES.map((t) => ({
  value: t.id,
  label: t.name,
  description: t.description
}));

export interface CaesarShiftResult {
  shift: number;
  reverseShift: number;
  shiftedText: string;
  score: number;
  percentage: number;
  recognizedWords: string[];
  formattedText: string;
  isBest?: boolean;
}

export type VigenereMode = 'decrypt' | 'encrypt';
export type AutokeyMode = 'decrypt' | 'encrypt';
export type AutokeyKeySource = 'plaintext' | 'ciphertext';
