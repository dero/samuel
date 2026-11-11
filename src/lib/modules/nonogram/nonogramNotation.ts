/**
 * Nonogram podklad notation (DESIGN_SYSTEM §7): `,` between the numbers of one clue,
 * `/` between clues, `//` between the axes, rows first; an empty line is `0`,
 * e.g. `3,1/2/5//1,1/4/1`. Whitespace is ignored.
 *
 * A clue is kept as its pieces as written, so an invalid piece stays in place when the
 * keypad edits the numbers around it.
 */

export const NONOGRAM_MAX_SIZE = 30;
export const NONOGRAM_MIN_SIZE = 2;

/** Pieces of one clue as written: numbers, or invalid pieces kept in place. */
export type ClueCell = string[];

export interface NonogramNotation {
  rows: ClueCell[];
  cols: ClueCell[];
  /** Text after a further `//`; it has no place on the board but stays in the notation. */
  extra: string[];
}

export function isCluePiece(piece: string): boolean {
  return /^[1-9]\d*$/.test(piece);
}

export function clueNumbers(cell: ClueCell | undefined): number[] {
  return (cell ?? []).filter(isCluePiece).map(Number);
}

/** `0` is an empty line; a trailing comma only opens the next number. */
export function parseClueCell(text: string): ClueCell {
  if (text === '' || text === '0') return [];
  const pieces = text.split(',');
  if (pieces.length > 1 && pieces[pieces.length - 1] === '') pieces.pop();
  return pieces;
}

export function clueCellText(cell: ClueCell): string {
  if (cell.length === 0) return '0';
  const text = cell.join(',');
  // One more comma keeps a final empty piece, or a lone invalid `0`, through `parseClueCell`
  return cell[cell.length - 1] === '' || text === '0' ? `${text},` : text;
}

function parseAxis(text: string): ClueCell[] {
  // A trailing `/` only opens the next clue; a leading one is an empty first line, so rows don't shift
  const trimmed = text.replace(/\/+$/g, '');
  return trimmed ? trimmed.split('/').map(parseClueCell) : [];
}

export function parseNonogramNotation(text: string): NonogramNotation {
  // A space between digits separates two numbers (`1 1` is `1,1`), any other whitespace is layout
  const compact = text.replace(/(\d)\s+(?=\d)/g, '$1,').replace(/\s+/g, '');
  if (!compact) return { rows: [], cols: [], extra: [] };
  const [rows, cols = '', ...extra] = compact.split('//');
  return { rows: parseAxis(rows), cols: parseAxis(cols), extra };
}

export function serializeNonogramNotation({ rows, cols, extra }: NonogramNotation): string {
  if (rows.length === 0 && cols.length === 0 && extra.length === 0) return '';
  const axes = [rows.map(clueCellText).join('/'), cols.map(clueCellText).join('/'), ...extra];
  return axes.join('//');
}

/** Adds empty clues so the board size has a place in the notation; never removes any. */
export function fillNonogramShape(notation: NonogramNotation, width: number, height: number): NonogramNotation {
  const pad = (cells: ClueCell[], length: number) => {
    const next = cells.map((cell) => [...cell]);
    while (next.length < length) next.push([]);
    return next;
  };
  return { rows: pad(notation.rows, height), cols: pad(notation.cols, width), extra: [...notation.extra] };
}

/**
 * Sets the number of clues on one axis. Clues cut off go to the front of `spare`
 * (as notation text) and come back first when the axis grows again.
 */
export function resizeClues(
  cells: ClueCell[],
  spare: string[],
  size: number
): { cells: ClueCell[]; spare: string[] } {
  const nextCells = cells.map((cell) => [...cell]);
  const nextSpare = [...spare];
  while (nextCells.length > size) nextSpare.unshift(clueCellText(nextCells.pop()!));
  while (nextCells.length < size) nextCells.push(parseClueCell(nextSpare.shift() ?? '0'));
  return { cells: nextCells, spare: nextSpare };
}

export function invalidCluePieces(notation: NonogramNotation): string[] {
  return [...notation.rows, ...notation.cols].flat().filter((piece) => !isCluePiece(piece));
}

/** The numbers with their single gaps do not fit the line. */
export function clueOverflows(cell: ClueCell | undefined, length: number): boolean {
  const numbers = clueNumbers(cell);
  const needed = numbers.reduce((sum, n) => sum + n, 0) + Math.max(0, numbers.length - 1);
  return needed > length;
}

export interface ClueEdit {
  cell: ClueCell;
  /** Index of the number still being typed, committed by the next key. */
  draft: number | null;
}

/**
 * A digit extends the number being typed or starts a new one. `0` as the first digit
 * marks an empty line (`advance`); invalid pieces keep their place.
 */
export function typeClueDigit(cell: ClueCell, draft: number | null, digit: number): ClueEdit & { advance: boolean } {
  if (draft !== null && isCluePiece(cell[draft] ?? '')) {
    const next = [...cell];
    next[draft] += String(digit);
    return { cell: next, draft, advance: false };
  }
  if (digit === 0) {
    return { cell: cell.filter((piece) => !isCluePiece(piece)), draft: null, advance: true };
  }
  return { cell: [...cell, String(digit)], draft: cell.length, advance: false };
}

/**
 * Removes the last digit of the number being typed, otherwise of the last number,
 * which stays open for typing. With no number left, `moveBack` asks for the previous clue.
 */
export function backspaceClue(cell: ClueCell, draft: number | null): ClueEdit & { moveBack: boolean } {
  let target = draft !== null && isCluePiece(cell[draft] ?? '') ? draft : -1;
  if (target < 0) target = cell.findLastIndex(isCluePiece);
  if (target < 0) return { cell, draft: null, moveBack: true };

  const piece = cell[target].slice(0, -1);
  if (piece) {
    const next = [...cell];
    next[target] = piece;
    return { cell: next, draft: target, moveBack: false };
  }
  return { cell: cell.filter((_, i) => i !== target), draft: null, moveBack: false };
}

/**
 * Notation of the clue arrays kept before the podklad (one array per line, `[0]` or `[]`
 * for an empty line). Lines beyond the board size become spare clues, trailing empty ones dropped.
 */
export function cluesToNotation(
  width: number,
  height: number,
  rowClues: number[][],
  colClues: number[][]
): { notation: string; spareRows: string[]; spareCols: string[] } {
  const toCell = (clue: unknown): ClueCell =>
    Array.isArray(clue) ? clue.filter((n) => Number.isInteger(n) && n > 0).map(String) : [];
  const rows = Array.from({ length: height }, (_, r) => toCell(rowClues[r]));
  const cols = Array.from({ length: width }, (_, c) => toCell(colClues[c]));
  const spare = (clues: number[][], from: number) => {
    const cells = clues.slice(from, NONOGRAM_MAX_SIZE).map((clue) => clueCellText(toCell(clue)));
    while (cells.length > 0 && cells[cells.length - 1] === '0') cells.pop();
    return cells;
  };
  const isEmpty = [...rows, ...cols].every((cell) => cell.length === 0);
  return {
    notation: isEmpty ? '' : serializeNonogramNotation({ rows, cols, extra: [] }),
    spareRows: spare(rowClues, height),
    spareCols: spare(colClues, width)
  };
}
