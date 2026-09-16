export interface BaseConfig {
  base: number;
  name: string;
  shortName: string;
  subscript: string;
  digits: string[];
}

export const COMMON_BASES = [2, 3, 8, 10, 16] as const;

export const BASE_CONFIGS: Record<number, BaseConfig> = {
  2: {
    base: 2,
    name: 'Binární',
    shortName: 'BIN',
    subscript: '₂',
    digits: ['0', '1']
  },
  3: {
    base: 3,
    name: 'Ternární',
    shortName: 'TER',
    subscript: '₃',
    digits: ['0', '1', '2']
  },
  4: {
    base: 4,
    name: 'Kvartérní',
    shortName: '4',
    subscript: '₄',
    digits: ['0', '1', '2', '3']
  },
  5: {
    base: 5,
    name: 'Kvinární',
    shortName: '5',
    subscript: '₅',
    digits: ['0', '1', '2', '3', '4']
  },
  6: {
    base: 6,
    name: 'Senární',
    shortName: '6',
    subscript: '₆',
    digits: ['0', '1', '2', '3', '4', '5']
  },
  7: {
    base: 7,
    name: 'Septární',
    shortName: '7',
    subscript: '₇',
    digits: ['0', '1', '2', '3', '4', '5', '6']
  },
  8: {
    base: 8,
    name: 'Oktalová',
    shortName: 'OCT',
    subscript: '₈',
    digits: ['0', '1', '2', '3', '4', '5', '6', '7']
  },
  9: {
    base: 9,
    name: 'Nonární',
    shortName: '9',
    subscript: '₉',
    digits: ['0', '1', '2', '3', '4', '5', '6', '7', '8']
  },
  10: {
    base: 10,
    name: 'Decimální',
    shortName: 'DEC',
    subscript: '₁₀',
    digits: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  },
  11: {
    base: 11,
    name: 'Undecimální',
    shortName: '11',
    subscript: '₁₁',
    digits: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A']
  },
  12: {
    base: 12,
    name: 'Duodecimální',
    shortName: '12',
    subscript: '₁₂',
    digits: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B']
  },
  13: {
    base: 13,
    name: 'Tridecimální',
    shortName: '13',
    subscript: '₁₃',
    digits: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C']
  },
  14: {
    base: 14,
    name: 'Tetradecimální',
    shortName: '14',
    subscript: '₁₄',
    digits: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D']
  },
  15: {
    base: 15,
    name: 'Pentadecimální',
    shortName: '15',
    subscript: '₁₅',
    digits: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E']
  },
  16: {
    base: 16,
    name: 'Hexadecimální',
    shortName: 'HEX',
    subscript: '₁₆',
    digits: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F']
  }
};

export const ALL_BASES = Array.from({ length: 15 }, (_, i) => i + 2); // 2..16

export type FlowMode = 'char' | 'roman' | 'roman_loose' | number; // 'char' for alphabet, 'roman' for canonical Roman, 'roman_loose' for loose/free Roman, or number (2..16) for positional base

export const ROMAN_VALUES: Record<string, number> = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
  D: 500,
  M: 1000
};

export function getFlowModeLabel(mode: FlowMode): string {
  if (mode === 'char') {
    return 'Znak';
  }
  if (mode === 'roman') {
    return 'Římská čísla (kanonická)';
  }
  if (mode === 'roman_loose') {
    return 'Římská čísla (volná)';
  }
  const cfg = BASE_CONFIGS[mode];
  return cfg ? `${cfg.shortName} (${mode})` : `Báze ${mode}`;
}

export function getFlowModeShort(mode: FlowMode): string {
  if (mode === 'char') {
    return 'ZNAK';
  }
  if (mode === 'roman') {
    return 'Ř';
  }
  if (mode === 'roman_loose') {
    return 'Ř+';
  }
  return BASE_CONFIGS[mode]?.shortName ?? `${mode}`;
}

export function getFlowModeSubscript(mode: FlowMode): string {
  if (mode === 'char') return '';
  if (mode === 'roman') return 'ᵣ';
  if (mode === 'roman_loose') return 'ᵣ⁺';
  return BASE_CONFIGS[mode]?.subscript ?? `_${mode}`;
}
