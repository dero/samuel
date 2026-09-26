/**
 * Canvas image processing utilities for RGB and CMY channel filtering.
 */

export interface ColorFilterState {
  model: 'rgb' | 'cmy';
  r: boolean;
  g: boolean;
  b: boolean;
  c: boolean;
  m: boolean;
  y: boolean;
}

/**
 * Applies RGB channel pass-through filter directly to ImageData pixel buffer.
 * If a channel is disabled, its component value is set to 0.
 */
export function applyRgbFilter(
  source: Uint8ClampedArray,
  target: Uint8ClampedArray,
  r: boolean,
  g: boolean,
  b: boolean
): void {
  const len = source.length;
  for (let i = 0; i < len; i += 4) {
    target[i] = r ? source[i] : 0;         // Red
    target[i + 1] = g ? source[i + 1] : 0; // Green
    target[i + 2] = b ? source[i + 2] : 0; // Blue
    target[i + 3] = source[i + 3];         // Alpha
  }
}

/**
 * Applies subtractive CMY print-plate filter.
 * In a subtractive model, ink absorbs light:
 *   Cyan absorbs Red:     C = 255 - R
 *   Magenta absorbs Green: M = 255 - G
 *   Yellow absorbs Blue:   Y = 255 - B
 * If an ink plate is disabled (removed), that ink is not printed (absorbance = 0),
 * meaning the reflected light channel returns to full paper reflectance (255):
 *   R' = c ? R : 255
 *   G' = m ? G : 255
 *   B' = y ? B : 255
 */
export function applyCmyFilter(
  source: Uint8ClampedArray,
  target: Uint8ClampedArray,
  c: boolean,
  m: boolean,
  y: boolean
): void {
  const len = source.length;
  for (let i = 0; i < len; i += 4) {
    target[i] = c ? source[i] : 255;         // Without Cyan, Red is not absorbed
    target[i + 1] = m ? source[i + 1] : 255; // Without Magenta, Green is not absorbed
    target[i + 2] = y ? source[i + 2] : 255; // Without Yellow, Blue is not absorbed
    target[i + 3] = source[i + 3];           // Alpha
  }
}

/**
 * Scales an image down to fit within maxDimension to ensure 60fps canvas operations on mobile devices.
 */
export function getScaledDimensions(
  origWidth: number,
  origHeight: number,
  maxDimension: number = 1600
): { width: number; height: number } {
  if (origWidth <= maxDimension && origHeight <= maxDimension) {
    return { width: origWidth, height: origHeight };
  }
  const ratio = Math.min(maxDimension / origWidth, maxDimension / origHeight);
  return {
    width: Math.round(origWidth * ratio),
    height: Math.round(origHeight * ratio)
  };
}
