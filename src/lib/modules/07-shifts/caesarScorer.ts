import { scoreMarkovWord } from '../../data/markovModel';
import { CIPHER_KEYWORDS } from '../../data/cipherKeywords';

export interface CaesarLexiconEntry {
  freq: number;
  isCipher: boolean;
  isRuian: boolean;
}

export type CaesarLexicon = Map<string, CaesarLexiconEntry>;

export interface CaesarScorerWeights {
  minWordLength: number; // minimum word length to count (default 3)
  lengthExponent: number; // exponent for word length weighting (default 2.0)
  freqWeight: number; // weight for log10(1 + freq) (default 0.35)
  cipherBonus: number; // multiplier for isCipher words (default 1.5)
  ruianBonus: number; // multiplier for isRuian words (default 1.2)
  markovWeight: number; // weight for Markov transitions (default 0.6)
  noisePenalty: number; // penalty per uncovered character (default 0.04)
  contrastWeight: number; // bonus based on margin over runner-up (default 15)
}

export const DEFAULT_CAESAR_WEIGHTS: CaesarScorerWeights = {
  minWordLength: 3,
  lengthExponent: 2.0,
  freqWeight: 0.35,
  cipherBonus: 1.5,
  ruianBonus: 1.2,
  markovWeight: 0.6,
  noisePenalty: 0.04,
  contrastWeight: 15
};

export interface IdentifiedWord {
  word: string;
  start: number;
  end: number;
  length: number;
  freq: number;
  isCipher: boolean;
  score: number;
}

export interface CaesarCandidateRawScore {
  cleanText: string;
  bestWord: string;
  bestWordLen: number;
  matchedWords: IdentifiedWord[];
  coveredCount: number;
  coverageRatio: number;
  wordScore: number;
  markovScore: number;
  rawPlausibility: number;
  percentage: number;
}

/**
 * Builds a fast lookup Map from raw lexicon rows.
 */
export function buildCaesarLexicon(
  rawWords: Array<{ word: string; freq: number; isCipher: boolean; isRuian: boolean }>
): CaesarLexicon {
  const map: CaesarLexicon = new Map();
  for (const item of rawWords) {
    const w = item.word.toUpperCase();
    if (w.length >= 2) {
      map.set(w, {
        freq: item.freq || 0,
        isCipher: Boolean(item.isCipher),
        isRuian: Boolean(item.isRuian)
      });
    }
  }
  return map;
}

/**
 * Fallback lexicon built from CIPHER_KEYWORDS when words.db is not yet loaded.
 */
let fallbackLexicon: CaesarLexicon | null = null;
export function getFallbackCaesarLexicon(): CaesarLexicon {
  if (!fallbackLexicon) {
    fallbackLexicon = new Map();
    for (const w of CIPHER_KEYWORDS) {
      fallbackLexicon.set(w, { freq: 1000, isCipher: true, isRuian: false });
    }
  }
  return fallbackLexicon;
}

/**
 * Evaluates an individual shifted text against the lexicon.
 */
export function evaluateCandidateRaw(
  text: string,
  lexicon: CaesarLexicon,
  weights: CaesarScorerWeights = DEFAULT_CAESAR_WEIGHTS
): CaesarCandidateRawScore {
  const clean = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  const n = clean.length;

  if (n === 0) {
    return {
      cleanText: '',
      bestWord: '',
      bestWordLen: 0,
      matchedWords: [],
      coveredCount: 0,
      coverageRatio: 0,
      wordScore: 0,
      markovScore: -5,
      rawPlausibility: 0,
      percentage: 5
    };
  }

  // 1. Find all non-overlapping words maximizing wordScore (dynamic programming)
  // Substring search from max length down to minWordLength
  const maxLen = Math.min(15, n);
  const foundByEnd: Array<IdentifiedWord[]> = Array.from({ length: n + 1 }, () => []);

  // Pre-find all valid dictionary matches
  for (let len = weights.minWordLength; len <= maxLen; len++) {
    for (let i = 0; i <= n - len; i++) {
      const sub = clean.slice(i, i + len);
      const entry = lexicon.get(sub);
      if (entry) {
        const logFreq = Math.log10(1 + entry.freq);
        let s = Math.pow(len, weights.lengthExponent) * (1 + logFreq * weights.freqWeight);
        if (entry.isCipher) s *= weights.cipherBonus;
        else if (entry.isRuian) s *= weights.ruianBonus;

        foundByEnd[i + len].push({
          word: sub,
          start: i,
          end: i + len,
          length: len,
          freq: entry.freq,
          isCipher: entry.isCipher,
          score: s
        });
      }
    }
  }

  // DP to find best non-overlapping tile combination
  const dp: { score: number; words: IdentifiedWord[] }[] = Array.from(
    { length: n + 1 },
    () => ({ score: 0, words: [] })
  );

  for (let j = 1; j <= n; j++) {
    // Option 1: skip character j - 1
    let best = {
      score: dp[j - 1].score,
      words: dp[j - 1].words
    };

    // Option 2: use word ending at j
    for (const w of foundByEnd[j]) {
      const candScore = dp[w.start].score + w.score;
      if (candScore > best.score) {
        best = {
          score: candScore,
          words: [...dp[w.start].words, w]
        };
      }
    }

    dp[j] = best;
  }

  const matchedWords = dp[n].words;
  const wordScore = dp[n].score;

  let bestWord = '';
  let bestWordLen = 0;
  const coveredSet = new Set<number>();

  for (const w of matchedWords) {
    if (w.length > bestWordLen) {
      bestWordLen = w.length;
      bestWord = w.word;
    }
    for (let k = w.start; k < w.end; k++) {
      coveredSet.add(k);
    }
  }

  const coveredCount = coveredSet.size;
  const coverageRatio = coveredCount / n;
  const markovScore = scoreMarkovWord(clean);

  // Raw plausibility combining word score, coverage, and gentle noise penalty
  const uncoveredCount = n - coveredCount;
  const noiseCost = uncoveredCount * weights.noisePenalty;
  const rawPlausibility = wordScore * (1 + coverageRatio * 0.5) - noiseCost;

  // Base percentage calculation with length guarantees and coverage scaling
  let basePct: number;

  if (bestWordLen >= 6) {
    // 6+ letters word (e.g. KOSTEL, ROZCESTÍ) -> highly confident
    basePct = Math.max(65, Math.round(65 + coverageRatio * 35));
  } else if (bestWordLen === 5) {
    // 5 letters word (e.g. STROM, POKLAD) -> guaranteed yellow/yellow-green (50–85%)
    basePct = Math.max(50, Math.round(50 + coverageRatio * 35));
  } else if (bestWordLen === 4) {
    // 4 letters word: if high coverage (e.g. short cipher like MOST -> 100%), yellow!
    // If low coverage (e.g. 4 letters in 25 letter noise), stays orange/red (< 40%).
    basePct = Math.round(15 + coverageRatio * 50);
  } else if (bestWordLen === 3) {
    // 3 letters word -> 10–35%
    basePct = Math.round(10 + coverageRatio * 30);
  } else {
    // No words found >= 3 letters -> purely Markov dependent (5–25%, red)
    basePct = Math.min(25, Math.max(5, Math.round((markovScore + 2.5) * 20)));
  }

  return {
    cleanText: clean,
    bestWord,
    bestWordLen,
    matchedWords,
    coveredCount,
    coverageRatio,
    wordScore,
    markovScore,
    rawPlausibility,
    percentage: Math.min(100, Math.max(5, basePct))
  };
}

/**
 * Scores all N-1 shifts of a ciphertext jointly, applying contrastive margin normalization.
 */
export function scoreAllCaesarCandidates(
  shiftedTexts: string[],
  lexicon: CaesarLexicon,
  weights: CaesarScorerWeights = DEFAULT_CAESAR_WEIGHTS
): Array<CaesarCandidateRawScore & { shift: number; isBest: boolean }> {
  const evaluated = shiftedTexts.map((text, idx) => ({
    shift: idx + 1,
    ...evaluateCandidateRaw(text, lexicon, weights),
    isBest: false
  }));

  if (evaluated.length === 0) return [];

  // Find best candidate strictly by percentage descending, then rawPlausibility, then bestWordLen
  // This guarantees that the top match (Hero card) always has the best (or equal) color indicator compared to any other shift.
  let bestIdx = 0;

  for (let i = 1; i < evaluated.length; i++) {
    const cur = evaluated[i];
    const best = evaluated[bestIdx];
    if (
      cur.percentage > best.percentage ||
      (cur.percentage === best.percentage && cur.rawPlausibility > best.rawPlausibility) ||
      (cur.percentage === best.percentage &&
        cur.rawPlausibility === best.rawPlausibility &&
        cur.bestWordLen > best.bestWordLen)
    ) {
      bestIdx = i;
    }
  }

  evaluated[bestIdx].isBest = true;

  // Apply differential contrast boost:
  // If the best candidate is significantly ahead of the second best, boost its confidence
  const sortedPcts = [...evaluated].map((e) => e.percentage).sort((a, b) => b - a);
  const runnerUpPct = sortedPcts[1] ?? 0;
  const margin = evaluated[bestIdx].percentage - runnerUpPct;

  if (margin > 0 && evaluated[bestIdx].bestWordLen >= 4) {
    const boost = Math.min(15, Math.round(margin * 0.5));
    evaluated[bestIdx].percentage = Math.min(100, evaluated[bestIdx].percentage + boost);
  }

  return evaluated;
}
