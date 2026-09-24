/**
 * Polybius Square Coordinate Solver
 */

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
