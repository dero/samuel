/**
 * Web Worker for PaddleOCR inference and table structure analysis.
 * Runs onnxruntime-web in background thread using OffscreenCanvas.
 */

import * as ort from 'onnxruntime-web';
import { PaddleOcrService } from 'ppu-paddle-ocr/web';
import { analyzeTableStructure } from './tableDetector';
import { getUnwarpSession, unwarpDocument } from './unwarper';
import type { OcrItem } from './types';

const OCR_CACHE_NAME = 'samuel-ocr';

async function getCachedResource(url: string): Promise<ArrayBuffer | null> {
  try {
    if (typeof self !== 'undefined' && 'caches' in self) {
      const cache = await self.caches.open(OCR_CACHE_NAME);
      const match = await cache.match(url);
      if (match) {
        return await match.arrayBuffer();
      }
    }
  } catch (err) {
    console.warn('Could not read from CacheStorage:', err);
  }

  // Network or local static fallback
  try {
    const res = await fetch(`${url}?sw-strategy=network&t=${Date.now()}`);
    if (res.ok) {
      return await res.arrayBuffer();
    }
  } catch {}

  return null;
}

let ocrService: PaddleOcrService | null = null;
let initPromise: Promise<PaddleOcrService> | null = null;

async function getOcrService(): Promise<PaddleOcrService> {
  if (ocrService) return ocrService;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Configure ONNX Runtime Web WASM paths and thread limits
    ort.env.wasm.wasmPaths = '/ocr/';
    ort.env.wasm.numThreads = 1;

    // 1. Fetch detection model, recognition model, and dictionary
    const [detBuffer, recBuffer, dictBuffer] = await Promise.all([
      getCachedResource('/ocr/PP-OCRv6_small_det.ort'),
      getCachedResource('/ocr/PP-OCRv6_small_rec.ort'),
      getCachedResource('/ocr/ppocrv6_dict.txt')
    ]);

    if (!detBuffer || !recBuffer || !dictBuffer) {
      initPromise = null;
      throw new Error('OCR modely nejsou k dispozici. Stáhněte je v Nastavení nebo v modulu OCR.');
    }

    const dictLines = new TextDecoder().decode(dictBuffer).split(/\r?\n/);

    const service = new PaddleOcrService({
      model: {
        detection: detBuffer,
        recognition: recBuffer,
        charactersDictionary: dictBuffer
      },
      detection: {
        maxSideLength: 2560, // High-resolution detection tensor for dense A4 pages
        minimumAreaThreshold: 16, // Do not drop smaller words towards page bottom
        paddingVertical: 0.35,
        paddingHorizontal: 0.5
      },
      recognition: {
        charactersDictionary: dictLines,
        strategy: 'per-box', // Recognize each box directly - eliminates fragile line position splitting!
        maxCropSourceSideLength: 4096, // Keep native high resolution for crops
        spaceRecovery: true, // Recover dropped inter-word spaces for Czech/Latin text
        recBatchSize: 8
      },
      processing: {
        engine: 'canvas-native'
      }
    });

    await service.initialize();
    ocrService = service;
    return service;
  })();

  return initPromise;
}

let unwarpSession: ort.InferenceSession | null = null;
let unwarpInitPromise: Promise<ort.InferenceSession | null> | null = null;

async function getUnwarpSessionWrapper(): Promise<ort.InferenceSession | null> {
  if (unwarpSession) return unwarpSession;
  if (unwarpInitPromise) return unwarpInitPromise;

  unwarpInitPromise = (async () => {
    try {
      const [modelBuffer, dataBuffer] = await Promise.all([
        getCachedResource('/ocr/UVDoc_grid.onnx'),
        getCachedResource('/ocr/UVDoc_grid.onnx.data')
      ]);

      if (!modelBuffer || !dataBuffer) {
        console.warn('UVDoc model files not found in cache or network');
        return null;
      }

      const sess = await getUnwarpSession(modelBuffer, dataBuffer);
      unwarpSession = sess;
      return sess;
    } catch (err) {
      console.warn('Failed to load UVDoc session:', err);
      return null;
    }
  })();

  return unwarpInitPromise;
}

self.onmessage = async (e: MessageEvent) => {
  const { id, type, imageBuffer, userRotation = 0, enableUnwarp = true } = e.data;

  if (type === 'init') {
    try {
      await getOcrService();
      self.postMessage({ id, type: 'init_done' });
    } catch (err: any) {
      self.postMessage({ id, type: 'error', error: err?.message || String(err) });
    }
    return;
  }

  if (type === 'recognize') {
    try {
      self.postMessage({ id, type: 'progress', step: 'loading_model', message: 'Připravuji OCR model…' });
      const service = await getOcrService();

      self.postMessage({ id, type: 'progress', step: 'orienting', message: 'Příprava orientace obrázku…' });

      // 1. Decode image with EXIF orientation correction
      let bitmap: ImageBitmap;
      try {
        bitmap = await createImageBitmap(new Blob([imageBuffer]), { imageOrientation: 'from-image' });
      } catch {
        bitmap = await createImageBitmap(new Blob([imageBuffer]));
      }

      // 2. Apply user rotation (0, 90, 180, 270)
      const rot = ((userRotation % 360) + 360) % 360;
      const isSideways = rot === 90 || rot === 270;
      const targetW = isSideways ? bitmap.height : bitmap.width;
      const targetH = isSideways ? bitmap.width : bitmap.height;

      let canvas = new OffscreenCanvas(targetW, targetH);
      let ctx = canvas.getContext('2d');
      if (ctx) {
        if (rot !== 0) {
          ctx.translate(targetW / 2, targetH / 2);
          ctx.rotate((rot * Math.PI) / 180);
          ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
        } else {
          ctx.drawImage(bitmap, 0, 0);
        }
      }
      bitmap.close();

      // 3. Document unwarping using UVDoc grid
      let unwarpedPreviewUrl: string | null = null;
      if (enableUnwarp) {
        try {
          self.postMessage({ id, type: 'progress', step: 'unwarping', message: 'Rovnám zakřivení papíru (UVDoc)…' });
          const unwarpSess = await getUnwarpSessionWrapper();
          if (unwarpSess) {
            const unwarped = await unwarpDocument(canvas, unwarpSess);
            canvas = unwarped;
            try {
              const blob = await unwarped.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
              const reader = new FileReader();
              unwarpedPreviewUrl = await new Promise<string>((resolve) => {
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
            } catch (blobErr) {
              console.warn('Could not export unwarped preview:', blobErr);
            }
          }
        } catch (unwarpErr) {
          console.warn('UVDoc unwarp failed, falling back to original image:', unwarpErr);
        }
      }

      self.postMessage({ id, type: 'progress', step: 'detecting', message: 'Detekuji text a geometrii…' });
      let detectedBoxes = await service.detect(canvas);
      let effectiveRotation = rot;

      // 4. Auto-detect rotation fallback: if 0 boxes detected at current angle, test 90°, 270°, 180°
      if ((!detectedBoxes || detectedBoxes.boxes.length === 0) && rot === 0) {
        for (const testAngle of [90, 270, 180]) {
          self.postMessage({ id, type: 'progress', step: 'rotating', message: `Zkouším otočení ${testAngle}°…` });
          const testSideways = testAngle === 90 || testAngle === 270;
          const tW = testSideways ? canvas.height : canvas.width;
          const tH = testSideways ? canvas.width : canvas.height;
          const testCanvas = new OffscreenCanvas(tW, tH);
          const tCtx = testCanvas.getContext('2d');
          if (tCtx) {
            tCtx.translate(tW / 2, tH / 2);
            tCtx.rotate((testAngle * Math.PI) / 180);
            tCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
            const testDetect = await service.detect(testCanvas);
            if (testDetect && testDetect.boxes.length > 0) {
              canvas = testCanvas;
              effectiveRotation = testAngle;
              detectedBoxes = testDetect;
              break;
            }
          }
        }
      }

      self.postMessage({ id, type: 'progress', step: 'recognizing', message: 'Rozpoznávám znaky textu…' });
      const rawResult = await service.recognize(canvas, {
        strategy: 'per-box',
        spaceRecovery: true
      });

      // Transform raw lines into OcrItem[][]
      const lines: OcrItem[][] = (rawResult.lines || []).map((line) =>
        line.map((item) => ({
          text: item.text,
          box: {
            x: item.box.x,
            y: item.box.y,
            width: item.box.width,
            height: item.box.height
          },
          confidence: item.confidence
        }))
      );

      // Perform spatial table detection
      const table = analyzeTableStructure(lines);

      self.postMessage({
        id,
        type: 'result',
        text: rawResult.text || table.plainText,
        lines,
        table,
        confidence: rawResult.confidence || 0.9,
        effectiveRotation,
        unwarpedPreviewUrl
      });
    } catch (err: any) {
      console.error('OCR worker error:', err);
      self.postMessage({
        id,
        type: 'error',
        error: err?.message || 'Chyba při rozpoznávání textu'
      });
    }
  }
};
