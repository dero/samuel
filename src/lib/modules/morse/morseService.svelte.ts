/**
 * Morse Application Service (Module 01)
 * Manages background Web Worker execution for heavy Morse unspaced solving.
 */

import MorseWorker from './morse.worker.ts?worker';
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
    { resolve: (res: BruteforceResult) => void; reject: (err: any) => void }
  >();

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

          if (type === 'result') {
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

      this.worker.postMessage({ id: 0, type: 'init' });
    } catch (err) {
      console.warn('Failed to initialize Morse worker:', err);
      this.worker = null;
    }
    return this.worker;
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

    const id = ++this.reqId;
    this.isLoading = true;

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
    }
  }
}

export const morseService = new MorseService();
