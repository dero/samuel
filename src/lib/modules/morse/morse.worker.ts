/**
 * Web Worker for Morse Unspaced Solver (Bruteforce & DAG Beam Search)
 * Runs heavy graph decoding in a background thread.
 *
 * This worker no longer opens its own copy of words.db (that used to mean a
 * second full sql.js instance, on top of the main-thread and Words-module
 * copies). Instead, morseService.svelte.ts fetches the shared lexicon rows
 * once from the single shared DB worker (via dbClient.getLexiconWords()) and
 * posts them here with a 'setLexicon' message; this worker only builds the
 * morse-code-annotated LexiconItem[] and runs the solver.
 */

import {
  buildLexiconItems,
  solveMorseWithoutSpaces,
  type LexiconItem,
  type MorseSolverWeights
} from './morseSolver';
import type { RawLexiconWord } from '../../db/lexiconDb';

let cachedLexicon: LexiconItem[] | null = null;

self.onmessage = async (e: MessageEvent) => {
  const { id, type, code, maxResults = 50, weights, words } = e.data;

  if (type === 'setLexicon') {
    try {
      cachedLexicon = buildLexiconItems(words as RawLexiconWord[]);
      self.postMessage({ id, type: 'lexicon_ready' });
    } catch (err: any) {
      self.postMessage({ id, type: 'error', error: err?.message || String(err) });
    }
    return;
  }

  if (type === 'solve') {
    try {
      if (!cachedLexicon) {
        throw new Error('Lexikon nebyl načten. Zkuste to prosím znovu.');
      }
      const result = await solveMorseWithoutSpaces(code, maxResults, weights as Partial<MorseSolverWeights>, cachedLexicon);
      self.postMessage({
        id,
        type: 'result',
        candidates: result.candidates,
        totalFound: result.totalFound
      });
    } catch (err: any) {
      console.error('Morse worker solve error:', err);
      self.postMessage({
        id,
        type: 'error',
        error: err?.message || String(err),
        candidates: [],
        totalFound: 0
      });
    }
  }
};
