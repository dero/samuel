/**
 * Document Unwarper using UVDoc grid output ONNX model (fredcallagan/uvdoc-grid-onnx).
 * Predicts a 45x31 coordinate displacement mesh and performs GPU/WebGL texture remapping
 * at full native resolution.
 */

import * as ort from 'onnxruntime-web';

const UVDOC_IN_WIDTH = 496;
const UVDOC_IN_HEIGHT = 720;
const GRID_ROWS = 45;
const GRID_COLS = 31;

let unwarpSession: ort.InferenceSession | null = null;
let initPromise: Promise<ort.InferenceSession> | null = null;

export async function getUnwarpSession(
  modelBuffer: ArrayBuffer,
  dataBuffer: ArrayBuffer
): Promise<ort.InferenceSession> {
  if (unwarpSession) return unwarpSession;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const session = await ort.InferenceSession.create(new Uint8Array(modelBuffer), {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
      externalData: [
        {
          path: 'UVDoc_grid.onnx.data',
          data: new Uint8Array(dataBuffer)
        }
      ]
    });
    unwarpSession = session;
    return session;
  })();

  return initPromise;
}

/**
 * Prepares the 720x496 NCHW normalized input tensor from an OffscreenCanvas.
 */
function prepareInputTensor(sourceCanvas: OffscreenCanvas): ort.Tensor {
  const resizeCanvas = new OffscreenCanvas(UVDOC_IN_WIDTH, UVDOC_IN_HEIGHT);
  const ctx = resizeCanvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get 2D context for UVDoc input');

  ctx.drawImage(sourceCanvas, 0, 0, UVDOC_IN_WIDTH, UVDOC_IN_HEIGHT);
  const imgData = ctx.getImageData(0, 0, UVDOC_IN_WIDTH, UVDOC_IN_HEIGHT);
  const rgba = imgData.data;

  const totalPixels = UVDOC_IN_WIDTH * UVDOC_IN_HEIGHT;
  const tensorData = new Float32Array(3 * totalPixels);
  const gOffset = totalPixels;
  const bOffset = 2 * totalPixels;

  for (let i = 0, p = 0; i < totalPixels; i++, p += 4) {
    tensorData[i] = rgba[p] / 255.0;
    tensorData[gOffset + i] = rgba[p + 1] / 255.0;
    tensorData[bOffset + i] = rgba[p + 2] / 255.0;
  }

  return new ort.Tensor('float32', tensorData, [1, 3, UVDOC_IN_HEIGHT, UVDOC_IN_WIDTH]);
}

/**
 * Remaps the source canvas using the 45x31 UVDoc displacement grid via WebGL texture mapping.
 */
function remapWithWebGL(
  sourceCanvas: OffscreenCanvas,
  gridData: Float32Array,
  dstWidth: number,
  dstHeight: number
): OffscreenCanvas {
  const outputCanvas = new OffscreenCanvas(dstWidth, dstHeight);
  const gl = (outputCanvas.getContext('webgl2') ||
    outputCanvas.getContext('webgl')) as WebGLRenderingContext | null;

  if (!gl) {
    console.warn('WebGL not available in worker for unwarping, returning source canvas');
    return sourceCanvas;
  }

  // Vertex shader: maps clip space [-1, 1] and passes texture coordinates
  const vsSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texCoord = a_texCoord;
    }
  `;

  // Fragment shader: samples source image texture
  const fsSource = `
    precision mediump float;
    uniform sampler2D u_image;
    varying vec2 v_texCoord;
    void main() {
      // Clamp coordinates to [0, 1] edge border
      vec2 coord = clamp(v_texCoord, 0.0, 1.0);
      gl_FragColor = texture2D(u_image, coord);
    }
  `;

  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = createProgram(gl, vs, fs);
  gl.useProgram(program);

  const posLoc = gl.getAttribLocation(program, 'a_position');
  const texLoc = gl.getAttribLocation(program, 'a_texCoord');
  const imageLoc = gl.getUniformLocation(program, 'u_image');

  // Build vertex attributes for 44x30 quads (2 triangles per quad)
  // Each quad: (r, c), (r+1, c), (r, c+1) and (r, c+1), (r+1, c), (r+1, c+1)
  const quadsY = GRID_ROWS - 1; // 44
  const quadsX = GRID_COLS - 1; // 30
  const vertexCount = quadsY * quadsX * 6;
  const vertexData = new Float32Array(vertexCount * 4); // [dst_x, dst_y, src_u, src_v]

  const planeSize = GRID_ROWS * GRID_COLS; // 45 * 31 = 1395

  let offset = 0;

  function getGridUV(r: number, c: number): [number, number] {
    const idx = r * GRID_COLS + c;
    const nx = gridData[idx]; // channel 0: x in [-1, 1]
    const ny = gridData[planeSize + idx]; // channel 1: y in [-1, 1]
    return [(nx + 1.0) / 2.0, (ny + 1.0) / 2.0];
  }

  function getClipPos(r: number, c: number): [number, number] {
    const x = (c / quadsX) * 2.0 - 1.0;
    const y = 1.0 - (r / quadsY) * 2.0; // Invert Y for WebGL clip coordinates
    return [x, y];
  }

  for (let r = 0; r < quadsY; r++) {
    for (let c = 0; c < quadsX; c++) {
      const p00 = getClipPos(r, c);
      const p10 = getClipPos(r + 1, c);
      const p01 = getClipPos(r, c + 1);
      const p11 = getClipPos(r + 1, c + 1);

      const uv00 = getGridUV(r, c);
      const uv10 = getGridUV(r + 1, c);
      const uv01 = getGridUV(r, c + 1);
      const uv11 = getGridUV(r + 1, c + 1);

      // Triangle 1: p00, p10, p01
      vertexData[offset++] = p00[0];
      vertexData[offset++] = p00[1];
      vertexData[offset++] = uv00[0];
      vertexData[offset++] = uv00[1];

      vertexData[offset++] = p10[0];
      vertexData[offset++] = p10[1];
      vertexData[offset++] = uv10[0];
      vertexData[offset++] = uv10[1];

      vertexData[offset++] = p01[0];
      vertexData[offset++] = p01[1];
      vertexData[offset++] = uv01[0];
      vertexData[offset++] = uv01[1];

      // Triangle 2: p01, p10, p11
      vertexData[offset++] = p01[0];
      vertexData[offset++] = p01[1];
      vertexData[offset++] = uv01[0];
      vertexData[offset++] = uv01[1];

      vertexData[offset++] = p10[0];
      vertexData[offset++] = p10[1];
      vertexData[offset++] = uv10[0];
      vertexData[offset++] = uv10[1];

      vertexData[offset++] = p11[0];
      vertexData[offset++] = p11[1];
      vertexData[offset++] = uv11[0];
      vertexData[offset++] = uv11[1];
    }
  }

  // Upload vertex data
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

  const stride = 4 * Float32Array.BYTES_PER_ELEMENT;
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, stride, 0);

  gl.enableVertexAttribArray(texLoc);
  gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);

  // Upload source image texture
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);

  gl.uniform1i(imageLoc, 0);

  gl.viewport(0, 0, dstWidth, dstHeight);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

  // Clean up WebGL resources
  gl.deleteBuffer(vbo);
  gl.deleteTexture(texture);
  gl.deleteProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  return outputCanvas;
}

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Could not create WebGL shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error('Shader compilation failed: ' + info);
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vs: WebGLShader,
  fs: WebGLShader
): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error('Could not create WebGL program');
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error('Program link failed: ' + info);
  }
  return program;
}

/**
 * Unwarps a document photo using UVDoc grid inference and WebGL mesh remapping.
 */
export async function unwarpDocument(
  sourceCanvas: OffscreenCanvas,
  session: ort.InferenceSession
): Promise<OffscreenCanvas> {
  const inputTensor = prepareInputTensor(sourceCanvas);

  try {
    const results = await session.run({ image: inputTensor });
    const outputTensor = results['grid_2d'] || Object.values(results)[0];

    if (!outputTensor || !(outputTensor.data instanceof Float32Array)) {
      throw new Error('UVDoc model did not return float32 grid tensor');
    }

    // outputTensor.data has shape [1, 2, 45, 31]
    return remapWithWebGL(
      sourceCanvas,
      outputTensor.data,
      sourceCanvas.width,
      sourceCanvas.height
    );
  } finally {
    inputTensor.dispose();
  }
}
