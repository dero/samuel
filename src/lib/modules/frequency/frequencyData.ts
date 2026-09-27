/**
 * Czech letter frequencies from FI MUNI (https://nlp.fi.muni.cz/cs/FrekvenceSlovLemmat),
 * 5,343,080 letters; CH counted as a single letter.
 */

/**
 * Czech letter frequencies with diacritics and CH (42 letters).
 */
export const CZECH_42_FREQUENCIES: Record<string, number> = {
  O: 8.28,
  E: 7.83,
  A: 6.70,
  N: 6.68,
  T: 5.55,
  S: 4.62,
  I: 4.57,
  V: 4.38,
  L: 4.10,
  R: 3.98,
  K: 3.75,
  D: 3.61,
  P: 3.45,
  M: 3.26,
  U: 3.13,
  Í: 3.10,
  Á: 2.13,
  Z: 2.12,
  J: 1.98,
  Y: 1.75,
  B: 1.67,
  C: 1.60,
  Ě: 1.49,
  H: 1.30,
  Ř: 1.19,
  É: 1.18,
  Ž: 1.02,
  Č: 1.02,
  CH: 1.01,
  Ý: 0.94,
  Š: 0.82,
  Ů: 0.57,
  F: 0.39,
  G: 0.34,
  Ú: 0.14,
  X: 0.09,
  Ň: 0.07,
  W: 0.07,
  Ť: 0.04,
  Ó: 0.03,
  Ď: 0.02,
  Q: 0.01
};

/**
 * Czech letter frequencies unaccented (folded diacritics) with CH as single entity (27 letters).
 */
export const CZECH_27_UNACCENTED_FREQUENCIES: Record<string, number> = {
  E: 10.50,
  A: 8.83,
  O: 8.32,
  I: 7.67,
  N: 6.75,
  T: 5.59,
  S: 5.44,
  R: 5.16,
  V: 4.38,
  L: 4.10,
  U: 3.85,
  K: 3.75,
  D: 3.63,
  P: 3.45,
  M: 3.26,
  Z: 3.15,
  Y: 2.69,
  C: 2.62,
  J: 1.98,
  B: 1.67,
  H: 1.30,
  CH: 1.01,
  F: 0.39,
  G: 0.34,
  X: 0.09,
  W: 0.07,
  Q: 0.01
};

/**
 * Czech letter frequencies unaccented without CH (26 letters, CH counted as C + H).
 */
export const CZECH_26_UNACCENTED_FREQUENCIES: Record<string, number> = {
  E: 10.40,
  A: 8.74,
  O: 8.23,
  I: 7.60,
  N: 6.68,
  T: 5.54,
  S: 5.38,
  R: 5.11,
  V: 4.34,
  L: 4.06,
  U: 3.81,
  K: 3.71,
  D: 3.60,
  C: 3.59,
  P: 3.42,
  M: 3.23,
  Z: 3.11,
  Y: 2.67,
  H: 2.28,
  J: 1.96,
  B: 1.65,
  F: 0.39,
  G: 0.34,
  X: 0.09,
  W: 0.07,
  Q: 0.01
};

/**
 * English letter frequencies in texts (https://en.wikipedia.org/wiki/Letter_frequency).
 */
export const ENGLISH_26_FREQUENCIES: Record<string, number> = {
  E: 12.7,
  T: 9.1,
  A: 8.2,
  O: 7.5,
  I: 7.0,
  N: 6.7,
  S: 6.3,
  H: 6.1,
  R: 6.0,
  D: 4.3,
  L: 4.0,
  C: 2.8,
  U: 2.8,
  M: 2.4,
  W: 2.4,
  F: 2.2,
  G: 2.0,
  Y: 2.0,
  P: 1.9,
  B: 1.5,
  V: 0.98,
  K: 0.77,
  J: 0.16,
  X: 0.15,
  Q: 0.12,
  Z: 0.074
};

/**
 * Expected Index of Coincidence (IoC), computed from the tables above.
 */
export const IOC_EXPECTED = {
  csUnaccented: 0.058,
  csDiacritics42: 0.045,
  en: 0.066,
  uniform26: 0.0385,
  uniform42: 0.0238
} as const;
