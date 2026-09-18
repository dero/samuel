import { performance } from 'node:perf_hooks';
import { loadLexiconRawWords } from '../benchmark-morse/loadDb';
import { loadCaesarBenchmark, type CaesarBenchmarkCase } from './dataset';
import {
  buildCaesarLexicon,
  scoreAllCaesarCandidates,
  DEFAULT_CAESAR_WEIGHTS,
  type CaesarScorerWeights,
  type CaesarLexicon
} from '../../src/lib/modules/07-shifts/caesarScorer';
import { shiftCaesar } from '../../src/lib/modules/07-shifts/shiftsSolver';

const ALPHA_26 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export interface CaesarMiss {
  id: number;
  category: string;
  target: string;
  expectedShift: number;
  expectedReverse: number;
  rank: number;
  topCandidateText: string;
  topCandidateShift: number;
  topCandidatePct: number;
  expectedPct: number;
  description?: string;
}

export interface CaesarBenchmarkResult {
  total: number;
  top1Count: number;
  top1Pct: number;
  top3Count: number;
  top3Pct: number;
  mrr: number;
  greenCount: number; // expected shift >= 70%
  yellowCount: number; // expected shift >= 40% and < 70%
  redCount: number; // expected shift < 40%
  falsePositiveCount: number; // wrong shift got >= 50%
  avgTimeMs: number;
  totalTimeMs: number;
  misses: CaesarMiss[];
}

export function evaluateCaesar(
  cases: CaesarBenchmarkCase[],
  lexicon: CaesarLexicon,
  weights: CaesarScorerWeights = DEFAULT_CAESAR_WEIGHTS
): CaesarBenchmarkResult {
  let top1Count = 0;
  let top3Count = 0;
  let sumReciprocalRank = 0;
  let greenCount = 0;
  let yellowCount = 0;
  let redCount = 0;
  let falsePositiveCount = 0;
  const misses: CaesarMiss[] = [];

  const t0 = performance.now();

  for (const c of cases) {
    // Generate all 25 shifts for ciphertext
    const allShifts: string[] = [];
    for (let k = 1; k < 26; k++) {
      allShifts.push(shiftCaesar(c.cipherText, k, ALPHA_26));
    }

    const evaluated = scoreAllCaesarCandidates(allShifts, lexicon, weights);

    // Sort by percentage/plausibility descending to get ranking
    const sorted = [...evaluated].sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      return b.rawPlausibility - a.rawPlausibility;
    });

    // Find rank of expected reverse shift
    const rank = sorted.findIndex((item) => item.shift === c.expectedReverseShift);
    const expectedItem = evaluated.find((item) => item.shift === c.expectedReverseShift)!;

    if (rank === 0) top1Count++;
    if (rank >= 0 && rank < 3) top3Count++;
    if (rank >= 0) sumReciprocalRank += 1 / (rank + 1);

    const expPct = expectedItem.percentage;
    if (expPct >= 70) greenCount++;
    else if (expPct >= 40) yellowCount++;
    else redCount++;

    // Check false positives among wrong shifts
    for (const item of evaluated) {
      if (item.shift !== c.expectedReverseShift && item.percentage >= 50) {
        falsePositiveCount++;
        break;
      }
    }

    if (rank !== 0) {
      misses.push({
        id: c.id,
        category: c.category,
        target: c.plainText,
        expectedShift: c.expectedShift,
        expectedReverse: c.expectedReverseShift,
        rank,
        topCandidateText: sorted[0].cleanText,
        topCandidateShift: sorted[0].shift,
        topCandidatePct: sorted[0].percentage,
        expectedPct: expPct,
        description: c.description
      });
    }
  }

  const t1 = performance.now();
  const totalTimeMs = t1 - t0;
  const total = cases.length;

  return {
    total,
    top1Count,
    top1Pct: Math.round((top1Count / total) * 1000) / 10,
    top3Count,
    top3Pct: Math.round((top3Count / total) * 1000) / 10,
    mrr: Math.round((sumReciprocalRank / total) * 1000) / 1000,
    greenCount,
    yellowCount,
    redCount,
    falsePositiveCount,
    avgTimeMs: Math.round((totalTimeMs / total) * 100) / 100,
    totalTimeMs: Math.round(totalTimeMs),
    misses
  };
}

async function main() {
  console.log('===========================================================');
  console.log('       SAMUEL CAESAR SOLVER ACCURACY BENCHMARK             ');
  console.log('===========================================================');

  console.log('1. Načítám slovníkovou databázi z public/words.db...');
  const tDb0 = performance.now();
  const rawWords = await loadLexiconRawWords();
  const lexicon = buildCaesarLexicon(rawWords);
  const tDb1 = performance.now();
  console.log(`   ✓ Načteno ${lexicon.size.toLocaleString('cs-CZ')} hesel za ${(tDb1 - tDb0).toFixed(0)} ms.\n`);

  console.log('2. Načítám testovací sadu šifer...');
  const cases = loadCaesarBenchmark(rawWords);
  console.log(`   ✓ Celkem ${cases.length} testovacích šifer v sadách:`);
  const byCat: Record<string, number> = {};
  for (const c of cases) byCat[c.category] = (byCat[c.category] || 0) + 1;
  for (const [cat, count] of Object.entries(byCat)) {
    console.log(`     • ${cat.padEnd(16)}: ${count} šifer`);
  }
  console.log();

  console.log('3. Spouštím vyhodnocení...');
  const res = evaluateCaesar(cases, lexicon);

  console.log('-----------------------------------------------------------');
  console.log('                      VÝSLEDKY                             ');
  console.log('-----------------------------------------------------------');
  console.log(`Celkem testováno:          ${res.total} šifer`);
  console.log(`Top 1 Přesnost:            ${res.top1Count} / ${res.total} (${res.top1Pct} %)`);
  console.log(`Top 3 Přesnost:            ${res.top3Count} / ${res.total} (${res.top3Pct} %)`);
  console.log(`MRR (Mean Recipr. Rank):   ${res.mrr.toFixed(3)}`);
  console.log(`Průměrný čas na šifru:     ${res.avgTimeMs} ms (${res.totalTimeMs} ms celkem)`);
  console.log();
  console.log('Barevná kalibrace správných řešení:');
  console.log(`  🟢 Zelené (>= 70 %):     ${res.greenCount} (${Math.round((res.greenCount / res.total) * 100)} %)`);
  console.log(`  🟡 Žluté (40–69 %):      ${res.yellowCount} (${Math.round((res.yellowCount / res.total) * 100)} %)`);
  console.log(`  🔴 Červené (< 40 %):     ${res.redCount} (${Math.round((res.redCount / res.total) * 100)} %)`);
  console.log(`Falešné pozitivity (> 50%):${res.falsePositiveCount}`);
  console.log();

  if (res.misses.length > 0) {
    console.log('-----------------------------------------------------------');
    console.log(`CHYBNĚ VYHODNOCENÉ PŘÍPADY (${res.misses.length}):`);
    console.log('-----------------------------------------------------------');
    for (const m of res.misses.slice(0, 10)) {
      console.log(`[#${m.id} ${m.category}] Cíl: "${m.target}"`);
      if (m.description) console.log(`   Kontext: ${m.description}`);
      console.log(`   Očekáván posun -${m.expectedReverse} (skóre ${m.expectedPct} %), skončil na pozici #${m.rank + 1}`);
      console.log(`   Vítěz byl posun -${26 - m.topCandidateShift}: "${m.topCandidateText}" (${m.topCandidatePct} %)\n`);
    }
  } else {
    console.log('✨ 100% ÚSPĚŠNOST! Žádné chyby.');
  }

  // Quick check of the user's specific test case: TUSPNUXIWBC -> STROMTWHVAB
  console.log('-----------------------------------------------------------');
  console.log('OVĚŘENÍ SPECIFICKÉHO TESTU UŽIVATELE: "TUSPNUXIWBC"');
  console.log('-----------------------------------------------------------');
  const userShifts: string[] = [];
  for (let k = 1; k < 26; k++) {
    userShifts.push(shiftCaesar('TUSPNUXIWBC', k, ALPHA_26));
  }
  const userEval = scoreAllCaesarCandidates(userShifts, lexicon);
  const bestUser = userEval.find((item) => item.isBest)!;
  const shift25 = userEval.find((item) => item.shift === 25)!;

  console.log(`Posun -1 (+25): "${shift25.cleanText}" | Skóre: ${shift25.percentage} % | Slovo: "${shift25.bestWord}"`);
  console.log(`Celkový vítěz:  "${bestUser.cleanText}" (posun -${26 - bestUser.shift}) | Skóre: ${bestUser.percentage} %`);
  if (bestUser.shift === 25 && shift25.percentage >= 50) {
    console.log('✓ VÝBORNĚ: Posun -1 se slovem STROM suverénně vyhrál a je ve žluto-zelené barvě!\n');
  } else {
    console.log('⚠ Pozor: Posun -1 nevyhrál nebo nemá žlutou barvu.\n');
  }
}

if (process.argv[1]?.endsWith('benchmark.ts')) {
  main().catch(console.error);
}
