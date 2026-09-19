/**
 * Czech 4-gram and 3-gram language model with backoff.
 * Trained on Czech National Corpus (Kontext word forms) and RUIAN street names.
 * Loaded asynchronously on-demand so it does not increase the main bundle size.
 */

interface NgramTables {
  lp4: Record<string, number>;
  lp3: Record<string, number>;
  lp2: Record<string, number>;
}

let ngramModel: NgramTables | null = null;
let loadPromise: Promise<NgramTables> | null = null;

export async function ensureNgramLoaded(): Promise<NgramTables> {
  if (ngramModel) return ngramModel;
  if (!loadPromise) {
    loadPromise = import('./ngramData.json').then((mod) => {
      ngramModel = mod.default as NgramTables;
      return ngramModel;
    });
  }
  return loadPromise;
}

/**
 * Returns conditional log-probability log P(ch | history) with backoff.
 * If model is not loaded yet, falls back to neutral penalty.
 */
export function getNgramLogProb(history: string, ch: string): number {
  if (!ngramModel) return -3.0;

  const { lp4, lp3, lp2 } = ngramModel;
  if (history.length >= 3) {
    const k4 = history.slice(-3) + ch;
    if (k4 in lp4) return lp4[k4];
  }
  if (history.length >= 2) {
    const k3 = history.slice(-2) + ch;
    if (k3 in lp3) return lp3[k3] - 0.8;
  }
  if (history.length >= 1) {
    const k2 = history.slice(-1) + ch;
    if (k2 in lp2) return lp2[k2] - 1.5;
  }
  return -4.5;
}
