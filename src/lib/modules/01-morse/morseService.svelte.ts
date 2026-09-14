/**
 * Morse Application Service (Module 01)
 * Manages reactive integration with Samuel database, caching, and version invalidation.
 * Pure algorithmic solving logic is delegated to morseSolver.ts.
 */

import { dbState, getLexiconWords } from '../../db/database.svelte';
import { ensureNgramLoaded } from '../../data/ngramModel';
import {
  buildLexiconItems,
  solveMorseWithoutSpaces,
  DEFAULT_SOLVER_WEIGHTS,
  type LexiconItem,
  type MorseSolverWeights,
  type BruteforceResult
} from './morseSolver';

class MorseService {
  private cachedLexicon: LexiconItem[] | null = null;
  private cachedDbHash: string | null = null;
  private loadPromise: Promise<LexiconItem[]> | null = null;

  isLoading = $state(false);

  get isLoaded(): boolean {
    return this.cachedLexicon !== null && this.cachedDbHash === (dbState.meta?.dbHash ?? null);
  }

  get lexiconSize(): number {
    return this.cachedLexicon?.length ?? 0;
  }

  /**
   * Ensures lexicon items and n-gram language model are loaded into RAM.
   * Revalidates automatically if SQLite dbHash changed (e.g. after DB update).
   */
  async ensureLexiconLoaded(): Promise<LexiconItem[]> {
    const currentDbHash = dbState.meta?.dbHash ?? null;

    if (this.cachedLexicon && this.cachedDbHash === currentDbHash) {
      return this.cachedLexicon;
    }

    if (this.cachedDbHash !== currentDbHash) {
      this.cachedLexicon = null;
      this.loadPromise = null;
      this.cachedDbHash = currentDbHash;
    }

    if (!this.loadPromise) {
      this.isLoading = true;
      this.loadPromise = (async () => {
        try {
          const [rawWords] = await Promise.all([
            getLexiconWords(),
            ensureNgramLoaded()
          ]);
          const items = buildLexiconItems(rawWords);
          this.cachedLexicon = items;
          return items;
        } finally {
          this.isLoading = false;
        }
      })();
    }

    return this.loadPromise;
  }

  /**
   * Solves unspaced Morse code against the cached lexicon.
   */
  async solveWithoutSpaces(
    code: string,
    maxResults = 50,
    customWeights?: Partial<MorseSolverWeights>
  ): Promise<BruteforceResult> {
    const weights: MorseSolverWeights = { ...DEFAULT_SOLVER_WEIGHTS, ...customWeights };
    const lexicon = await this.ensureLexiconLoaded();
    return solveMorseWithoutSpaces(code, maxResults, weights, lexicon);
  }
}

export const morseService = new MorseService();
