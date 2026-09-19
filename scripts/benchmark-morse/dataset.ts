import fs from 'node:fs';
import { resolve } from 'node:path';
import { wordToMorse } from '../../src/lib/modules/morse/morseSolver';
import { removeDiacritics } from '../../src/lib/utils/text';
import type { RawLexiconWord } from './loadDb';

export interface BenchmarkCipher {
  id: number;
  text: string;
  words: string[];
  morse: string;
  category: 'single' | 'multi';
  wordCount: number;
  isCanonical?: boolean;
}

/**
 * Normalizes a raw cipher solution string:
 * - strips parenthetical comments e.g. "(odkaz na...)"
 * - strips commentary after ", tedy..." or "+ ..."
 * - strips quotes, punctuation
 * - converts Czech diacritics to ASCII uppercase
 */
export function normalizeSolution(raw: string): string {
  if (!raw) return '';
  let text = raw.trim();
  text = text.replace(/\([^\)]*\)/g, '');
  text = text.replace(/,?\s*tedy.*$/i, '');
  text = text.replace(/\+.*$/, '');
  text = text.replace(/^"|"$/g, '');
  text = removeDiacritics(text).toUpperCase();
  text = text.replace(/[^A-Z\s]/g, ' ');
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Converts a space-separated phrase to unspaced Morse code string.
 */
export function phraseToMorse(phrase: string): string {
  const words = phrase.split(/\s+/).filter(Boolean);
  return words.map((w) => wordToMorse(w)).join('');
}

/**
 * High-profile / canonical cipher solutions from Czech cipher competitions.
 */
export const CANONICAL_CIPHERS: string[] = [
  'VYSTAVISTE J VSTUP',
  'KASTAN BENDLOVA',
  'PARK BUBENICKOVA VELRYBA',
  'NEJBLIZSI MOST',
  'SEDOVA S',
  'CERNY MOST',
  'RAD MLYN RYBNIK',
  'PARK TISNOVKA RAMPA Z',
  'CISLO DVACET KAMENACKY',
  'CHVALOVKA HRISTE',
  'ULICE VE VINOHRADECH PRUSEK',
  'SPOJOVACI KONECNA',
  'RAJSKA ZAHRADA',
  'RESENI ROHY',
  'POSPISILOVA ZAPAD',
  'POLSKA SCHODY',
  'SVATY JAN',
  'ZAMEK TROJA',
  'STARY HRAD',
  'ZAJIC',
  'KOCKA',
  'KRYSA',
  'POUSTKA',
  'DIKTAT',
  'PSTROS',
  'PRENOS',
  'MAGNET',
  'STROM',
  'ROZCESTNIK',
  'VIKTORIE',
  'KOSTEL',
  'NEPTUN',
  'ZLIN',
  'RAMPA',
  'BOHDALEC',
  'PISMENO',
  'BULHARSKO',
  'NEPILOVA',
  'KRIZAK',
  'BUBENSKA VLAK'
];

/**
 * Loads all valid ciphers from data/solutions.json whose words are in the vocabulary.
 */
export function loadAllValidCiphers(
  rawWords: RawLexiconWord[],
  solutionsPath?: string
): BenchmarkCipher[] {
  const targetFile = solutionsPath ?? resolve(process.cwd(), 'data/solutions.json');
  const rawList: Array<{ solution?: string }> = JSON.parse(fs.readFileSync(targetFile, 'utf8'));

  const wordSet = new Set(rawWords.map((r) => r.word));
  // Single-letter directions & common prepositions
  ['S', 'J', 'V', 'Z', 'K', 'O', 'U', 'A', 'I'].forEach((w) => wordSet.add(w));

  const unique = new Map<string, BenchmarkCipher>();
  let id = 1;

  // 1. First add canonical ciphers
  for (const c of CANONICAL_CIPHERS) {
    const norm = normalizeSolution(c);
    const words = norm.split(' ').filter(Boolean);
    const morse = phraseToMorse(norm);
    if (morse.length >= 4) {
      unique.set(norm, {
        id: id++,
        text: norm,
        words,
        morse,
        category: words.length === 1 ? 'single' : 'multi',
        wordCount: words.length,
        isCanonical: true
      });
    }
  }

  // 2. Add valid solutions from solutions.json
  for (const item of rawList) {
    const sol = item.solution;
    if (!sol) continue;

    const norm = normalizeSolution(sol);
    if (!norm) continue;

    const words = norm.split(' ').filter(Boolean);
    if (words.length < 1 || words.length > 5) continue;

    // Check if every word is in the dictionary
    const allInVocab = words.every((w) => wordSet.has(w));
    if (!allInVocab) continue;

    if (!unique.has(norm)) {
      const morse = phraseToMorse(norm);
      if (morse.length >= 4) {
        unique.set(norm, {
          id: id++,
          text: norm,
          words,
          morse,
          category: words.length === 1 ? 'single' : 'multi',
          wordCount: words.length,
          isCanonical: false
        });
      }
    }
  }

  return Array.from(unique.values());
}

/**
 * Returns a balanced, representative evaluation dataset (~150-180 items)
 * covering 1-word, 2-word, 3-word, 4-word, and canonical ciphers.
 */
export function getCuratedBenchmark(
  rawWords: RawLexiconWord[],
  solutionsPath?: string
): BenchmarkCipher[] {
  const all = loadAllValidCiphers(rawWords, solutionsPath);

  const canonical = all.filter((c) => c.isCanonical);
  const others = all.filter((c) => !c.isCanonical);

  const singleWords = others.filter((c) => c.wordCount === 1);
  const twoWords = others.filter((c) => c.wordCount === 2);
  const threeWords = others.filter((c) => c.wordCount === 3);
  const fourWords = others.filter((c) => c.wordCount >= 4);

  // Pick deterministic subset using stride
  function pickSubset<T>(arr: T[], targetCount: number): T[] {
    if (arr.length <= targetCount) return arr;
    const stride = arr.length / targetCount;
    const picked: T[] = [];
    for (let i = 0; i < targetCount; i++) {
      picked.push(arr[Math.floor(i * stride)]);
    }
    return picked;
  }

  const selected = [
    ...canonical,
    ...pickSubset(singleWords, 40),
    ...pickSubset(twoWords, 45),
    ...pickSubset(threeWords, 35),
    ...pickSubset(fourWords, 20)
  ];

  // Deduplicate by text
  const finalMap = new Map<string, BenchmarkCipher>();
  for (const item of selected) {
    if (!finalMap.has(item.text)) {
      finalMap.set(item.text, item);
    }
  }

  return Array.from(finalMap.values());
}
