export interface NonogramSolveResult {
  status: 'solved' | 'unsolvable' | 'invalid_input' | 'timeout' | 'multiple';
  grid?: (0 | 1)[][]; // 1 = filled (black), 0 = empty (white)
}

/**
 * Generates all valid configurations for a single line given clues and current board constraints.
 */
function getValidLinePlacements(
  length: number,
  clues: number[],
  current: number[] // -1 = unknown, 0 = white, 1 = black
): number[][] {
  const valid: number[][] = [];
  const line: number[] = new Array(length).fill(0);

  // If clues is empty or [0], the only valid placement is all 0s
  const cleanClues = clues.filter((c) => c > 0);
  if (cleanClues.length === 0) {
    for (let i = 0; i < length; i++) {
      if (current[i] === 1) return []; // Conflict with known black cell
    }
    return [line];
  }

  // Pre-calculate minimum space required from each clue index to end
  const suffixMinSpace = new Array(cleanClues.length + 1).fill(0);
  for (let i = cleanClues.length - 1; i >= 0; i--) {
    suffixMinSpace[i] = suffixMinSpace[i + 1] + cleanClues[i] + (i < cleanClues.length - 1 ? 1 : 0);
  }

  if (suffixMinSpace[0] > length) {
    return []; // Clues exceed line length
  }

  function recurse(clueIdx: number, startPos: number) {
    if (clueIdx === cleanClues.length) {
      // Check remaining positions are not required to be 1
      for (let p = startPos; p < length; p++) {
        if (current[p] === 1) return;
      }
      valid.push([...line]);
      return;
    }

    const blockSize = cleanClues[clueIdx];
    const maxStart = length - suffixMinSpace[clueIdx];

    for (let p = startPos; p <= maxStart; p++) {
      // Check that block can be placed at p..p + blockSize - 1
      let canPlace = true;
      for (let b = 0; b < blockSize; b++) {
        if (current[p + b] === 0) {
          canPlace = false;
          break;
        }
      }

      // Check that separator after block is not 1
      const afterPos = p + blockSize;
      if (afterPos < length && current[afterPos] === 1) {
        canPlace = false;
      }

      if (canPlace) {
        // Place block
        for (let b = 0; b < blockSize; b++) {
          line[p + b] = 1;
        }

        recurse(clueIdx + 1, afterPos + 1);

        // Revert block
        for (let b = 0; b < blockSize; b++) {
          line[p + b] = 0;
        }
      }

      // Before shifting startPos to p + 1, ensure position p is not forced to be 1!
      if (current[p] === 1) {
        break; // Cannot skip position p with an empty cell
      }
    }
  }

  recurse(0, 0);
  return valid;
}

export function solveNonogram(
  width: number,
  height: number,
  rowClues: number[][],
  colClues: number[][]
): NonogramSolveResult {
  // Validate dimensions
  if (width <= 0 || height <= 0 || width > 40 || height > 40) {
    return { status: 'invalid_input' };
  }

  // Pre-validate individual clues
  for (let r = 0; r < height; r++) {
    const clues = (rowClues[r] || []).filter((c) => c > 0);
    const minSpace = clues.reduce((acc, c) => acc + c, 0) + Math.max(0, clues.length - 1);
    if (minSpace > width) return { status: 'invalid_input' };
  }

  for (let c = 0; c < width; c++) {
    const clues = (colClues[c] || []).filter((cl) => cl > 0);
    const minSpace = clues.reduce((acc, cl) => acc + cl, 0) + Math.max(0, clues.length - 1);
    if (minSpace > height) return { status: 'invalid_input' };
  }

  // -1 = unknown, 0 = white, 1 = black
  const board: number[][] = Array.from({ length: height }, () => new Array(width).fill(-1));

  function lineSolve(currentBoard: number[][]): { progress: boolean; contradiction: boolean } {
    let changed = false;

    // Solve rows
    for (let r = 0; r < height; r++) {
      const line = currentBoard[r];
      if (line.every((v) => v !== -1)) continue; // Already fully determined

      const clues = rowClues[r] || [];
      const validConfigs = getValidLinePlacements(width, clues, line);
      if (validConfigs.length === 0) return { progress: false, contradiction: true };

      for (let c = 0; c < width; c++) {
        if (line[c] === -1) {
          const firstVal = validConfigs[0][c];
          let allSame = true;
          for (let i = 1; i < validConfigs.length; i++) {
            if (validConfigs[i][c] !== firstVal) {
              allSame = false;
              break;
            }
          }
          if (allSame) {
            line[c] = firstVal;
            changed = true;
          }
        }
      }
    }

    // Solve columns
    for (let c = 0; c < width; c++) {
      const colLine: number[] = [];
      let hasUnknown = false;
      for (let r = 0; r < height; r++) {
        const val = currentBoard[r][c];
        colLine.push(val);
        if (val === -1) hasUnknown = true;
      }

      if (!hasUnknown) continue;

      const clues = colClues[c] || [];
      const validConfigs = getValidLinePlacements(height, clues, colLine);
      if (validConfigs.length === 0) return { progress: false, contradiction: true };

      for (let r = 0; r < height; r++) {
        if (currentBoard[r][c] === -1) {
          const firstVal = validConfigs[0][r];
          let allSame = true;
          for (let i = 1; i < validConfigs.length; i++) {
            if (validConfigs[i][r] !== firstVal) {
              allSame = false;
              break;
            }
          }
          if (allSame) {
            currentBoard[r][c] = firstVal;
            changed = true;
          }
        }
      }
    }

    return { progress: changed, contradiction: false };
  }

  // Iterative reduction
  function fullLineSolve(currentBoard: number[][]): boolean {
    while (true) {
      const { progress, contradiction } = lineSolve(currentBoard);
      if (contradiction) return false;
      if (!progress) break;
    }
    return true;
  }

  let steps = 0;
  const maxSteps = 10000;

  function backtrack(currentBoard: number[][]): (0 | 1)[][] | null {
    steps++;
    if (steps > maxSteps) return null;

    if (!fullLineSolve(currentBoard)) return null;

    // Check if fully solved
    let unknownR = -1;
    let unknownC = -1;
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (currentBoard[r][c] === -1) {
          unknownR = r;
          unknownC = c;
          break;
        }
      }
      if (unknownR !== -1) break;
    }

    if (unknownR === -1) {
      return currentBoard as (0 | 1)[][];
    }

    // Branch on 1 then 0
    const copy1 = currentBoard.map((row) => [...row]);
    copy1[unknownR][unknownC] = 1;
    const res1 = backtrack(copy1);
    if (res1) return res1;

    const copy0 = currentBoard.map((row) => [...row]);
    copy0[unknownR][unknownC] = 0;
    return backtrack(copy0);
  }

  const result = backtrack(board);

  if (steps > maxSteps) {
    return { status: 'timeout' };
  }

  if (!result) {
    return { status: 'unsolvable' };
  }

  return {
    status: 'solved',
    grid: result
  };
}
