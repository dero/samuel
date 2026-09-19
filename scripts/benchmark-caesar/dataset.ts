import fs from 'node:fs';
import { resolve } from 'node:path';
import { shiftCaesar } from '../../src/lib/modules/shifts/shiftsSolver';
import { removeDiacritics } from '../../src/lib/utils/text';
import type { RawLexiconWord } from '../benchmark-morse/loadDb';

export interface CaesarBenchmarkCase {
  id: number;
  category: 'canonical' | 'full' | 'prefix_noise' | 'single_word';
  plainText: string;
  cipherText: string;
  expectedShift: number; // The shift applied to plaintext (1 to 25)
  expectedReverseShift: number; // The shift needed to decrypt (26 - k)
  description?: string;
}

const CANONICAL_PHRASES = [
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

const NOISE_SUFFIXES = [
  'TWHVAB',
  'XKQZLM',
  'BNPFRT',
  'VWXZJK',
  'KLMNPQ',
  'DFGHJK',
  'ZXCVMN',
  'WQRTPS',
  'PLKMJN',
  'BVCXZA'
];

const ALPHA_26 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function loadCaesarBenchmark(
  rawWords: RawLexiconWord[],
  solutionsPath?: string
): CaesarBenchmarkCase[] {
  const cases: CaesarBenchmarkCase[] = [];
  let nextId = 1;

  // 1. Canonical cases
  for (let i = 0; i < CANONICAL_PHRASES.length; i++) {
    const plain = CANONICAL_PHRASES[i];
    const k = (i % 25) + 1;
    const cipher = shiftCaesar(plain, k, ALPHA_26);
    cases.push({
      id: nextId++,
      category: 'canonical',
      plainText: plain,
      cipherText: cipher,
      expectedShift: k,
      expectedReverseShift: 26 - k
    });
  }

  // 2. Prefix + Noise cases (e.g. STROM + TWHVAB -> TUSPNUXIWBC)
  const prefixWords = [
    'STROM', 'POKLAD', 'ROZCESTI', 'KOSTEL', 'RYBNIK', 'KAPLE',
    'MAGNET', 'SVETLO', 'STANICE', 'MOST', 'ZAMEK', 'KOCKA',
    'CILOVNIK', 'PRAMEN', 'VRCHOL', 'TABULE', 'BUDOVA', 'KAMEN'
  ];

  for (let i = 0; i < prefixWords.length; i++) {
    const word = prefixWords[i];
    const noise = NOISE_SUFFIXES[i % NOISE_SUFFIXES.length];
    const plain = word + noise;
    const k = ((i * 7 + 3) % 25) + 1;
    const cipher = shiftCaesar(plain, k, ALPHA_26);
    cases.push({
      id: nextId++,
      category: 'prefix_noise',
      plainText: plain,
      cipherText: cipher,
      expectedShift: k,
      expectedReverseShift: 26 - k,
      description: `Prefix: ${word} + Šum: ${noise}`
    });
  }

  // 3. Clean full solutions from data/solutions.json
  const targetFile = solutionsPath ?? resolve(process.cwd(), 'data/solutions.json');
  if (fs.existsSync(targetFile)) {
    const rawJson = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));
    const wordSet = new Set(rawWords.map((w) => w.word));

    let count = 0;
    for (const item of rawJson) {
      if (count >= 100) break;
      const clean = removeDiacritics(item.solution || '')
        .toUpperCase()
        .replace(/[^A-Z\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const words = clean.split(' ').filter((w) => w.length >= 3);
      if (words.length >= 1 && words.every((w) => wordSet.has(w))) {
        const k = ((count * 11 + 5) % 25) + 1;
        const cipher = shiftCaesar(clean, k, ALPHA_26);
        cases.push({
          id: nextId++,
          category: words.length === 1 ? 'single_word' : 'full',
          plainText: clean,
          cipherText: cipher,
          expectedShift: k,
          expectedReverseShift: 26 - k
        });
        count++;
      }
    }
  }

  return cases;
}
