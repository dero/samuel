/**
 * Grille (Fleissner / Cardan grille) cipher logic and solver utilities.
 */

export function parseGridInput(raw: string): string[] {
  if (!raw) return [];
  if (raw.includes(',')) {
    return raw
      .split(',')
      .map((t) => t.trim().toUpperCase())
      .filter((t) => t.length > 0);
  }
  // No commas: 1 non-whitespace character = 1 token
  return raw
    .replace(/\s+/g, '')
    .toUpperCase()
    .split('')
    .filter((ch) => ch.length > 0);
}

export function computeGridSize(tokenCount: number): number {
  if (tokenCount <= 0) return 4; // default minimum
  return Math.max(2, Math.ceil(Math.sqrt(tokenCount)));
}

export function getRequiredHolesCount(n: number): number {
  if (n <= 1) return 0;
  return n % 2 === 0 ? (n * n) / 4 : (n * n - 1) / 4;
}

export function isCenterCell(r: number, c: number, n: number): boolean {
  return n % 2 !== 0 && r === Math.floor(n / 2) && c === Math.floor(n / 2);
}

export function rotateCoord(
  r: number,
  c: number,
  n: number,
  direction: 'cw' | 'ccw' = 'cw'
): [number, number] {
  if (direction === 'cw') {
    return [c, n - 1 - r];
  } else {
    return [n - 1 - c, r];
  }
}

export function getOrbit(r: number, c: number, n: number): [number, number][] {
  const coords: [number, number][] = [];
  let currR = r;
  let currC = c;
  for (let i = 0; i < 4; i++) {
    coords.push([currR, currC]);
    [currR, currC] = rotateCoord(currR, currC, n, 'cw');
  }

  // Deduplicate (needed for center of odd grid)
  const seen = new Set<string>();
  const unique: [number, number][] = [];
  for (const [row, col] of coords) {
    const key = `${row},${col}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push([row, col]);
    }
  }
  return unique;
}

export function getOrbitKey(r: number, c: number, n: number): string {
  const orbit = getOrbit(r, c, n);
  // Canonical key is sorted minimum coordinate key
  orbit.sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]));
  return `${orbit[0][0]},${orbit[0][1]}`;
}

export function buildGridMatrix(tokens: string[], n: number): string[][] {
  const total = n * n;
  const padded = [...tokens];
  while (padded.length < total) {
    padded.push('');
  }

  const matrix: string[][] = Array.from({ length: n }, () => Array(n).fill(''));

  let idx = 0;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      matrix[r][c] = padded[idx++] ?? '';
    }
  }

  return matrix;
}

export function getRotatedHolesForStep(
  holes: string[],
  n: number,
  step: number, // 0, 1, 2, 3
  direction: 'cw' | 'ccw'
): string[] {
  let current = [...holes];
  for (let s = 0; s < step; s++) {
    current = current.map((key) => {
      const [r, c] = key.split(',').map(Number);
      const [nr, nc] = rotateCoord(r, c, n, direction);
      return `${nr},${nc}`;
    });
  }
  return current;
}

export function readThroughHoles(
  grid: string[][],
  holes: string[],
  n: number,
  tapOrder: boolean
): string {
  let orderedCoords = holes.map((key) => {
    const [r, c] = key.split(',').map(Number);
    return [r, c] as [number, number];
  });

  if (!tapOrder) {
    // Row-major order: top-to-bottom, left-to-right
    orderedCoords.sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]));
  }

  const chars: string[] = [];
  for (const [r, c] of orderedCoords) {
    if (r >= 0 && r < n && c >= 0 && c < n) {
      const val = grid[r][c];
      if (val) {
        chars.push(val);
      }
    }
  }
  return chars.join('');
}

export function executeWriteMode(
  plainTokens: string[],
  holes: string[],
  n: number,
  direction: 'cw' | 'ccw',
  tapOrder: boolean
): { grid: string[][]; resultText: string } {
  const grid: string[][] = Array.from({ length: n }, () => Array(n).fill(''));
  let tokenIdx = 0;

  for (let step = 0; step < 4; step++) {
    const stepHoles = getRotatedHolesForStep(holes, n, step, direction);
    let coords = stepHoles.map((k) => k.split(',').map(Number) as [number, number]);

    if (!tapOrder) {
      coords.sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]));
    }

    for (const [r, c] of coords) {
      if (tokenIdx < plainTokens.length) {
        grid[r][c] = plainTokens[tokenIdx++];
      }
    }
  }

  // Read resulting grid row-by-row
  const outTokens: string[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c]) outTokens.push(grid[r][c]);
    }
  }

  return { grid, resultText: outTokens.join('') };
}
