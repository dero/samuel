/**
 * Shared types for module reference sheets.
 *
 * The Návod teaches (DESIGN_SYSTEM §10): whole sentences, the principle, and at least one
 * example step by step, in the order K čemu to je → Jak na to → Ovládání → Pozor.
 * - `RefItem` is either a plain line or a `[term, text]` pair, shown as a two-column row.
 * - Inline `backticks` render as <code>.
 */
export type RefItem = string | readonly [term: string, text: string];

/** One step of a worked example: what the player does, and what they then see. */
export interface RefStep {
  action: string;
  result: string;
}

export interface RefExample {
  title: string;
  steps: readonly RefStep[];
}

/** A small offline image (WebP, imported so it is cached with the app), with its alt text. */
export interface RefMedia {
  src: string;
  alt: string;
  caption?: string;
}

export interface RefHelpData {
  /** K čemu to je: what the cipher is and where it shows up, in whole sentences. */
  purpose?: readonly string[];
  /** Jak na to: the principle, then the worked example and an optional image. */
  howTo?: readonly string[];
  example?: RefExample;
  media?: RefMedia;
  /** Ovládání: each control named exactly as in the app, and what it does. */
  controls?: readonly RefItem[];
  /** Pozor: situation → what to do. */
  pitfalls?: readonly RefItem[];
}

/**
 * Help for one tool (flavour) of a multi-tool module, e.g. SMS vs. T9.
 * Listed in "Návod" as its own block after the module-wide "Společné" block.
 */
export interface RefTool<T extends string = string> {
  id: T;
  label: string;
  help: RefHelpData;
}

export interface RefTab<T extends string = string> {
  id: T;
  label: string;
  badge?: string | number;
}

export type RefTextPart = { code: boolean; text: string };

/** Split a line on `backticks` into plain and code segments. */
export function parseRefText(text: string): RefTextPart[] {
  return text
    .split('`')
    .map((part, i) => ({ code: i % 2 === 1, text: part }))
    .filter((part) => part.text !== '');
}
