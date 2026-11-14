import { tokenizeText } from '../../utils/cipher';

export interface CharCountItem {
  char: string;
  count: number;
  alphabetIndex: number;
}

export interface OutsideCharItem {
  char: string;
  count: number;
}

export interface NgramItem {
  text: string;
  count: number;
}

export interface WordLengthItem {
  length: number;
  count: number;
}

export interface SentenceStatItem {
  index: number;
  wordCount: number;
  charCount: number;
}

export interface VowelConsonantStats {
  vowels: number;
  consonants: number;
  letterTotal: number;
  vowelPct: number;
  consonantPct: number;
}

export interface FrequencyAnalysisOptions {
  crossWordNgrams?: boolean;
}

export interface FrequencyOverviewResult {
  charCounts: CharCountItem[];
  outsideChars: OutsideCharItem[];
  totalAlphabetChars: number;
  uniqueAlphabetChars: number;
  totalOutsideChars: number;
  vowelConsonant: VowelConsonantStats;
  doubles: NgramItem[];
  bigrams: NgramItem[];
  trigrams: NgramItem[];
  wordLengths: WordLengthItem[];
  totalWords: number;
  sentences: SentenceStatItem[];
}

const VOWELS = new Set([
  'A', 'Á', 'Ä', 'E', 'É', 'Ě', 'I', 'Í', 'O', 'Ó', 'Ö', 'Ô', 'U', 'Ú', 'Ů', 'Ü', 'Y', 'Ý', 'Ÿ'
]);

const UNICODE_LETTER_RE = /\p{L}/u;
const SENTENCE_END_RE = /[.!?]/;
const DIGIT_RE = /\d/;

function isVowelSymbol(symbol: string): boolean {
  return VOWELS.has(symbol.toUpperCase());
}

function isLetterSymbol(symbol: string): boolean {
  return UNICODE_LETTER_RE.test(symbol);
}

function countMapToSortedItems(map: Map<string, number>): NgramItem[] {
  return [...map.entries()]
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.text.localeCompare(b.text, 'cs')));
}

function addNgrams(tokens: string[], size: number, target: Map<string, number>): void {
  if (tokens.length < size) return;
  for (let i = 0; i <= tokens.length - size; i++) {
    const key = tokens.slice(i, i + size).join('');
    target.set(key, (target.get(key) ?? 0) + 1);
  }
}

/**
 * Computes an overview of characters, vowels/consonants, doubled letters,
 * repeated bigrams/trigrams, word lengths and sentence lengths using the
 * selected alphabet's tokenization rules.
 */
export function analyzeTextOverview(
  rawText: string,
  alphabetLetters: string[],
  options: FrequencyAnalysisOptions = {}
): FrequencyOverviewResult {
  const crossWordNgrams = options.crossWordNgrams ?? false;
  const tokens = tokenizeText(rawText, alphabetLetters);

  const alphabetCounts = new Map<string, number>();
  const alphabetIndexMap = new Map<string, number>();
  alphabetLetters.forEach((letter, idx) => {
    if (!alphabetCounts.has(letter)) {
      alphabetCounts.set(letter, 0);
      alphabetIndexMap.set(letter, idx);
    }
  });

  const outsideCounts = new Map<string, number>();
  let totalAlphabetChars = 0;
  let totalOutsideChars = 0;
  let vowels = 0;
  let consonants = 0;

  // Words and sentence stats collected in a single linear pass
  const words: string[][] = [];
  let currentWord: string[] = [];

  const sentences: SentenceStatItem[] = [];
  let sentenceWords = 0;
  let sentenceChars = 0;

  const flushWord = () => {
    if (currentWord.length > 0) {
      words.push(currentWord);
      sentenceWords++;
      sentenceChars += currentWord.length;
      currentWord = [];
    }
  };

  const flushSentence = () => {
    flushWord();
    if (sentenceChars > 0 || sentenceWords > 0) {
      sentences.push({
        index: sentences.length + 1,
        wordCount: sentenceWords,
        charCount: sentenceChars
      });
      sentenceWords = 0;
      sentenceChars = 0;
    }
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.letterIndex !== null) {
      const symbol = alphabetLetters[token.letterIndex];
      alphabetCounts.set(symbol, (alphabetCounts.get(symbol) ?? 0) + 1);
      totalAlphabetChars++;

      if (isVowelSymbol(symbol)) {
        vowels++;
      } else if (isLetterSymbol(symbol)) {
        consonants++;
      }

      currentWord.push(symbol);
      continue;
    }

    // Non-alphabet token ends any active word
    flushWord();

    if (!/\s/.test(token.raw)) {
      const outsideKey = token.isIncompatibleLetter ? token.raw.toUpperCase() : token.raw;
      outsideCounts.set(outsideKey, (outsideCounts.get(outsideKey) ?? 0) + 1);
      totalOutsideChars++;
    }

    if (SENTENCE_END_RE.test(token.raw)) {
      // Avoid splitting decimal numbers like 3.14 on '.'
      const prevRaw = i > 0 ? tokens[i - 1].raw : '';
      const nextRaw = i + 1 < tokens.length ? tokens[i + 1].raw : '';
      const isDecimalDot = token.raw === '.' && DIGIT_RE.test(prevRaw) && DIGIT_RE.test(nextRaw);
      if (!isDecimalDot) {
        flushSentence();
      }
    }
  }

  flushSentence();

  const charCounts: CharCountItem[] = [...alphabetCounts.entries()].map(([char, count]) => ({
    char,
    count,
    alphabetIndex: alphabetIndexMap.get(char) ?? 0
  }));

  const uniqueAlphabetChars = charCounts.filter((c) => c.count > 0).length;

  const outsideChars: OutsideCharItem[] = [...outsideCounts.entries()]
    .map(([char, count]) => ({ char, count }))
    .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.char.localeCompare(b.char, 'cs')));

  const letterTotal = vowels + consonants;
  const vowelPct = letterTotal > 0 ? Math.round((vowels / letterTotal) * 100) : 0;
  const consonantPct = letterTotal > 0 ? 100 - vowelPct : 0;

  // Word length distribution
  const wordLengthMap = new Map<number, number>();
  for (const word of words) {
    wordLengthMap.set(word.length, (wordLengthMap.get(word.length) ?? 0) + 1);
  }
  const wordLengths: WordLengthItem[] = [...wordLengthMap.entries()]
    .map(([length, count]) => ({ length, count }))
    .sort((a, b) => a.length - b.length);

  // Doubled letters, bigrams and trigrams
  const doubleMap = new Map<string, number>();
  const bigramMap = new Map<string, number>();
  const trigramMap = new Map<string, number>();

  if (crossWordNgrams) {
    const stream = words.flat();
    for (let i = 0; i < stream.length - 1; i++) {
      if (stream[i] === stream[i + 1]) {
        const pair = stream[i] + stream[i];
        doubleMap.set(pair, (doubleMap.get(pair) ?? 0) + 1);
      }
    }
    addNgrams(stream, 2, bigramMap);
    addNgrams(stream, 3, trigramMap);
  } else {
    for (const word of words) {
      for (let i = 0; i < word.length - 1; i++) {
        if (word[i] === word[i + 1]) {
          const pair = word[i] + word[i];
          doubleMap.set(pair, (doubleMap.get(pair) ?? 0) + 1);
        }
      }
      addNgrams(word, 2, bigramMap);
      addNgrams(word, 3, trigramMap);
    }
  }

  const doubles = countMapToSortedItems(doubleMap);
  const bigrams = countMapToSortedItems(bigramMap).filter((item) => item.count >= 2);
  const trigrams = countMapToSortedItems(trigramMap).filter((item) => item.count >= 2);

  return {
    charCounts,
    outsideChars,
    totalAlphabetChars,
    uniqueAlphabetChars,
    totalOutsideChars,
    vowelConsonant: {
      vowels,
      consonants,
      letterTotal,
      vowelPct,
      consonantPct
    },
    doubles,
    bigrams,
    trigrams,
    wordLengths,
    totalWords: words.length,
    sentences
  };
}
