/**
 * Minimal incremental SHA-256 (FIPS 180-4) for streaming digest computation.
 * WebCrypto's SubtleCrypto.digest() has no incremental/streaming variant, so a
 * pure-JS implementation is used to hash the words.db download as it streams
 * into OPFS, without ever holding the whole file in memory just to hash it.
 */

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

function rotr(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

/**
 * Incremental SHA-256 hasher: call update() repeatedly with each chunk as it
 * arrives (e.g. from a fetch ReadableStream), then hexDigest() once at the end.
 */
export class Sha256Incremental {
  private h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ]);
  private buffer = new Uint8Array(64);
  private bufferLen = 0;
  private totalLenLow = 0;
  private totalLenHigh = 0;
  private readonly w = new Uint32Array(64);

  update(data: Uint8Array): void {
    let offset = 0;
    const len = data.length;

    // Track total bit length as a 64-bit counter split across two 32-bit words.
    const addedBits = len * 8;
    const newLow = this.totalLenLow + addedBits;
    this.totalLenHigh = (this.totalLenHigh + Math.floor(newLow / 0x100000000)) >>> 0;
    this.totalLenLow = newLow >>> 0;

    if (this.bufferLen > 0) {
      const needed = 64 - this.bufferLen;
      const take = Math.min(needed, len);
      this.buffer.set(data.subarray(0, take), this.bufferLen);
      this.bufferLen += take;
      offset += take;
      if (this.bufferLen === 64) {
        this.processBlock(this.buffer, 0);
        this.bufferLen = 0;
      }
    }

    while (len - offset >= 64) {
      this.processBlock(data, offset);
      offset += 64;
    }

    if (offset < len) {
      const remaining = len - offset;
      this.buffer.set(data.subarray(offset), 0);
      this.bufferLen = remaining;
    }
  }

  hexDigest(): string {
    // Padding: 0x80, zeros, then 64-bit big-endian bit length.
    const bitLenHigh = this.totalLenHigh;
    const bitLenLow = this.totalLenLow;

    const padLen = this.bufferLen < 56 ? 56 - this.bufferLen : 120 - this.bufferLen;
    const pad = new Uint8Array(padLen + 8);
    pad[0] = 0x80;
    const view = new DataView(pad.buffer);
    view.setUint32(pad.length - 8, bitLenHigh, false);
    view.setUint32(pad.length - 4, bitLenLow, false);

    // Feed padding through the normal update-like path, but without touching
    // the bit-length counters again (they're already finalized above).
    let offset = 0;
    const combined = new Uint8Array(this.bufferLen + pad.length);
    combined.set(this.buffer.subarray(0, this.bufferLen), 0);
    combined.set(pad, this.bufferLen);
    while (offset < combined.length) {
      this.processBlock(combined, offset);
      offset += 64;
    }

    const out = new Uint8Array(32);
    const outView = new DataView(out.buffer);
    for (let i = 0; i < 8; i++) outView.setUint32(i * 4, this.h[i], false);
    return Array.from(out)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private processBlock(data: Uint8Array, start: number): void {
    const w = this.w;
    for (let i = 0; i < 16; i++) {
      const o = start + i * 4;
      w[i] = ((data[o] << 24) | (data[o + 1] << 16) | (data[o + 2] << 8) | data[o + 3]) >>> 0;
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = this.h;

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    this.h[0] = (this.h[0] + a) >>> 0;
    this.h[1] = (this.h[1] + b) >>> 0;
    this.h[2] = (this.h[2] + c) >>> 0;
    this.h[3] = (this.h[3] + d) >>> 0;
    this.h[4] = (this.h[4] + e) >>> 0;
    this.h[5] = (this.h[5] + f) >>> 0;
    this.h[6] = (this.h[6] + g) >>> 0;
    this.h[7] = (this.h[7] + h) >>> 0;
  }
}

/** One-shot convenience wrapper (used by tests / small buffers). */
export function sha256Hex(data: Uint8Array): string {
  const hasher = new Sha256Incremental();
  hasher.update(data);
  return hasher.hexDigest();
}
