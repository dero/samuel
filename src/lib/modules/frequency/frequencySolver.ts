import {
  CZECH_27_UNACCENTED_FREQUENCIES,
  CZECH_42_FREQUENCIES,
  IOC_EXPECTED
} from './frequencyData';

export interface FrequencyOptions {
  removeDiacritics: boolean; // default false
  removeSymbols: boolean;    // default true (only letters)
}

export const DEFAULT_FREQ_OPTIONS: FrequencyOptions = {
  removeDiacritics: false,
  removeSymbols: true
};

export interface MonogramItem {
  char: string;
  count: number;
  pct: number; // 0 to 100
  expectedPct: number | null; // from reference language
  diffPct: number | null; // pct - expectedPct
}

export interface IocSummary {
  ioc: number; // e.g. 0.0612
  classification: 'mono' | 'poly' | 'high' | 'low';
  label: string;
  description: string;
}

export interface FrequencyAnalysisResult {
  tokens: string[];
  totalChars: number;
  uniqueChars: number;
  monograms: MonogramItem[];
  ioc: IocSummary;
}

const DIACRITIC_MAP: Record<string, string> = {
  Á: 'A', Č: 'C', Ď: 'D', É: 'E', Ě: 'E', Í: 'I', Ň: 'N', Ó: 'O',
  Ř: 'R', Š: 'S', Ť: 'T', Ú: 'U', Ů: 'U', Ý: 'Y', Ž: 'Z',
  á: 'A', č: 'C', ď: 'D', é: 'E', ě: 'E', í: 'I', ň: 'N', ó: 'O',
  ř: 'R', š: 'S', ť: 'T', ú: 'U', ů: 'U', ý: 'Y', ž: 'Z',
  Ä: 'A', Ö: 'O', Ü: 'U', ä: 'A', ö: 'O', ü: 'U', Ô: 'O', ô: 'O',
  Ĺ: 'L', ĺ: 'L', Ľ: 'L', ľ: 'L', Ŕ: 'R', ŕ: 'R', ß: 'S'
};

/**
 * Strips diacritics/accents to base Latin characters.
 */
export function removeDiacritics(text: string): string {
  return text
    .split('')
    .map((c) => DIACRITIC_MAP[c] ?? c)
    .join('')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Tokenizes text without fixed alphabet constraints.
 * Supports digraph 'CH' and any Unicode letters (Czech, German, etc.).
 */
export function tokenizeText(
  rawText: string,
  options: FrequencyOptions = DEFAULT_FREQ_OPTIONS
): string[] {
  let processed = rawText.toUpperCase();
  if (options.removeDiacritics) {
    processed = removeDiacritics(processed);
  }

  const tokens: string[] = [];
  let i = 0;
  while (i < processed.length) {
    // 1. Recognize digraph 'CH'
    if (i + 1 < processed.length && processed.slice(i, i + 2) === 'CH') {
      tokens.push('CH');
      i += 2;
      continue;
    }

    const char = processed[i];

    if (options.removeSymbols) {
      // Keep only Unicode letters (A-Z, Á, Č, Ř, Ü, etc.)
      if (/\p{L}/u.test(char)) {
        tokens.push(char);
      }
    } else {
      // Keep all non-whitespace characters (letters, numbers, punctuation)
      if (!/\s/.test(char)) {
        tokens.push(char);
      }
    }
    i++;
  }

  return tokens;
}

/**
 * Computes Index of Coincidence (IoC):
 * IoC = sum(f_i * (f_i - 1)) / (N * (N - 1))
 */
export function computeIoc(counts: Record<string, number>, total: number): number {
  if (total <= 1) return 0;
  let sum = 0;
  for (const count of Object.values(counts)) {
    sum += count * (count - 1);
  }
  return sum / (total * (total - 1));
}

/**
 * Interprets an IoC value for classical ciphers.
 */
export function classifyIoc(
  ioc: number,
  total: number,
  is42: boolean = false
): IocSummary {
  if (total < 10) {
    return {
      ioc,
      classification: 'low',
      label: 'Nedostatek dat',
      description: 'Zadejte aspoň 20 znaků.'
    };
  }

  const expectedLang = is42 ? IOC_EXPECTED.csDiacritics42 : IOC_EXPECTED.csUnaccented;
  const uniform = is42 ? IOC_EXPECTED.uniform42 : IOC_EXPECTED.uniform26;

  if (ioc >= 0.078) {
    return {
      ioc,
      classification: 'high',
      label: 'Vysoká periodicita',
      description: 'Hodně opakování nebo málo různých znaků.'
    };
  }

  if (ioc >= expectedLang - 0.009) {
    return {
      ioc,
      classification: 'mono',
      label: 'Přirozený jazyk',
      description: 'Substituce, posun nebo transpozice.'
    };
  }

  if (ioc <= uniform + 0.007) {
    return {
      ioc,
      classification: 'poly',
      label: 'Polyalfabetická / náhodná',
      description: 'Ploché četnosti: Vigenère nebo šum.'
    };
  }

  return {
    ioc,
    classification: 'poly',
    label: 'Mezilehlý IoC',
    description: 'Mezi jazykem a náhodou.'
  };
}

/**
 * Performs frequency analysis on text without alphabet restrictions.
 */
export function analyzeFrequency(
  rawText: string,
  options: FrequencyOptions = DEFAULT_FREQ_OPTIONS
): FrequencyAnalysisResult {
  const tokens = tokenizeText(rawText, options);
  const totalChars = tokens.length;

  const counts: Record<string, number> = {};
  for (const token of tokens) {
    counts[token] = (counts[token] || 0) + 1;
  }

  // Detect whether text has Czech diacritic letters
  const hasCzechDiacritics = Object.keys(counts).some(
    (ch) => ch in CZECH_42_FREQUENCIES && !(ch in CZECH_27_UNACCENTED_FREQUENCIES)
  );

  const refFrequencies = hasCzechDiacritics
    ? CZECH_42_FREQUENCIES
    : CZECH_27_UNACCENTED_FREQUENCIES;

  const monograms: MonogramItem[] = Object.keys(counts).map((sym) => {
    const count = counts[sym];
    const pct = totalChars > 0 ? (count / totalChars) * 100 : 0;
    const expected = refFrequencies[sym] ?? null;
    const diff = expected !== null && totalChars > 0 ? pct - expected : null;

    return {
      char: sym,
      count,
      pct,
      expectedPct: expected,
      diffPct: diff
    };
  });

  const uniqueChars = Object.keys(counts).length;
  const iocVal = computeIoc(counts, totalChars);
  const ioc = classifyIoc(iocVal, totalChars, hasCzechDiacritics);

  return {
    tokens,
    totalChars,
    uniqueChars,
    monograms,
    ioc
  };
}
