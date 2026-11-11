/**
 * Polybius Square Coordinate Solver
 */
import type { InterlinearToken } from '../../components/ui/InterlinearText.svelte';
import type { PolybiusCoordLabel } from './polybiusData';

const COORD_AXIS: Record<PolybiusCoordLabel, string> = {
  numbers: '123456',
  letters: 'ABCDEF'
};

export function polybiusCoordToChar(
  row: number,
  col: number,
  sizeNum: number,
  letters: string[]
): string | null {
  if (row < 1 || row > sizeNum || col < 1 || col > sizeNum) return null;
  const idx = (row - 1) * sizeNum + (col - 1);
  if (idx < 0 || idx >= letters.length) return null;
  return letters[idx] ?? null;
}

/** Label of a 1-based row or column. */
export function polybiusCoordLabel(index: number, labels: PolybiusCoordLabel): string {
  return COORD_AXIS[labels][index - 1] ?? '';
}

/** A notation field: row, then column, in the chosen labels. */
export function polybiusField(row: number, col: number, labels: PolybiusCoordLabel): string {
  return polybiusCoordLabel(row, labels) + polybiusCoordLabel(col, labels);
}

/** Row and column of a field; null when it is not two labels of the given kind. */
export function parsePolybiusField(
  field: string,
  labels: PolybiusCoordLabel
): { row: number; col: number } | null {
  if (field.length !== 2) return null;
  const axis = COORD_AXIS[labels];
  const row = axis.indexOf(field[0].toUpperCase()) + 1;
  const col = axis.indexOf(field[1].toUpperCase()) + 1;
  return row > 0 && col > 0 ? { row, col } : null;
}

/** Rewrites fields for other labels; pieces that are not coordinates stay as they are. */
export function convertPolybiusFields(
  fields: string[],
  from: PolybiusCoordLabel,
  to: PolybiusCoordLabel
): string[] {
  return fields.map((field) => {
    const coord = parsePolybiusField(field, from);
    return coord ? polybiusField(coord.row, coord.col, to) : field;
  });
}

function invalidToken(field: string, errorText: string): InterlinearToken {
  return { primary: '?', secondary: field, isError: true, errorText };
}

/** What one field means in the current square; an empty field is a space. */
export function polybiusFieldToToken(
  field: string,
  sizeNum: number,
  labels: PolybiusCoordLabel,
  letters: string[]
): InterlinearToken {
  if (field === '') return { primary: ' ', isSpace: true };
  const coord = parsePolybiusField(field, labels);
  if (!coord) return invalidToken(field, `Neplatný zápis „${field}“`);
  const char = polybiusCoordToChar(coord.row, coord.col, sizeNum, letters);
  if (char === null) return invalidToken(field, `„${field}“ je mimo čtverec`);
  if (!char.trim()) return invalidToken(field, `Pole „${field}“ nemá písmeno`);
  return { primary: char, secondary: field };
}
