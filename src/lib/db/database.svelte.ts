/**
 * Thin compatibility wrapper around the shared DB worker client (`dbClient.ts`).
 *
 * Historically this module owned an in-process sql.js instance loaded from a
 * CacheStorage buffer. It now simply forwards to `dbClient`, which talks to
 * the single long-lived DB worker (OPFS-backed SQLite). Kept as a separate
 * module so existing call sites (ShiftsModule, StatesModule, FlagDetailModal,
 * versionService) don't need to change their import paths.
 */

import { dbClient, type WorldFlagRecord, type LexiconWordItem } from './dbClient';

export type { WorldFlagRecord, LexiconWordItem };

/**
 * Clears client-side lexicon/world-flags caches. Does NOT terminate the
 * shared DB worker (it is meant to live for the whole app session) - call
 * this after the underlying DB file changes (update/delete).
 */
export function resetDatabase(): void {
  dbClient.resetCaches();
}

/**
 * Loads vocabulary from words.db on demand for algorithmic solvers (e.g. Morse, Caesar).
 * Results are cached in memory after first fetch (~95,000 words).
 */
export async function getLexiconWords(): Promise<LexiconWordItem[]> {
  return dbClient.getLexiconWords();
}

/**
 * Loads all world flags from words.db. Cached in memory after first fetch.
 */
export async function getWorldFlags(): Promise<WorldFlagRecord[]> {
  return dbClient.getWorldFlags();
}
