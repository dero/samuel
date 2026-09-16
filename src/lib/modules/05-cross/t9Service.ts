/**
 * T9 Service managing background Web Worker execution.
 */

import T9Worker from './t9.worker.ts?worker';
import { getFallbackT9Word } from './t9Solver';

export interface T9Result {
  digits: string;
  candidates: string[];
}

class T9Service {
  private worker: Worker | null = null;
  private reqId = 0;
  private pendingCallbacks = new Map<number, (res: T9Result) => void>();

  private initWorker(): Worker | null {
    if (typeof window === 'undefined') return null;
    if (this.worker) return this.worker;

    try {
      this.worker = new T9Worker();
      this.worker.onmessage = (e: MessageEvent) => {
        const { id, type, digits, candidates } = e.data;
        if (type === 'result' && this.pendingCallbacks.has(id)) {
          const cb = this.pendingCallbacks.get(id);
          this.pendingCallbacks.delete(id);
          cb?.({ digits, candidates });
        }
      };
      this.worker.postMessage({ id: 0, type: 'init' });
    } catch (err) {
      console.warn('Failed to initialize T9 worker:', err);
      this.worker = null;
    }
    return this.worker;
  }

  public query(digits: string, limit: number = 12): Promise<T9Result> {
    if (!digits) {
      return Promise.resolve({ digits: '', candidates: [] });
    }

    const worker = this.initWorker();
    if (!worker) {
      return Promise.resolve({ digits, candidates: [getFallbackT9Word(digits)] });
    }

    const id = ++this.reqId;
    return new Promise((resolve) => {
      this.pendingCallbacks.set(id, resolve);
      worker.postMessage({ id, type: 'query', digits, limit });
    });
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.pendingCallbacks.clear();
    }
  }
}

export const t9Service = new T9Service();
