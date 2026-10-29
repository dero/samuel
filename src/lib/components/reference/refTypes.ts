/**
 * Shared types for module reference sheets.
 *
 * Text conventions (kept short on purpose – reference is scanned, not read):
 * - `RefItem` is either a plain line or a `[term, text]` pair rendered as "term: text".
 * - Inline `backticks` render as <code>.
 */
export type RefItem = string | readonly [term: string, text: string];

export interface RefHelpData {
  /** How to operate the module: input, toolbar, menu toggles. */
  controls?: readonly RefItem[];
  /** Gotchas as "situation → what to do". */
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
