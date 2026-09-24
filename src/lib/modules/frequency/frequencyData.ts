/**
 * Czech letter frequencies trained on Czech National Corpus (KonText) ~11.8M tokens (data/cs_all.csv).
 */

/**
 * Czech letter frequencies with diacritics and CH (42 letters).
 */
export const CZECH_42_FREQUENCIES: Record<string, number> = {
  O: 8.84,
  E: 7.53,
  A: 7.35,
  N: 6.80,
  I: 5.81,
  T: 4.96,
  R: 4.95,
  L: 4.74,
  V: 4.45,
  S: 4.12,
  K: 3.86,
  M: 3.75,
  U: 3.64,
  P: 2.84,
  D: 2.64,
  Í: 2.12,
  Á: 1.99,
  C: 1.85,
  Z: 1.72,
  H: 1.61,
  B: 1.59,
  Y: 1.58,
  J: 1.32,
  CH: 1.16,
  É: 1.10,
  Ý: 1.05,
  G: 0.96,
  Ě: 0.86,
  Č: 0.83,
  Ř: 0.83,
  Š: 0.83,
  F: 0.68,
  Ž: 0.42,
  Ů: 0.39,
  W: 0.26,
  X: 0.16,
  Ň: 0.11,
  Ú: 0.08,
  Ó: 0.07,
  Ť: 0.06,
  Q: 0.04,
  Ď: 0.03
};

/**
 * Czech letter frequencies unaccented (folded diacritics) with CH as single entity (27 letters).
 * Trained on data/cs_all.csv (11.8M tokens).
 */
export const CZECH_27_UNACCENTED_FREQUENCIES: Record<string, number> = {
  E: 9.49,
  A: 9.34,
  O: 8.91,
  I: 7.93,
  N: 6.90,
  R: 5.78,
  T: 5.02,
  S: 4.96,
  L: 4.74,
  V: 4.45,
  U: 4.11,
  K: 3.86,
  M: 3.75,
  P: 2.84,
  C: 2.68,
  D: 2.67,
  Y: 2.63,
  Z: 2.13,
  H: 1.61,
  B: 1.59,
  J: 1.32,
  CH: 1.16,
  G: 0.96,
  F: 0.68,
  W: 0.26,
  X: 0.16,
  Q: 0.04
};

/**
 * Czech letter frequencies unaccented without CH (26 letters).
 * Trained on data/cs_all.csv (11.8M tokens).
 */
export const CZECH_26_UNACCENTED_FREQUENCIES: Record<string, number> = {
  E: 9.49,
  A: 9.34,
  O: 8.91,
  I: 7.93,
  N: 6.90,
  R: 5.78,
  T: 5.02,
  S: 4.96,
  L: 4.74,
  V: 4.45,
  U: 4.11,
  K: 3.86,
  C: 3.84,
  M: 3.75,
  P: 2.84,
  H: 2.77,
  D: 2.67,
  Y: 2.63,
  Z: 2.13,
  B: 1.59,
  J: 1.32,
  G: 0.96,
  F: 0.68,
  W: 0.26,
  X: 0.16,
  Q: 0.04
};

/**
 * Expected Index of Coincidence (IoC) for Czech language.
 */
export const IOC_EXPECTED = {
  csUnaccented: 0.060,
  csDiacritics42: 0.048,
  uniform26: 0.0385,
  uniform42: 0.0238
} as const;
