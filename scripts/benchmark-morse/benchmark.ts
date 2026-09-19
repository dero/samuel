import { performance } from 'node:perf_hooks';
import fs from 'node:fs';
import { resolve } from 'node:path';
import { loadLexiconRawWords, type RawLexiconWord } from './loadDb';
import {
  getCuratedBenchmark,
  loadAllValidCiphers,
  normalizeSolution,
  phraseToMorse,
  type BenchmarkCipher
} from './dataset';
import {
  solveMorseWithoutSpaces,
  buildLexiconItems,
  DEFAULT_SOLVER_WEIGHTS,
  type MorseSolverWeights,
  type LexiconItem
} from '../../src/lib/modules/morse/morseSolver';

export interface BenchmarkMiss {
  target: string;
  words: string[];
  morse: string;
  rankExact: number; // 0-indexed, -1 if not found
  rankNorm: number;
  topCandidate: string;
  topScore: number;
}

export interface EvaluationResult {
  weights: MorseSolverWeights;
  total: number;
  top1Exact: number;
  top1ExactPct: number;
  top1Norm: number;
  top1NormPct: number;
  top3Norm: number;
  top3NormPct: number;
  top10Norm: number;
  top10NormPct: number;
  mrr: number; // Mean Reciprocal Rank (0 to 1)
  avgTimeMs: number;
  totalTimeMs: number;
  failures: BenchmarkMiss[];
  misses: BenchmarkMiss[];
}

/**
 * Runs evaluation on a set of ciphers using specified weights.
 */
export async function evaluateWeights(
  ciphers: BenchmarkCipher[],
  weights: MorseSolverWeights,
  rawWords: RawLexiconWord[],
  prebuiltLexicon?: LexiconItem[],
  maxDepth = 30,
  prefiltered?: LexiconItem[][]
): Promise<EvaluationResult> {
  const lexicon = prebuiltLexicon ?? buildLexiconItems(rawWords, weights);

  let top1Exact = 0;
  let top1Norm = 0;
  let top3Norm = 0;
  let top10Norm = 0;
  let sumReciprocalRank = 0;
  const failures: BenchmarkMiss[] = [];
  const misses: BenchmarkMiss[] = [];

  const t0 = performance.now();

  for (let idx = 0; idx < ciphers.length; idx++) {
    const c = ciphers[idx];
    const matching = prefiltered ? prefiltered[idx] : undefined;
    const res = await solveMorseWithoutSpaces(c.morse, maxDepth, weights, lexicon, matching);

    const normTarget = c.text.replace(/\s+/g, '');
    let rankExact = -1;
    let rankNorm = -1;

    for (let i = 0; i < res.candidates.length; i++) {
      const cand = res.candidates[i];
      if (rankExact === -1 && cand.text === c.text) {
        rankExact = i;
      }
      if (rankNorm === -1 && cand.text.replace(/\s+/g, '') === normTarget) {
        rankNorm = i;
      }
      if (rankExact !== -1 && rankNorm !== -1) break;
    }

    if (rankExact === 0) top1Exact++;
    if (rankNorm === 0) top1Norm++;
    if (rankNorm >= 0 && rankNorm < 3) top3Norm++;
    if (rankNorm >= 0 && rankNorm < 10) top10Norm++;

    if (rankNorm >= 0) {
      sumReciprocalRank += 1 / (rankNorm + 1);
    }

    const item: BenchmarkMiss = {
      target: c.text,
      words: c.words,
      morse: c.morse,
      rankExact,
      rankNorm,
      topCandidate: res.candidates.length > 0 ? res.candidates[0].text : 'NONE',
      topScore: res.candidates.length > 0 ? res.candidates[0].score : 0
    };

    if (rankNorm !== 0) {
      failures.push(item);
    }
    if (rankNorm === -1 || rankNorm >= 10) {
      misses.push(item);
    }
  }

  const totalTimeMs = performance.now() - t0;
  const n = ciphers.length;

  return {
    weights,
    total: n,
    top1Exact,
    top1ExactPct: (top1Exact / n) * 100,
    top1Norm,
    top1NormPct: (top1Norm / n) * 100,
    top3Norm,
    top3NormPct: (top3Norm / n) * 100,
    top10Norm,
    top10NormPct: (top10Norm / n) * 100,
    mrr: sumReciprocalRank / n,
    avgTimeMs: totalTimeMs / n,
    totalTimeMs,
    failures,
    misses
  };
}

/**
 * Pretty prints evaluation results to console.
 */
export function printEvaluationResult(res: EvaluationResult, title = 'EVALUATION RESULTS'): void {
  console.log('\n' + '='.repeat(68));
  console.log(`  ${title}`);
  console.log('='.repeat(68));
  console.log(
    `  Weights: exp=${res.weights.lengthExponent.toFixed(2)} | ` +
    `cipher=${res.weights.cipherBoost.toFixed(2)} | ` +
    `ruian=${res.weights.ruianBoost.toFixed(2)} | ` +
    `singleGrammar=${res.weights.singleGrammarBoost.toFixed(2)} | ` +
    `freq=${res.weights.freqWeight.toFixed(3)} | ` +
    `wordPenalty=${res.weights.wordCountPenalty.toFixed(2)}`
  );
  console.log('-'.repeat(68));
  console.log(`  Total test ciphers:       ${res.total}`);
  console.log(`  Top-1 Accuracy (Exact):   ${res.top1Exact} / ${res.total} (${res.top1ExactPct.toFixed(1)}%)`);
  console.log(`  Top-1 Accuracy (Norm):    ${res.top1Norm} / ${res.total} (${res.top1NormPct.toFixed(1)}%)`);
  console.log(`  Top-3 Accuracy (Norm):    ${res.top3Norm} / ${res.total} (${res.top3NormPct.toFixed(1)}%)`);
  console.log(`  Top-10 Accuracy (Norm):   ${res.top10Norm} / ${res.total} (${res.top10NormPct.toFixed(1)}%)`);
  console.log(`  Mean Reciprocal Rank (MRR): ${res.mrr.toFixed(4)}`);
  console.log(`  Avg latency per cipher:   ${res.avgTimeMs.toFixed(1)} ms (total: ${(res.totalTimeMs / 1000).toFixed(2)}s)`);
  console.log('='.repeat(68));

  if (res.failures.length > 0) {
    const showCount = Math.min(15, res.failures.length);
    console.log(`\n  Sample Sub-optimal / Failed Targets (showing ${showCount} of ${res.failures.length}):`);
    console.log('  ' + '-'.repeat(64));
    for (let i = 0; i < showCount; i++) {
      const f = res.failures[i];
      const rankStr = f.rankNorm >= 0 ? `#${f.rankNorm + 1}` : 'NOT IN TOP 50';
      console.log(
        `  - "${f.target}" [Rank: ${rankStr}]` +
        `\n    Predicted #1: "${f.topCandidate}" (${f.topScore}%)`
      );
    }
  }
}

/**
 * Sorts misses from worst (not found / -1) to best (11th place).
 */
export function sortMissesWorstToBest(misses: BenchmarkMiss[]): BenchmarkMiss[] {
  return [...misses].sort((a, b) => {
    // 1. Not found (-1) is worst, comes first
    if (a.rankNorm === -1 && b.rankNorm !== -1) return -1;
    if (a.rankNorm !== -1 && b.rankNorm === -1) return 1;
    if (a.rankNorm === -1 && b.rankNorm === -1) return a.target.localeCompare(b.target);
    // 2. Descending by rank: 50, 49, 48... down to 10 (rank #11)
    return b.rankNorm - a.rankNorm;
  });
}

/**
 * Prints comprehensive report of all ciphers not in TOP 10,
 * with word status and candidate words for puzzle_words dictionary.
 */
export function printMissesReport(
  misses: BenchmarkMiss[],
  rawWords: RawLexiconWord[]
): void {
  const sorted = sortMissesWorstToBest(misses);
  const wordMap = new Map<string, RawLexiconWord>();
  for (const rw of rawWords) {
    wordMap.set(rw.word, rw);
  }

  console.log('\n' + '='.repeat(68));
  console.log(`  TAJENKY MIMO TOP 10 (${sorted.length} tajenek, od nejhorších po 11. místo)`);
  console.log('='.repeat(68));

  const candidateNewWords = new Set<string>();

  for (let i = 0; i < sorted.length; i++) {
    const m = sorted[i];
    const rankLabel = m.rankNorm === -1 ? 'NENALEZENO V TOP 50' : `Rank #${m.rankNorm + 1}`;

    console.log(`\n${(i + 1).toString().padStart(3)}. [${rankLabel}] "${m.target}"`);
    console.log(`     Morse: ${m.morse}`);
    console.log(`     Predikce #1: "${m.topCandidate}" (${m.topScore}%)`);

    const wordDetails = m.words.map((w) => {
      const info = wordMap.get(w);
      if (!info) {
        candidateNewWords.add(w);
        return `${w} [NENÍ V DATABÁZI]`;
      }
      if (!info.isCipher) {
        if (w.length >= 3) candidateNewWords.add(w);
        return `${w} [freq: ${info.freq}, cipher: ✗]`;
      }
      return `${w} [freq: ${info.freq}, cipher: ✓]`;
    });
    console.log(`     Slova: ${wordDetails.join(', ')}`);
  }

  console.log('\n' + '='.repeat(68));
  console.log('  DOPORUČENÁ SLOVA K PŘIDÁNÍ DO ŠIFROVÉHO SLOVNÍKU (puzzle_words)');
  console.log('  (Slova z neúspěšných tajenek s délkou >= 3, která zatím nemají šifrový status):');
  console.log('='.repeat(68));

  const sortedCandidates = Array.from(candidateNewWords).sort((a, b) => {
    const freqA = wordMap.get(a)?.freq ?? 0;
    const freqB = wordMap.get(b)?.freq ?? 0;
    return freqB - freqA;
  });

  console.log(`Celkem unikátních kandidátů: ${sortedCandidates.length}\n`);
  console.log(sortedCandidates.join(', '));
  console.log('\nJako JSON pole pro vložení:');
  console.log(JSON.stringify(sortedCandidates, null, 2));
  console.log('='.repeat(68));
}

/**
 * Inspects a specific target phrase in detail.
 */
export async function diagnoseTarget(
  phrase: string,
  rawWords: RawLexiconWord[],
  weights: MorseSolverWeights = DEFAULT_SOLVER_WEIGHTS
): Promise<void> {
  const norm = normalizeSolution(phrase);
  const morse = phraseToMorse(norm);
  const lexicon = buildLexiconItems(rawWords, weights);

  console.log('\n' + '='.repeat(68));
  console.log(`  DIAGNOSING TARGET: "${norm}"`);
  console.log('='.repeat(68));
  console.log(`  Morse: ${morse} (${morse.length} signals)`);
  console.log(
    `  Words in lexicon: ` +
    norm
      .split(' ')
      .map((w) => `${w}: ${lexicon.some((l) => l.word === w) ? '✓' : '✗'}`)
      .join(', ')
  );

  const t0 = performance.now();
  const res = await solveMorseWithoutSpaces(morse, 30, weights, lexicon);
  const dur = performance.now() - t0;

  console.log(`  Found: ${res.totalFound} candidates in ${dur.toFixed(1)} ms`);

  const normTarget = norm.replace(/\s+/g, '');
  let exactRank = -1;
  let normRank = -1;

  for (let i = 0; i < res.candidates.length; i++) {
    const c = res.candidates[i];
    if (exactRank === -1 && c.text === norm) exactRank = i;
    if (normRank === -1 && c.text.replace(/\s+/g, '') === normTarget) normRank = i;
  }

  console.log(`  Target Rank: Exact=${exactRank >= 0 ? '#' + (exactRank + 1) : 'Not in top 30'}, Norm=${normRank >= 0 ? '#' + (normRank + 1) : 'Not in top 30'}`);
  console.log('\n  Top Candidates:');
  console.log('  ' + '-'.repeat(64));
  res.candidates.slice(0, 15).forEach((c, idx) => {
    const isTarget = c.text === norm ? ' ★ TARGET' : c.text.replace(/\s+/g, '') === normTarget ? ' ⭑ NORM MATCH' : '';
    console.log(`  ${(idx + 1).toString().padStart(2)}. [${c.score}%] ${c.text}${isTarget}`);
  });
  console.log('='.repeat(68));
}

/**
 * Optimizes solver parameters using multi-stage coordinate search.
 */
export async function optimizeParameters(
  ciphers: BenchmarkCipher[],
  rawWords: RawLexiconWord[]
): Promise<MorseSolverWeights> {
  console.log('\n' + '='.repeat(68));
  console.log('  STARTING PARAMETER OPTIMIZATION (COORDINATE SEARCH)');
  console.log('='.repeat(68));
  console.log(`  Training set: ${ciphers.length} ciphers\n`);

  let currentWeights: MorseSolverWeights = { ...DEFAULT_SOLVER_WEIGHTS };

  console.log('  Indexing lexicon & pre-filtering per cipher...');
  const tPre = performance.now();
  const lexicon = buildLexiconItems(rawWords, currentWeights);
  const prefiltered = ciphers.map((c) => lexicon.filter((l) => c.morse.includes(l.morse)));
  console.log(`  Pre-filter complete in ${(performance.now() - tPre).toFixed(0)} ms.\n`);

  // Helper for running and logging a step
  async function testCandidate(
    stepName: string,
    w: MorseSolverWeights
  ): Promise<EvaluationResult> {
    const t0 = performance.now();
    const res = await evaluateWeights(ciphers, w, rawWords, lexicon, 30, prefiltered);
    const dur = (performance.now() - t0).toFixed(0);
    const isNewBest = res.mrr > bestResult.mrr;
    const marker = isNewBest ? ' ★ NEW BEST' : '';
    console.log(
      `    ${stepName} -> Top-1=${res.top1NormPct.toFixed(1)}%, Top-3=${res.top3NormPct.toFixed(1)}%, MRR=${res.mrr.toFixed(4)} (${dur}ms)${marker}`
    );
    if (isNewBest) {
      bestResult = res;
      currentWeights = w;
    }
    return res;
  }

  // Step 0: Baseline
  console.log('  [0/6] Evaluating baseline weights...');
  let bestResult = await evaluateWeights(ciphers, currentWeights, rawWords, lexicon, 30, prefiltered);
  console.log(
    `  Baseline: Top-1(norm)=${bestResult.top1NormPct.toFixed(1)}% | ` +
    `Top-3=${bestResult.top3NormPct.toFixed(1)}% | ` +
    `MRR=${bestResult.mrr.toFixed(4)}`
  );

  // Optimization stage 1: lengthExponent
  console.log('\n  [1/6] Tuning lengthExponent (favors longer cohesive words)...');
  const expCandidates = [1.9, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5];
  for (const exp of expCandidates) {
    await testCandidate(`exp=${exp.toFixed(2)}`, { ...currentWeights, lengthExponent: exp });
  }
  console.log(`  -> Best lengthExponent: ${currentWeights.lengthExponent.toFixed(2)} (MRR: ${bestResult.mrr.toFixed(4)})`);

  // Optimization stage 2: cipherBoost
  console.log('\n  [2/6] Tuning cipherBoost (priority for cipher keywords & directions)...');
  const cipherCandidates = [1.5, 1.65, 1.8, 1.95, 2.1];
  for (const cb of cipherCandidates) {
    await testCandidate(`cipherBoost=${cb.toFixed(2)}`, { ...currentWeights, cipherBoost: cb });
  }
  console.log(`  -> Best cipherBoost: ${currentWeights.cipherBoost.toFixed(2)} (MRR: ${bestResult.mrr.toFixed(4)})`);

  // Optimization stage 3: ruianBoost
  console.log('\n  [3/6] Tuning ruianBoost (priority for Czech street names & places)...');
  const ruianCandidates = [1.05, 1.10, 1.15, 1.20, 1.25];
  for (const rb of ruianCandidates) {
    await testCandidate(`ruianBoost=${rb.toFixed(2)}`, { ...currentWeights, ruianBoost: rb });
  }
  console.log(`  -> Best ruianBoost: ${currentWeights.ruianBoost.toFixed(2)} (MRR: ${bestResult.mrr.toFixed(4)})`);

  // Optimization stage 4: wordCountPenalty
  console.log('\n  [4/6] Tuning wordCountPenalty (Occam\'s razor against over-fragmentation)...');
  const penaltyCandidates = [2.0, 2.5, 3.0, 3.5, 4.0, 5.0, 6.0];
  for (const pen of penaltyCandidates) {
    await testCandidate(`wordCountPenalty=${pen.toFixed(2)}`, { ...currentWeights, wordCountPenalty: pen });
  }
  console.log(`  -> Best wordCountPenalty: ${currentWeights.wordCountPenalty.toFixed(2)} (MRR: ${bestResult.mrr.toFixed(4)})`);

  // Optimization stage 5: freqWeight
  console.log('\n  [5/6] Tuning freqWeight (Czech National Corpus log-frequency boost)...');
  const freqCandidates = [0.06, 0.08, 0.10, 0.12, 0.15];
  for (const fw of freqCandidates) {
    await testCandidate(`freqWeight=${fw.toFixed(3)}`, { ...currentWeights, freqWeight: fw });
  }
  console.log(`  -> Best freqWeight: ${currentWeights.freqWeight.toFixed(3)} (MRR: ${bestResult.mrr.toFixed(4)})`);

  // Optimization stage 6: singleGrammarBoost
  console.log('\n  [6/6] Tuning singleGrammarBoost (for single-letter prepositions A, I, O, U, K)...');
  const singleGrammarCandidates = [0.90, 0.95, 1.00, 1.05, 1.10, 1.15];
  for (const sg of singleGrammarCandidates) {
    await testCandidate(`singleGrammarBoost=${sg.toFixed(2)}`, { ...currentWeights, singleGrammarBoost: sg });
  }
  console.log(`  -> Best singleGrammarBoost: ${currentWeights.singleGrammarBoost.toFixed(2)} (MRR: ${bestResult.mrr.toFixed(4)})`);

  console.log('\n' + '='.repeat(68));
  console.log('  OPTIMIZATION COMPLETE!');
  console.log('='.repeat(68));
  printEvaluationResult(bestResult, 'OPTIMIZED CONFIGURATION RESULTS');
  return currentWeights;
}

/**
 * Applies optimal weights into src/lib/modules/01-morse/morseSolver.ts
 */
export function applyWeightsToFile(weights: MorseSolverWeights): void {
  const targetFile = resolve(process.cwd(), 'src/lib/modules/morse/morseSolver.ts');
  let content = fs.readFileSync(targetFile, 'utf8');

  const replacement = `export const DEFAULT_SOLVER_WEIGHTS: MorseSolverWeights = {\n` +
    `  lengthExponent: ${weights.lengthExponent.toFixed(2)},\n` +
    `  cipherBoost: ${weights.cipherBoost.toFixed(2)},\n` +
    `  ruianBoost: ${weights.ruianBoost.toFixed(2)},\n` +
    `  singleGrammarBoost: ${weights.singleGrammarBoost.toFixed(2)},\n` +
    `  freqWeight: ${weights.freqWeight.toFixed(3)},\n` +
    `  wordCountPenalty: ${weights.wordCountPenalty.toFixed(2)},\n` +
    `  beamWidth: ${weights.beamWidth}\n` +
    `};`;

  const regex = /export const DEFAULT_SOLVER_WEIGHTS: MorseSolverWeights = \{[\s\S]*?\};/;
  if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log(`\n✓ Successfully updated DEFAULT_SOLVER_WEIGHTS in ${targetFile}`);
  } else {
    console.error('Could not find DEFAULT_SOLVER_WEIGHTS block in morseSolver.ts');
  }
}

async function main() {
  const args = process.argv.slice(2);

  const targetIdx = args.indexOf('--target');
  const isOptimize = args.includes('--optimize');
  const isAll = args.includes('--all');
  const shouldApply = args.includes('--apply');
  const isMisses =
    args.includes('--misses') ||
    args.includes('--not-in-top10') ||
    args.includes('--failures');

  console.log('Loading SQLite vocabulary database...');
  const tDb = performance.now();
  const rawWords = await loadLexiconRawWords();
  console.log(`Loaded ${rawWords.length} vocabulary words in ${(performance.now() - tDb).toFixed(1)} ms.`);

  if (targetIdx !== -1 && args[targetIdx + 1]) {
    const phrase = args[targetIdx + 1];
    await diagnoseTarget(phrase, rawWords);
    return;
  }

  const ciphers = isAll ? loadAllValidCiphers(rawWords) : getCuratedBenchmark(rawWords);
  console.log(`Using ${ciphers.length} benchmark ciphers (${isAll ? 'full dataset' : 'curated set'}).`);

  if (isOptimize) {
    const bestWeights = await optimizeParameters(ciphers, rawWords);
    if (shouldApply) {
      applyWeightsToFile(bestWeights);
    } else {
      console.log('\nTip: Run with --apply to write these weights into morseSolver.ts');
    }
  } else {
    console.log('Running evaluation with current default weights...');
    const result = await evaluateWeights(ciphers, DEFAULT_SOLVER_WEIGHTS, rawWords, undefined, 50);
    printEvaluationResult(result, 'DEFAULT WEIGHTS BENCHMARK');

    if (isMisses) {
      printMissesReport(result.misses, rawWords);
    }

    console.log('\nCommands available:');
    console.log('  npm run benchmark:morse');
    console.log('  npm run benchmark:morse -- --misses');
    console.log('  npm run benchmark:morse -- --all --misses');
    console.log('  npx tsx scripts/benchmark-morse/benchmark.ts --target "VYSTAVISTE J VSTUP"');
    console.log('  npx tsx scripts/benchmark-morse/benchmark.ts --optimize --apply');
  }
}

if (process.argv[1]?.includes('benchmark.ts')) {
  main().catch((err) => {
    console.error('Benchmark error:', err);
    process.exit(1);
  });
}
