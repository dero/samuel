import { REVERSE_MORSE_TABLE, MORSE_TABLE } from './morseData';
import { scoreCandidate } from '../../data/markovModel';
import { CIPHER_KEYWORDS } from '../../data/cipherKeywords';
import { ensureNgramLoaded, getNgramLogProb } from '../../data/ngramModel';

export interface PermutationResult {
  id: string;
  name: string;
  mapping: string; // e.g. ". -> -, - -> ."
  transformedMorse: string;
  decodedText: string;
  score: number; // 0 to 100
  isValid: boolean;
}

export interface BruteforceCandidate {
  text: string;
  spacedMorse: string;
  score: number;
}

export interface BruteforceResult {
  candidates: BruteforceCandidate[];
  totalFound: number;
}

/**
 * Normalizes user input morse string.
 * Converts bullets/stars to '.', dashes/underscores to '-', pipes/spaces to '/'.
 * Preserves double delimiters '//' as word separators.
 */
export function normalizeMorse(raw: string): string {
  if (!raw) return '';

  let normalized = raw
    .replace(/[•*·]/g, '.')
    .replace(/[—–_]/g, '-')
    .replace(/[|]/g, '/');

  // Convert multiple spaces or combinations of spaces and slashes
  normalized = normalized.replace(/\s*\/\s*\/\s*/g, ' // ');
  normalized = normalized.replace(/\s*\/\s*/g, ' / ');
  normalized = normalized.replace(/\s{2,}/g, ' // ');
  normalized = normalized.replace(/\s+/g, ' / ');

  // Clean up consecutive slashes: more than 2 slashes becomes 2
  normalized = normalized.replace(/\/(\s*\/)+/g, '//');

  return normalized.trim();
}

/**
 * Decodes normalized Morse code to readable uppercase text.
 */
export function decodeMorse(morse: string, parseCH = true): string {
  if (!morse.trim()) return '';

  // Words are separated by '//' or double spaces
  const words = morse.split(/\s*\/\/\s*|\s{2,}/);

  const decodedWords = words.map((word) => {
    // Letters are separated by single '/' or single space
    const letters = word.split(/[\/\s]+/).filter(Boolean);
    return letters
      .map((code) => {
        if (!parseCH && code === '----') return 'OOOO';
        return REVERSE_MORSE_TABLE[code] ?? '?';
      })
      .join('');
  });

  return decodedWords.join(' ');
}

/**
 * Encodes plain text to Morse code with '/' between letters and '//' between words.
 */
export function encodeMorse(text: string): string {
  if (!text.trim()) return '';

  const clean = text
    .toUpperCase()
    .replace(/Á/g, 'A')
    .replace(/Č/g, 'C')
    .replace(/Ď/g, 'D')
    .replace(/É|Ě/g, 'E')
    .replace(/Í/g, 'I')
    .replace(/Ň/g, 'N')
    .replace(/Ó/g, 'O')
    .replace(/Ř/g, 'R')
    .replace(/Š/g, 'S')
    .replace(/Ť/g, 'T')
    .replace(/Ú|Ů/g, 'U')
    .replace(/Ý/g, 'Y')
    .replace(/Ž/g, 'Z');

  const words = clean.split(/\s+/).filter(Boolean);

  return words
    .map((word) => {
      const letters: string[] = [];
      let i = 0;
      while (i < word.length) {
        if (word.slice(i, i + 2) === 'CH') {
          letters.push(MORSE_TABLE['CH'] ?? '----');
          i += 2;
        } else {
          const char = word[i];
          if (MORSE_TABLE[char]) {
            letters.push(MORSE_TABLE[char]);
          }
          i++;
        }
      }
      return letters.join(' / ');
    })
    .join(' // ');
}

/**
 * Calculates a plausibility score (0 to 100) for decoded Czech text using the precalculated Markov chain.
 */
export function scoreDecodedText(text: string): number {
  if (!text) return 0;

  const unknownCount = (text.match(/\?/g) || []).length;
  if (unknownCount > 0) {
    return Math.max(0, 30 - unknownCount * 10);
  }

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;

  let totalPercentage = 0;
  for (const w of words) {
    const { percentage } = scoreCandidate(w);
    totalPercentage += percentage;
  }

  return Math.round(totalPercentage / words.length);
}

/**
 * Generates all 6 symbol permutations (3!) plus reverse reading.
 */
export function getPermutations(morse: string): PermutationResult[] {
  if (!morse.trim()) return [];

  const perms = [
    {
      id: 'orig',
      name: 'Původní',
      mapping: '. ➔ . , - ➔ -',
      fn: (c: string) => c
    },
    {
      id: 'invert',
      name: 'Inverze (tečky ⇄ čárky)',
      mapping: '. ➔ - , - ➔ .',
      fn: (c: string) => (c === '.' ? '-' : c === '-' ? '.' : c)
    },
    {
      id: 'dot-sep',
      name: 'Prohození tečky a oddělovače',
      mapping: '. ➔ / , / ➔ .',
      fn: (c: string) => (c === '.' ? '/' : c === '/' ? '.' : c)
    },
    {
      id: 'dash-sep',
      name: 'Prohození čárky a oddělovače',
      mapping: '- ➔ / , / ➔ -',
      fn: (c: string) => (c === '-' ? '/' : c === '/' ? '-' : c)
    },
    {
      id: 'cycle-1',
      name: 'Cyklický posun 1',
      mapping: '. ➔ - ➔ / ➔ .',
      fn: (c: string) => (c === '.' ? '-' : c === '-' ? '/' : c === '/' ? '.' : c)
    },
    {
      id: 'cycle-2',
      name: 'Cyklický posun 2',
      mapping: '. ➔ / ➔ - ➔ .',
      fn: (c: string) => (c === '.' ? '/' : c === '-' ? '.' : c === '/' ? '-' : c)
    }
  ];

  const results: PermutationResult[] = perms.map((p) => {
    let transformed = '';
    for (let i = 0; i < morse.length; i++) {
      transformed += p.fn(morse[i]);
    }
    const decoded = decodeMorse(transformed);
    const score = scoreDecodedText(decoded);
    return {
      id: p.id,
      name: p.name,
      mapping: p.mapping,
      transformedMorse: transformed,
      decodedText: decoded,
      score,
      isValid: !decoded.includes('?') && decoded.trim().length > 0
    };
  });

  // Add Reverse
  const reversedMorse = morse
    .split(/\s*\/\s*/)
    .map((letter) => letter.split('').reverse().join(''))
    .reverse()
    .join(' / ');
  const reversedDecoded = decodeMorse(reversedMorse);

  results.push({
    id: 'reverse',
    name: 'Čtení pozpátku (Reverz)',
    mapping: 'Obrácený směr čtení',
    transformedMorse: reversedMorse,
    decodedText: reversedDecoded,
    score: scoreDecodedText(reversedDecoded),
    isValid: !reversedDecoded.includes('?') && reversedDecoded.trim().length > 0
  });

  return results;
}

export function wordToMorse(w: string): string {
  let m = '';
  let i = 0;
  while (i < w.length) {
    if (w.slice(i, i + 2) === 'CH') {
      m += MORSE_TABLE['CH'] || '----';
      i += 2;
    } else {
      const c = w[i];
      if (MORSE_TABLE[c]) m += MORSE_TABLE[c];
      i++;
    }
  }
  return m;
}

export interface MorseSolverWeights {
  lengthExponent: number;      // Power of word length in DAG edge weight, default 2.50
  cipherBoost: number;         // Boost for puzzle keywords & directions, default 1.65
  ruianBoost: number;          // Boost for RUIAN streets/places, default 1.05
  singleGrammarBoost: number;  // Boost for 1-letter grammatical prepositions, default 1.05
  freqWeight: number;          // Weight for corpus log-frequency, default 0.100
  wordCountPenalty: number;    // Penalty per additional word (Occam's razor), default 3.00
  nonCipherMalus: number;      // Malus on multi-word phrases according to ratio of non-cipher words, default 0.10
  beamWidth: number;           // Beam width in DAG (K_DAG), default 250
}

export const DEFAULT_SOLVER_WEIGHTS: MorseSolverWeights = {
  lengthExponent: 2.50,
  cipherBoost: 1.65,
  ruianBoost: 1.05,
  singleGrammarBoost: 1.05,
  freqWeight: 0.100,
  wordCountPenalty: 3.00,
  nonCipherMalus: 0.10,
  beamWidth: 250
};

export interface LexiconItem {
  word: string;
  morse: string;
  len: number;
  boost: number;
  freq: number;
  isCipher: boolean;
  isRuian: boolean;
}

export function buildLexiconItems(
  rawWords: { word: string; isCipher: boolean; isRuian: boolean; freq?: number }[],
  weights: MorseSolverWeights = DEFAULT_SOLVER_WEIGHTS
): LexiconItem[] {
  const items: LexiconItem[] = [];
  const singleGrammar = new Set(['A', 'I', 'O', 'U', 'K']);

  for (const item of rawWords) {
    const m = wordToMorse(item.word);
    if (m) {
      let boost = 1.0;
      if (item.isCipher || CIPHER_KEYWORDS.has(item.word)) {
        boost = singleGrammar.has(item.word) ? weights.singleGrammarBoost : weights.cipherBoost;
      } else if (item.isRuian) {
        boost = weights.ruianBoost;
      }
      items.push({
        word: item.word,
        morse: m,
        len: m.length,
        boost,
        freq: item.freq || 0,
        isCipher: item.isCipher,
        isRuian: item.isRuian
      });
    }
  }
  return items;
}

/**
 * Character-level Beam Search decoder using 4-gram language model with backoff.
 * Used for isolated words, unknown names (OOV), or when exact dictionary tiling is partial.
 */
function decodeMorseWith4gram(
  morseCode: string,
  prefixContext = '^',
  beamWidth = 300
): { text: string; spaced: string[]; logProb: number }[] {
  const n = morseCode.length;
  if (n === 0) return [];

  type State = { text: string; spaced: string[]; logProb: number; hist: string };
  const dp: State[][] = Array.from({ length: n + 1 }, () => []);
  const initHist = ('^^' + prefixContext).slice(-3);
  dp[0].push({ text: '', spaced: [], logProb: 0, hist: initHist });

  for (let pos = 0; pos < n; pos++) {
    if (dp[pos].length === 0) continue;
    if (dp[pos].length > beamWidth) {
      dp[pos].sort(
        (a, b) =>
          b.logProb / Math.max(1, b.text.length) -
          a.logProb / Math.max(1, a.text.length)
      );
      dp[pos].length = beamWidth;
    }

    const cur = dp[pos];
    for (const st of cur) {
      for (let len = 1; len <= 4; len++) {
        if (pos + len <= n) {
          const sub = morseCode.slice(pos, pos + len);
          const ch = REVERSE_MORSE_TABLE[sub];
          if (ch) {
            const lp = getNgramLogProb(st.hist, ch);
            dp[pos + len].push({
              text: st.text + ch,
              spaced: [...st.spaced, sub],
              logProb: st.logProb + lp,
              hist: (st.hist + ch).slice(-3)
            });
          }
        }
      }
    }
  }

  const results: { text: string; spaced: string[]; logProb: number }[] = [];
  for (const s of dp[n]) {
    const endLp = getNgramLogProb(s.hist, '$');
    const avgScore = (s.logProb + endLp) / Math.max(1, s.text.length);
    results.push({
      text: s.text,
      spaced: s.spaced,
      logProb: avgScore
    });
  }

  results.sort((a, b) => b.logProb - a.logProb);
  return results.slice(0, 10);
}

/**
 * Auto-bruteforce solver for Morse code without spaces (no delimiters).
 * Combines:
 * 1. Word-level DAG search across SQLite lexicon (cipher keywords, general corpus, RUIAN streets)
 *    with superlinear Morse length scoring and frequency weighting.
 * 2. Resilient partial tiling (islands) with 4-gram character decoding for OOV words/street names.
 * 3. 4-gram character beam search fallback for arbitrary unknown codes.
 */
export async function solveMorseWithoutSpaces(
  code: string,
  maxResults = 50,
  customWeights?: Partial<MorseSolverWeights>,
  lexicon: LexiconItem[] = [],
  prefilteredMatching?: LexiconItem[]
): Promise<BruteforceResult> {
  const weights: MorseSolverWeights = { ...DEFAULT_SOLVER_WEIGHTS, ...customWeights };

  // Strip whitespace and slashes
  const clean = code.replace(/[^.-]/g, '');
  if (clean.length < 4) return { candidates: [], totalFound: 0 };

  const n = clean.length;
  const candidatesMap = new Map<
    string,
    { text: string; spacedMorse: string; score: number; rawScore: number }
  >();

  // 1. Filter dictionary words present as substrings in input
  const matching = prefilteredMatching ?? lexicon.filter((m) => clean.includes(m.morse));

  type Path = { score: number; words: string[]; cipherCount: number };
  const dpWord: Path[][] = Array.from({ length: n + 1 }, () => []);
  dpWord[0].push({ score: 0, words: [], cipherCount: 0 });

  const singleGrammar = new Set(['A', 'I', 'O', 'U', 'K']);
  const K_DAG = weights.beamWidth || 250;
  for (let i = 0; i < n; i++) {
    if (dpWord[i].length === 0) continue;
    if (dpWord[i].length > K_DAG) {
      dpWord[i].sort((a, b) => b.score - a.score);
      dpWord[i].length = K_DAG;
    }

    const cur = dpWord[i];
    for (const m of matching) {
      if (i + m.len <= n && clean.startsWith(m.morse, i)) {
        let boost = 1.0;
        if (m.isCipher) {
          boost = singleGrammar.has(m.word) ? weights.singleGrammarBoost : weights.cipherBoost;
        } else if (m.isRuian) {
          boost = weights.ruianBoost;
        }
        if (weights.freqWeight > 0 && m.freq > 0) {
          boost *= (1 + weights.freqWeight * Math.log10(m.freq + 1));
        }
        const wScore = Math.pow(m.len, weights.lengthExponent) * boost;
        const isKnown = (m.isCipher || m.isRuian) ? 1 : 0;

        for (const p of cur) {
          dpWord[i + m.len].push({
            score: p.score + wScore,
            words: [...p.words, m.word],
            cipherCount: p.cipherCount + isKnown
          });
        }
      }
    }
  }

  // 1. Deduct wordCountPenalty: prefer fewer words
  if (weights.wordCountPenalty > 0) {
    for (const p of dpWord[n]) {
      p.score -= weights.wordCountPenalty * Math.max(0, p.words.length - 1);
    }
  }

  // 2. Deduct nonCipherMalus: penalize multi-word phrases dominated by non-cipher filler words
  if (weights.nonCipherMalus > 0) {
    for (const p of dpWord[n]) {
      if (p.words.length > 1) {
        const nonCipherRatio = (p.words.length - p.cipherCount) / p.words.length;
        p.score *= Math.max(0.1, 1.0 - weights.nonCipherMalus * nonCipherRatio);
      }
    }
  }

  dpWord[n].sort((a, b) => b.score - a.score);

  const topRawScore = dpWord[n].length > 0 ? dpWord[n][0].score : 1;

  for (const p of dpWord[n]) {
    const formatted = p.words.join(' ');
    const spaced = p.words
      .map((w) =>
        w
          .split('')
          .map((c) => MORSE_TABLE[c] || '')
          .filter(Boolean)
          .join(' / ')
      )
      .join(' // ');

    const pct = Math.min(100, Math.max(15, Math.round((p.score / topRawScore) * 100)));

    if (!candidatesMap.has(formatted) || candidatesMap.get(formatted)!.rawScore < p.score) {
      candidatesMap.set(formatted, {
        text: formatted,
        spacedMorse: spaced,
        score: pct,
        rawScore: p.score
      });
    }
  }

  // 2. Partial Tiling (Islands) Fallback: When full tiling finds fewer than 5 candidates
  if (candidatesMap.size < 5) {
    let bestReach = 0;
    let bestPath: Path | null = null;
    for (let i = n - 1; i > 0; i--) {
      if (dpWord[i].length > 0) {
        dpWord[i].sort((a, b) => b.score - a.score);
        bestReach = i;
        bestPath = dpWord[i][0];
        break;
      }
    }

    if (bestPath && bestPath.words.length > 0 && bestReach >= 6) {
      const recognized = bestPath.words.join(' ');
      const lastWord = bestPath.words[bestPath.words.length - 1];
      const unsolvedMorse = clean.slice(bestReach);
      const recognizedSpaced = bestPath.words
        .map((w) =>
          w
            .split('')
            .map((c) => MORSE_TABLE[c] || '')
            .filter(Boolean)
            .join(' / ')
        )
        .join(' // ');

      const suffixCands = decodeMorseWith4gram(unsolvedMorse, lastWord);
      for (const sc of suffixCands) {
        const formatted = `${recognized} [${sc.text}]`;
        const spaced = `${recognizedSpaced} // [ ${sc.spaced.join(' / ')} ]`;
        const pseudoScore = bestPath.score + Math.pow(unsolvedMorse.length, 1.8) * Math.exp(sc.logProb);
        const pct = Math.min(85, Math.max(10, Math.round((pseudoScore / topRawScore) * 100)));

        if (!candidatesMap.has(formatted)) {
          candidatesMap.set(formatted, {
            text: formatted,
            spacedMorse: spaced,
            score: pct,
            rawScore: pseudoScore
          });
        }
      }
    }
  }

  // 3. Pure 4-gram Beam Search Fallback: When still fewer than 5 candidates
  if (candidatesMap.size < 5) {
    const full4gramCands = decodeMorseWith4gram(clean, '^');
    for (const s of full4gramCands) {
      const evaluated = scoreCandidate(s.text);
      const formatted = evaluated.formattedText || s.text;
      if (!candidatesMap.has(formatted)) {
        candidatesMap.set(formatted, {
          text: formatted,
          spacedMorse: s.spaced.join(' / '),
          score: evaluated.percentage,
          rawScore: evaluated.score
        });
      }
    }
  }

  const allCandidates = Array.from(candidatesMap.values());
  allCandidates.sort((a, b) => b.rawScore - a.rawScore);

  return {
    candidates: allCandidates.slice(0, maxResults),
    totalFound: allCandidates.length
  };
}
