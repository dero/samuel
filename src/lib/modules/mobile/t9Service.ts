/**
 * T9 Service - delegates predictive lookups to the shared DB worker
 * (dbClient), which already hosts the words.db dictionary. T9 used to spin up
 * its own dedicated sql.js worker with a second full copy of the database;
 * that worker has been removed in favor of the single shared DB worker.
 */

import { dbClient } from '../../db/dbClient';
import { getFallbackT9Word } from './t9Data';

export interface T9Result {
  digits: string;
  candidates: string[];
}

class T9Service {
  public async query(digits: string, limit: number = 12): Promise<T9Result> {
    if (!digits) {
      return { digits: '', candidates: [] };
    }

    try {
      return await dbClient.t9Query(digits, limit);
    } catch (err) {
      console.warn('T9 lookup error:', err);
      return { digits, candidates: [getFallbackT9Word(digits)] };
    }
  }

  /** Kept for API compatibility with previous worker-owning implementation; no-op now. */
  public terminate(): void {
    // The DB worker is shared and long-lived; nothing to terminate here.
  }
}

export const t9Service = new T9Service();
