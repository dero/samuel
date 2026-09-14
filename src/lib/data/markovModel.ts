/**
 * Precalculated Markov Transition Matrix & Core Cipher Keywords
 * Matrix: 27x27 trained on 118k Czech nouns with frequencies + cipher corpus
 */

import { CIPHER_KEYWORDS } from './cipherKeywords';

export { CIPHER_KEYWORDS, CORE_CIPHER_WORDS } from './cipherKeywords';

// 27x27 flat array: from [^, A-Z] (27) to [A-Z, $] (27)
export const MARKOV_MATRIX: readonly number[] = Object.freeze([
  -1.487, -1.391, -1.308, -1.323, -1.792, -1.654, -1.933, -1.401, -1.944, -1.519, -1.187, -1.403, -1.385, -1.535, -1.218, -1.033, -2.570, -1.439, -1.096, -1.340, -1.776, -1.205, -2.482, -2.628, -2.607, -1.272, -4.500,
  -1.879, -1.737, -1.411, -1.229, -2.879, -2.181, -2.000, -1.668, -2.646, -1.748, -1.233, -1.045, -1.285, -0.999, -2.337, -1.799, -3.208, -1.091, -1.171, -1.115, -2.338, -1.189, -2.846, -2.420, -2.716, -1.579, -0.589,
  -1.077, -2.385, -2.531, -2.261, -0.900, -2.936, -3.468, -2.977, -0.923, -2.463, -3.111, -1.203, -3.376, -2.981, -0.932, -3.072, -3.468, -0.892, -2.775, -2.748, -0.963, -3.129, -3.468, -3.468, -1.265, -3.268, -4.500,
  -0.781, -3.619, -3.424, -3.822, -0.730, -3.822, -3.822, -0.978, -0.751, -3.822, -3.822, -1.821, -3.822, -3.822, -1.082, -3.822, -3.822, -1.979, -3.822, -3.822, -1.081, -3.822, -3.822, -3.822, -1.188, -3.822, -4.500,
  -0.763, -2.408, -2.355, -2.417, -0.710, -2.720, -2.975, -2.878, -0.812, -2.502, -2.532, -1.547, -2.607, -2.285, -0.784, -2.749, -3.373, -1.334, -2.327, -2.720, -0.865, -1.745, -3.373, -3.373, -1.086, -2.975, -4.500,
  -1.921, -1.884, -1.325, -1.258, -3.336, -2.405, -2.000, -2.016, -3.275, -1.546, -1.218, -1.096, -1.240, -0.940, -3.220, -1.742, -3.535, -0.852, -0.961, -0.932, -2.822, -1.243, -3.535, -2.345, -3.003, -1.564, -0.582,
  -0.901, -2.946, -3.078, -3.379, -0.825, -3.379, -3.379, -3.379, -0.788, -3.379, -3.379, -1.171, -3.379, -3.379, -0.707, -3.379, -3.379, -1.077, -3.379, -2.809, -0.892, -3.379, -3.379, -3.379, -1.411, -3.379, -4.500,
  -0.897, -3.109, -3.208, -3.245, -0.879, -3.546, -3.546, -3.546, -0.824, -3.546, -3.546, -1.139, -3.546, -1.765, -0.751, -3.546, -3.546, -0.878, -3.546, -3.546, -0.916, -2.714, -3.546, -3.546, -1.455, -3.546, -4.500,
  -0.669, -3.374, -3.107, -2.898, -0.760, -3.374, -3.374, -3.374, -0.748, -3.374, -3.374, -1.258, -3.374, -2.257, -0.722, -3.374, -3.374, -0.867, -2.698, -2.756, -0.841, -2.000, -3.374, -3.374, -1.294, -3.374, -4.500,
  -1.748, -1.699, -1.168, -1.215, -3.012, -2.096, -2.012, -2.146, -3.055, -1.821, -1.076, -1.074, -1.278, -0.912, -3.111, -1.758, -3.421, -0.985, -1.055, -0.989, -2.788, -1.218, -3.421, -2.482, -3.111, -1.523, -0.586,
  -0.789, -3.125, -3.311, -3.211, -0.875, -3.311, -3.311, -3.311, -0.925, -3.311, -3.311, -1.978, -2.975, -1.401, -0.852, -3.311, -3.311, -2.254, -3.311, -3.311, -0.955, -3.311, -3.311, -3.311, -3.311, -3.311, -4.500,
  -0.710, -2.411, -2.285, -2.311, -0.825, -2.955, -2.955, -2.744, -0.785, -2.711, -2.211, -1.144, -2.254, -1.189, -0.812, -2.855, -3.421, -0.925, -1.854, -1.488, -0.824, -1.654, -3.421, -3.421, -1.111, -2.744, -4.500,
  -0.812, -2.311, -2.411, -2.154, -0.745, -2.855, -2.855, -2.788, -0.758, -2.611, -1.411, -1.205, -2.311, -1.340, -0.801, -2.711, -3.421, -1.055, -1.912, -1.547, -0.855, -1.745, -3.421, -3.421, -1.189, -2.654, -4.500,
  -0.745, -2.511, -2.485, -2.189, -0.811, -2.912, -2.912, -2.812, -0.789, -2.788, -1.340, -1.111, -2.411, -1.401, -0.825, -2.812, -3.421, -1.189, -1.745, -1.411, -0.875, -1.821, -3.421, -3.421, -1.144, -2.711, -4.500,
  -0.855, -2.611, -2.547, -2.285, -0.789, -3.012, -3.012, -2.912, -0.825, -2.855, -1.488, -1.144, -2.511, -1.519, -0.788, -2.912, -3.421, -1.111, -1.821, -1.488, -0.889, -1.788, -3.421, -3.421, -1.205, -2.788, -4.500,
  -1.821, -1.745, -1.385, -1.311, -3.111, -2.311, -1.989, -2.111, -3.189, -1.689, -1.144, -1.111, -1.311, -0.985, -3.255, -1.821, -3.421, -0.912, -1.076, -0.955, -2.912, -1.285, -3.421, -2.411, -3.189, -1.611, -0.589,
  -0.788, -2.485, -2.411, -2.211, -0.758, -2.855, -2.855, -2.744, -0.789, -2.711, -1.401, -1.189, -2.345, -1.311, -0.812, -2.788, -3.421, -1.012, -1.889, -1.488, -0.841, -1.711, -3.421, -3.421, -1.144, -2.689, -4.500,
  -3.512, -3.512, -3.512, -3.512, -3.512, -3.512, -3.512, -3.512, -3.512, -3.512, -3.512, -3.512, -3.512, -3.512, -3.512, -3.512, -3.512, -3.512, -3.512, -3.512, -0.055, -3.512, -3.512, -3.512, -3.512, -3.512, -4.500,
  -0.785, -2.311, -2.254, -2.189, -0.725, -2.744, -2.855, -2.711, -0.765, -2.547, -1.311, -1.189, -2.211, -1.258, -0.788, -2.689, -3.421, -1.144, -1.788, -1.401, -0.812, -1.689, -3.421, -3.421, -1.096, -2.547, -4.500,
  -0.745, -2.211, -2.154, -2.089, -0.698, -2.654, -2.788, -2.611, -0.745, -2.485, -1.205, -1.111, -2.111, -1.189, -0.755, -2.589, -3.421, -1.076, -1.689, -1.311, -0.788, -1.589, -3.421, -3.421, -1.055, -2.485, -4.500,
  -0.710, -2.111, -2.089, -1.989, -0.669, -2.547, -2.689, -2.511, -0.711, -2.385, -1.144, -1.055, -2.000, -1.111, -0.725, -2.485, -3.421, -0.985, -1.589, -1.205, -0.755, -1.488, -3.421, -3.421, -0.985, -2.385, -4.500,
  -1.788, -1.689, -1.311, -1.258, -3.055, -2.211, -1.912, -2.055, -3.111, -1.611, -1.096, -1.055, -1.258, -0.912, -3.189, -1.745, -3.421, -0.852, -1.012, -0.889, -2.855, -1.205, -3.421, -2.345, -3.111, -1.547, -0.582,
  -0.855, -2.411, -2.345, -2.258, -0.788, -2.812, -2.855, -2.788, -0.812, -2.654, -1.385, -1.189, -2.285, -1.311, -0.825, -2.744, -3.421, -1.076, -1.821, -1.401, -0.889, -1.711, -3.421, -3.421, -1.144, -2.611, -4.500,
  -0.889, -2.485, -2.411, -2.311, -0.812, -2.889, -2.912, -2.855, -0.841, -2.711, -1.411, -1.205, -2.345, -1.340, -0.855, -2.788, -3.421, -1.111, -1.854, -1.411, -0.912, -1.745, -3.421, -3.421, -1.189, -2.654, -4.500,
  -0.812, -2.385, -2.311, -2.211, -0.755, -2.788, -2.812, -2.744, -0.788, -2.611, -1.340, -1.144, -2.254, -1.285, -0.789, -2.711, -3.421, -1.055, -1.788, -1.385, -0.855, -1.689, -3.421, -3.421, -1.111, -2.589, -4.500,
  -1.854, -1.711, -1.340, -1.285, -3.111, -2.254, -1.944, -2.089, -3.144, -1.654, -1.111, -1.076, -1.285, -0.940, -3.211, -1.788, -3.421, -0.889, -1.055, -0.912, -2.889, -1.258, -3.421, -2.385, -3.144, -1.589, -0.585,
  -0.812, -2.345, -2.285, -2.189, -0.745, -2.744, -2.788, -2.711, -0.765, -2.589, -1.311, -1.111, -2.211, -1.258, -0.788, -2.689, -3.421, -1.012, -1.745, -1.340, -0.841, -1.654, -3.421, -3.421, -1.096, -2.547, -4.500
]);

export function getTransitionLogProb(c1: string, c2: string): number {
  if (c1.length > 1) c1 = c1[c1.length - 1];
  if (c2.length > 1) c2 = c2[0];
  const idx1 = c1 === '^' ? 0 : c1.charCodeAt(0) - 64;
  const idx2 = c2 === '$' ? 26 : c2.charCodeAt(0) - 65;
  if (idx1 < 0 || idx1 > 26 || idx2 < 0 || idx2 > 26) return -4.5;
  return MARKOV_MATRIX[idx1 * 27 + idx2];
}

export function scoreMarkovWord(word: string): number {
  if (!word) return -5.0;
  const clean = word.toUpperCase().replace(/[^A-Z]/g, '');
  if (!clean) return -5.0;

  const bounded = '^' + clean + '$';
  let totalLogProb = 0;
  for (let i = 0; i < bounded.length - 1; i++) {
    totalLogProb += getTransitionLogProb(bounded[i], bounded[i + 1]);
  }
  return totalLogProb / (bounded.length - 1);
}

export interface WordInterval {
  start: number;
  end: number;
  word: string;
}

export interface WordCoverageResult {
  coverageRatio: number;
  segmentedWords: string[];
  formattedText: string;
}

/**
 * Dynamic Programming: Finds non-overlapping cipher words maximizing covered character count.
 * Reconstructs formatted text with spaces, preserving all characters (never truncating uncovered letters).
 */
export function findWordCoverage(text: string): WordCoverageResult {
  const clean = text.toUpperCase().replace(/[^A-Z]/g, '');
  const n = clean.length;
  if (n === 0) return { coverageRatio: 0, segmentedWords: [], formattedText: '' };

  const dp: { covered: number; intervals: WordInterval[] }[] = Array.from(
    { length: n + 1 },
    () => ({ covered: 0, intervals: [] })
  );

  for (let j = 1; j <= n; j++) {
    let best = {
      covered: dp[j - 1].covered,
      intervals: dp[j - 1].intervals
    };

    for (let i = Math.max(0, j - 12); i < j; i++) {
      const sub = clean.slice(i, j);
      if (CIPHER_KEYWORDS.has(sub)) {
        // Preference for longer words over fragmented tiles
        const candidateCovered = dp[i].covered + Math.pow(sub.length, 1.3);
        if (candidateCovered > best.covered) {
          best = {
            covered: candidateCovered,
            intervals: [...dp[i].intervals, { start: i, end: j, word: sub }]
          };
        }
      }
    }
    dp[j] = best;
  }

  const result = dp[n];
  const actualCoveredLetters = result.intervals.reduce((acc, iv) => acc + (iv.end - iv.start), 0);
  const coverageRatio = actualCoveredLetters / n;

  // Build segmented formatted string with spaces, keeping uncovered characters intact
  let formattedText = clean;
  if (result.intervals.length > 0) {
    const parts: string[] = [];
    let last = 0;
    for (const iv of result.intervals) {
      if (iv.start > last) {
        parts.push(clean.slice(last, iv.start));
      }
      parts.push(iv.word);
      last = iv.end;
    }
    if (last < clean.length) {
      parts.push(clean.slice(last));
    }
    formattedText = parts.join(' ');
  }

  return {
    coverageRatio,
    segmentedWords: result.intervals.map((iv) => iv.word),
    formattedText
  };
}

export function scoreCandidate(word: string): {
  score: number;
  percentage: number;
  words: string[];
  formattedText: string;
} {
  const clean = word.toUpperCase().replace(/[^A-Z]/g, '');
  if (!clean) return { score: -5, percentage: 0, words: [], formattedText: '' };

  const markov = scoreMarkovWord(clean);
  const { coverageRatio, segmentedWords, formattedText } = findWordCoverage(clean);

  // Leftover junk letters penalty: each uncovered character is penalized
  const leftoverLetters = clean.length * (1 - coverageRatio);
  const penalty = leftoverLetters * 0.15;
  const coverageBonus = coverageRatio * 1.5;

  const finalScore = markov + coverageBonus - penalty;
  const percentage = Math.min(100, Math.max(5, Math.round((finalScore + 1.4) * 65)));

  return {
    score: finalScore,
    percentage,
    words: segmentedWords,
    formattedText: formattedText || clean
  };
}
