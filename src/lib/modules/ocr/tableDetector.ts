import type { OcrItem, TableStructure } from './types';

/**
 * Analyzes recognized OCR items and lines to detect tabular data
 * and construct structured 2D matrix, TSV, markdown, and text representations.
 */
export function analyzeTableStructure(lines: OcrItem[][]): TableStructure {
  // 1. Flatten valid items and calculate baseline statistics
  const validLines = lines
    .map((line) => line.filter((item) => item.text && item.text.trim().length > 0))
    .filter((line) => line.length > 0);

  const allItems = validLines.flat();

  if (allItems.length < 3 || validLines.length < 2) {
    const plainText = validLines.map((l) => l.map((item) => item.text).join(' ')).join('\n');
    return {
      isTable: false,
      rowCount: validLines.length,
      colCount: 1,
      confidenceScore: 0,
      grid: validLines.map((l) => [l.map((item) => item.text).join(' ')]),
      tsv: plainText,
      markdown: plainText,
      plainText
    };
  }

  // 2. Count multi-cell rows and assess column candidates
  const multiCellRows = validLines.filter((l) => l.length >= 2);
  const multiCellRatio = multiCellRows.length / validLines.length;

  // Collect horizontal start positions (x) and spans of all items
  const xStarts: number[] = allItems.map((item) => item.box.x);
  const avgItemWidth = allItems.reduce((acc, item) => acc + item.box.width, 0) / allItems.length;

  // 3. Cluster X coordinates into distinct columns
  // Two boxes align to the same column if their X distance is within a small tolerance
  const columnTolerance = Math.max(24, avgItemWidth * 0.45);
  const sortedX = [...xStarts].sort((a, b) => a - b);

  const columnCenters: number[] = [];
  for (const x of sortedX) {
    let matchedIdx = -1;
    for (let i = 0; i < columnCenters.length; i++) {
      if (Math.abs(columnCenters[i] - x) <= columnTolerance) {
        matchedIdx = i;
        break;
      }
    }
    if (matchedIdx >= 0) {
      // Re-average center
      columnCenters[matchedIdx] = (columnCenters[matchedIdx] + x) / 2;
    } else {
      columnCenters.push(x);
    }
  }

  // Sort detected column centers left-to-right
  columnCenters.sort((a, b) => a - b);

  // Filter out spurious or tight column clusters
  const distinctColumns: number[] = [];
  for (const col of columnCenters) {
    if (distinctColumns.length === 0 || col - distinctColumns[distinctColumns.length - 1] > columnTolerance * 0.75) {
      distinctColumns.push(col);
    }
  }

  const numCols = Math.max(1, distinctColumns.length);

  // 4. Evaluate table heuristic
  // Requirements for being classified as a table:
  // - At least 2 distinct columns
  // - At least 2 rows with 2+ items
  // - At least 40% of rows have multiple items OR high column consistency
  let alignedHits = 0;
  for (const line of validLines) {
    if (line.length >= 2) {
      for (const item of line) {
        const hasCloseCol = distinctColumns.some((col) => Math.abs(col - item.box.x) <= columnTolerance);
        if (hasCloseCol) alignedHits++;
      }
    }
  }

  const alignmentScore = allItems.length > 0 ? alignedHits / allItems.length : 0;
  const isTable = numCols >= 2 && multiCellRows.length >= 2 && (multiCellRatio >= 0.4 || alignmentScore >= 0.6);

  // 5. Build 2D grid
  const grid: string[][] = [];

  for (const line of validLines) {
    const row: string[] = Array(numCols).fill('');
    for (const item of line) {
      // Find closest column index
      let bestColIdx = 0;
      let minDistance = Infinity;

      for (let c = 0; c < distinctColumns.length; c++) {
        const dist = Math.abs(distinctColumns[c] - item.box.x);
        if (dist < minDistance) {
          minDistance = dist;
          bestColIdx = c;
        }
      }

      if (row[bestColIdx]) {
        row[bestColIdx] += ' ' + item.text.trim();
      } else {
        row[bestColIdx] = item.text.trim();
      }
    }
    grid.push(row);
  }

  // 6. Generate formatted outputs
  const plainText = validLines.map((l) => l.map((item) => item.text).join(' ')).join('\n');
  const tsv = grid.map((row) => row.join('\t')).join('\n');

  // Format markdown table
  let markdown = '';
  if (isTable && grid.length > 0) {
    const headerRow = grid[0];
    markdown += '| ' + headerRow.map((c) => c || ' ').join(' | ') + ' |\n';
    markdown += '| ' + headerRow.map(() => '---').join(' | ') + ' |\n';
    for (let r = 1; r < grid.length; r++) {
      markdown += '| ' + grid[r].map((c) => c || ' ').join(' | ') + ' |\n';
    }
  } else {
    markdown = plainText;
  }

  return {
    isTable,
    rowCount: grid.length,
    colCount: numCols,
    confidenceScore: Math.round(alignmentScore * 100) / 100,
    grid,
    tsv,
    markdown: markdown.trim(),
    plainText
  };
}
