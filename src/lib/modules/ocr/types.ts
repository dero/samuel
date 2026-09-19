export interface OcrBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrItem {
  text: string;
  box: OcrBox;
  confidence: number;
}

export interface TableStructure {
  isTable: boolean;
  rowCount: number;
  colCount: number;
  confidenceScore: number;
  grid: string[][];
  tsv: string;
  markdown: string;
  plainText: string;
}

export type OcrLayoutMode = 'auto' | 'text' | 'table';

export type OcrWorkerStatus =
  | 'uninitialized'
  | 'loading_models'
  | 'ready'
  | 'recognizing'
  | 'error';

export interface OcrRecognitionResponse {
  id: string;
  type: 'result';
  text: string;
  lines: OcrItem[][];
  table: TableStructure;
  confidence: number;
}
