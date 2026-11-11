/**
 * Sudoku podklad notation (DESIGN_SYSTEM §7): 9 groups of 9 cells separated by a comma,
 * a cell is a digit 1–9 or `.` for empty, e.g. `53..7....,6..195...`. One piece of 81
 * characters is read in rows of 9. Whitespace is ignored.
 *
 * Every non-space character takes one cell, so a typo keeps the cells after it in place.
 * Characters past the 9th row or the 9th cell of a row have no place on the board.
 */

export const SUDOKU_SIZE = 9;
const CELL_COUNT = SUDOKU_SIZE * SUDOKU_SIZE;

export type SudokuGrid = (number | null)[][];

export interface ParsedSudoku {
  /** Rows of one-character pieces as written, whitespace removed. */
  rows: string[][];
  /** Board values: a digit, or null for an empty or invalid cell. */
  grid: SudokuGrid;
  /** The invalid character a board cell holds, otherwise null. */
  invalidCells: (string | null)[][];
  /** Invalid characters anywhere in the notation, also those with no place on the board. */
  invalidPieces: string[];
  /** Structural problems (wrong number of rows or cells), one sentence each. */
  problems: string[];
  givens: number;
}

/** An empty cell is `.`; `0` is accepted too, because puzzles copied from the web use it. */
export function isSudokuEmptyChar(ch: string | undefined): boolean {
  return ch === '.' || ch === '0';
}

export function isSudokuCellChar(ch: string): boolean {
  return isSudokuEmptyChar(ch) || (ch >= '1' && ch <= '9' && ch.length === 1);
}

function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  return n >= 2 && n <= 4 ? few : many;
}

/** Splits the notation into rows of one-character pieces. */
export function splitSudokuRows(text: string): { rows: string[][]; onePiece: boolean } {
  // A grid pasted as lines keeps its rows: line breaks act as commas when there are none
  const lines = text.split(/\r?\n/).map((line) => line.replace(/\s+/g, '')).filter(Boolean);
  const compact = !text.includes(',') && lines.length > 1 ? lines.join(',') : text.replace(/\s+/g, '');
  if (!compact) return { rows: [], onePiece: false };

  if (!compact.includes(',')) {
    const chars = [...compact];
    // Up to 9 characters are simply the first row being typed
    if (chars.length <= SUDOKU_SIZE) return { rows: [chars], onePiece: false };
    const rows: string[][] = [];
    for (let i = 0; i < chars.length; i += SUDOKU_SIZE) rows.push(chars.slice(i, i + SUDOKU_SIZE));
    return { rows, onePiece: true };
  }

  const groups = compact.split(',');
  // A trailing comma only opens the next row
  if (groups[groups.length - 1] === '') groups.pop();
  return { rows: groups.map((group) => [...group]), onePiece: false };
}

export function parseSudokuNotation(text: string): ParsedSudoku {
  const { rows, onePiece } = splitSudokuRows(text);

  const grid: SudokuGrid = [];
  const invalidCells: (string | null)[][] = [];
  let givens = 0;

  for (let r = 0; r < SUDOKU_SIZE; r++) {
    const gridRow: (number | null)[] = [];
    const invalidRow: (string | null)[] = [];
    for (let c = 0; c < SUDOKU_SIZE; c++) {
      const ch = rows[r]?.[c];
      if (ch !== undefined && !isSudokuEmptyChar(ch) && isSudokuCellChar(ch)) {
        gridRow.push(Number(ch));
        invalidRow.push(null);
        givens++;
      } else {
        gridRow.push(null);
        invalidRow.push(ch !== undefined && !isSudokuCellChar(ch) ? ch : null);
      }
    }
    grid.push(gridRow);
    invalidCells.push(invalidRow);
  }

  const invalidPieces = rows.flat().filter((ch) => !isSudokuCellChar(ch));

  const problems: string[] = [];
  if (rows.length > 0) {
    if (onePiece) {
      const count = rows.reduce((sum, row) => sum + row.length, 0);
      if (count !== CELL_COUNT) problems.push(`Zápis v kuse má ${count} znaků místo 81.`);
    } else {
      if (rows.length !== SUDOKU_SIZE) {
        const word = plural(rows.length, 'řádek', 'řádky', 'řádků');
        problems.push(`Zápis má ${rows.length} ${word} místo 9.`);
      }
      rows.slice(0, SUDOKU_SIZE).forEach((row, r) => {
        if (row.length !== SUDOKU_SIZE) {
          const word = plural(row.length, 'pole', 'pole', 'polí');
          problems.push(`Řádek ${r + 1} má ${row.length} ${word} místo 9.`);
        }
      });
    }
  }

  return { rows, grid, invalidCells, invalidPieces, problems, givens };
}

export function serializeSudokuRows(rows: string[][]): string {
  return rows.map((row) => row.join('')).join(',');
}

/**
 * Writes one cell (`1`–`9` or `.`) and returns the new notation in groups of 9.
 * Missing rows are added empty and a row too short for the cell is completed with dots.
 * An invalid character the cell held is never dropped: it moves past the board.
 */
export function setSudokuCell(text: string, r: number, c: number, value: string): string {
  const rows = splitSudokuRows(text).rows.map((row) => [...row]);
  while (rows.length < SUDOKU_SIZE) rows.push(new Array(SUDOKU_SIZE).fill('.'));

  const row = rows[r];
  while (row.length < SUDOKU_SIZE) row.push('.');

  const previous = row[c];
  row[c] = value;

  if (!isSudokuCellChar(previous)) {
    if (rows.length > SUDOKU_SIZE) rows[rows.length - 1].push(previous);
    else rows.push([previous]);
  }

  return serializeSudokuRows(rows);
}

/** Notation of a board given as values (legacy storage). */
export function gridToSudokuNotation(grid: SudokuGrid): string {
  if (grid.every((row) => row.every((value) => value === null))) return '';
  return grid.map((row) => row.map((value) => (value === null ? '.' : String(value))).join('')).join(',');
}
