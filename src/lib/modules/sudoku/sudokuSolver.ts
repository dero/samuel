export interface SudokuValidationResult {
  isValid: boolean;
  collisions: { r: number; c: number }[];
}

export interface SudokuSolveResult {
  status: 'solved' | 'unsolvable' | 'invalid_input' | 'multiple';
  solution?: number[][];
  collisions?: { r: number; c: number }[];
}

export function validateSudokuBoard(grid: (number | null)[][]): SudokuValidationResult {
  const collisions = new Set<string>();

  // Check rows
  for (let r = 0; r < 9; r++) {
    const seen = new Map<number, number>();
    for (let c = 0; c < 9; c++) {
      const val = grid[r][c];
      if (val !== null && val >= 1 && val <= 9) {
        if (seen.has(val)) {
          collisions.add(`${r},${c}`);
          collisions.add(`${r},${seen.get(val)}`);
        } else {
          seen.set(val, c);
        }
      }
    }
  }

  // Check columns
  for (let c = 0; c < 9; c++) {
    const seen = new Map<number, number>();
    for (let r = 0; r < 9; r++) {
      const val = grid[r][c];
      if (val !== null && val >= 1 && val <= 9) {
        if (seen.has(val)) {
          collisions.add(`${r},${c}`);
          collisions.add(`${seen.get(val)},${c}`);
        } else {
          seen.set(val, r);
        }
      }
    }
  }

  // Check 3x3 boxes
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const seen = new Map<number, [number, number]>();
      for (let r = br * 3; r < br * 3 + 3; r++) {
        for (let c = bc * 3; c < bc * 3 + 3; c++) {
          const val = grid[r][c];
          if (val !== null && val >= 1 && val <= 9) {
            if (seen.has(val)) {
              collisions.add(`${r},${c}`);
              const [pr, pc] = seen.get(val)!;
              collisions.add(`${pr},${pc}`);
            } else {
              seen.set(val, [r, c]);
            }
          }
        }
      }
    }
  }

  const collisionList = Array.from(collisions).map((s) => {
    const [r, c] = s.split(',').map(Number);
    return { r, c };
  });

  return {
    isValid: collisionList.length === 0,
    collisions: collisionList
  };
}

export function solveSudoku(initialGrid: (number | null)[][]): SudokuSolveResult {
  const validation = validateSudokuBoard(initialGrid);
  if (!validation.isValid) {
    return {
      status: 'invalid_input',
      collisions: validation.collisions
    };
  }

  // Bitmask representations
  const rowMask = new Uint16Array(9);
  const colMask = new Uint16Array(9);
  const boxMask = new Uint16Array(9);

  const board: number[][] = Array.from({ length: 9 }, () => new Array(9).fill(0));
  let emptyCount = 0;

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = initialGrid[r][c];
      if (val !== null && val >= 1 && val <= 9) {
        board[r][c] = val;
        const bit = 1 << val;
        const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
        rowMask[r] |= bit;
        colMask[c] |= bit;
        boxMask[b] |= bit;
      } else {
        emptyCount++;
      }
    }
  }

  if (emptyCount === 0) {
    return {
      status: 'solved',
      solution: board
    };
  }

  let solutionsFound = 0;
  let firstSolution: number[][] | null = null;

  function countCandidates(r: number, c: number): number {
    const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
    const used = rowMask[r] | colMask[c] | boxMask[b];
    let count = 0;
    for (let n = 1; n <= 9; n++) {
      if ((used & (1 << n)) === 0) count++;
    }
    return count;
  }

  function backtrack(): boolean {
    // Find empty cell with minimum remaining values (MRV)
    let minCandidates = 10;
    let bestR = -1;
    let bestC = -1;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          const count = countCandidates(r, c);
          if (count === 0) return false; // Dead end
          if (count < minCandidates) {
            minCandidates = count;
            bestR = r;
            bestC = c;
            if (count === 1) break;
          }
        }
      }
      if (minCandidates === 1) break;
    }

    if (bestR === -1) {
      // Board is fully filled!
      solutionsFound++;
      if (!firstSolution) {
        firstSolution = board.map((row) => [...row]);
      }
      // If we found 2 solutions, we can stop to signal non-uniqueness
      return solutionsFound >= 2;
    }

    const r = bestR;
    const c = bestC;
    const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
    const used = rowMask[r] | colMask[c] | boxMask[b];

    for (let num = 1; num <= 9; num++) {
      const bit = 1 << num;
      if ((used & bit) === 0) {
        board[r][c] = num;
        rowMask[r] |= bit;
        colMask[c] |= bit;
        boxMask[b] |= bit;

        const shouldStop = backtrack();

        board[r][c] = 0;
        rowMask[r] &= ~bit;
        colMask[c] &= ~bit;
        boxMask[b] &= ~bit;

        if (shouldStop) return true;
      }
    }

    return false;
  }

  backtrack();

  if (solutionsFound === 0) {
    return { status: 'unsolvable' };
  } else if (solutionsFound === 1) {
    return {
      status: 'solved',
      solution: firstSolution!
    };
  } else {
    return {
      status: 'multiple',
      solution: firstSolution!
    };
  }
}
