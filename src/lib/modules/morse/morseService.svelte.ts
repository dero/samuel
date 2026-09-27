/**
 * Morse Application Service (Module 01)
 * Runs heavy unspaced Morse solving in the shared DB worker, which also owns
 * the dictionary lexicon (built once per session, shared with Caesar scoring).
 */

import { dbClient } from '../../db/dbClient';
import type { MorseSolverWeights, BruteforceResult } from './morseSolver';

class MorseService {
  private pending = 0;

  isLoading = $state(false);

  /** Starts building the lexicon in the background so the first solve is fast. */
  warmUp(): void {
    dbClient.warmLexicon('morse');
  }

  /**
   * Solves unspaced Morse code against the lexicon in the DB worker.
   */
  async solveWithoutSpaces(
    code: string,
    maxResults = 50,
    customWeights?: Partial<MorseSolverWeights>
  ): Promise<BruteforceResult> {
    const clean = code.replace(/[^.-]/g, '');
    if (clean.length < 4) {
      return { candidates: [], totalFound: 0 };
    }

    this.pending++;
    this.isLoading = true;
    try {
      return await dbClient.morseSolve(clean, maxResults, customWeights);
    } catch (err: any) {
      throw new Error(
        err?.message === 'DB_NOT_INSTALLED'
          ? 'Chybí slovník – stáhněte ho v Nastavení.'
          : err?.message || 'Řešení selhalo'
      );
    } finally {
      this.pending--;
      this.isLoading = this.pending > 0;
    }
  }
}

export const morseService = new MorseService();
