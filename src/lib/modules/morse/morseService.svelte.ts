/**
 * Morse Application Service (Module 01)
 * Manages background Web Worker execution for heavy Morse unspaced solving.
 *
 * The Morse compute worker itself no longer touches the database - it
 * receives the shared lexicon rows (fetched once via the shared DB worker
 * client, `dbClient`/`getLexiconWords()`) through a 'setLexicon' postMessage.
 */

import MorseWorker from './morse.worker.ts?worker';
import { getLexiconWords } from '../../db/database.svelte';
import type {
  MorseSolverWeights,
  BruteforceResult,
  BruteforceCandidate
} from './morseSolver';

class MorseService {
  private worker: Worker | null = null;
  private reqId = 0;
  private pendingCallbacks = new Map<
    number,
    { resolve: (res: any) => void; reject: (err: any) => void }
  >();
  private lexiconPromise: Promise<void> | null = null;

  isLoading = $state(false);

  private initWorker(): Worker | null {
    if (typeof window === 'undefined') return null;
    if (this.worker) return this.worker;

    try {
      this.worker = new MorseWorker();
      this.worker.onmessage = (e: MessageEvent) => {
        const { id, type, candidates, totalFound, error } = e.data;
        if (this.pendingCallbacks.has(id)) {
          const cb = this.pendingCallbacks.get(id)!;
          this.pendingCallbacks.delete(id);
          this.isLoading = this.pendingCallbacks.size > 0;

          if (type === 'result' || type === 'lexicon_ready') {
            cb.resolve({ candidates: candidates || [], totalFound: totalFound || 0 });
          } else if (type === 'error') {
            cb.reject(new Error(error || 'Worker solve failed'));
          }
        }
      };

      this.worker.onerror = (err) => {
        console.error('Morse worker error:', err);
        this.isLoading = false;
      };
    } catch (err) {
      console.warn('Failed to initialize Morse worker:', err);
      this.worker = null;
    }
    return this.worker;
  }

  /**
   * Fetches the shared lexicon (once) from the DB worker and hands it to the
   * Morse compute worker. Subsequent calls reuse the same in-flight/settled
   * promise so the lexicon is only loaded and transferred once per session.
   */
  private ensureLexiconLoaded(worker: Worker): Promise<void> {
    if (this.lexiconPromise) return this.lexiconPromise;

    this.lexiconPromise = (async () => {
      let words;
      try {
        words = await getLexiconWords();
      } catch (err: any) {
        throw new Error(
          err?.message === 'DB_NOT_INSTALLED'
            ? 'Slovníková databáze není lokálně stažena. Stáhněte ji v Nastavení.'
            : err?.message || 'Nepodařilo se načíst slovník'
        );
      }

      await new Promise<void>((resolve, reject) => {
        const id = ++this.reqId;
        this.pendingCallbacks.set(id, { resolve: () => resolve(), reject });
        worker.postMessage({ id, type: 'setLexicon', words });
      });
    })();

    // Allow retrying after a failure (e.g. DB downloaded later).
    this.lexiconPromise.catch(() => {
      this.lexiconPromise = null;
    });

    return this.lexiconPromise;
  }

  /**
   * Solves unspaced Morse code against the lexicon in a background worker.
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

    const worker = this.initWorker();
    if (!worker) {
      return { candidates: [], totalFound: 0 };
    }

    this.isLoading = true;
    try {
      await this.ensureLexiconLoaded(worker);
    } catch (err) {
      this.isLoading = false;
      throw err;
    }

    const id = ++this.reqId;

    return new Promise((resolve, reject) => {
      this.pendingCallbacks.set(id, { resolve, reject });
      worker.postMessage({
        id,
        type: 'solve',
        code: clean,
        maxResults,
        weights: customWeights
      });
    });
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.pendingCallbacks.clear();
      this.isLoading = false;
      this.lexiconPromise = null;
    }
  }
}

export const morseService = new MorseService();
