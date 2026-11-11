import { toast } from '../../state/toast.svelte';
import { getScaledDimensions } from './colorsFilter';

// The photo is a podklad: not saved to disk, but kept for the whole app session so it
// survives switching modules. Never cleared on visibilitychange: opening the camera hides the page.
class ColorsPhoto {
  /** Downscaled pixels the channel filters read from. */
  source = $state.raw<ImageData | null>(null);
  /** Object URL of the original file, for the podklad sheet preview. */
  previewUrl = $state<string | null>(null);
  /** Set synchronously, so the podklad is not "missing" while the photo decodes. */
  loading = $state(false);

  async load(file: File) {
    this.loading = true;
    const url = URL.createObjectURL(file);
    try {
      const img = await decodeImage(url);
      const { width, height } = getScaledDimensions(img.naturalWidth, img.naturalHeight, 1600);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('2D context unavailable');
      ctx.drawImage(img, 0, 0, width, height);
      const data = ctx.getImageData(0, 0, width, height);

      this.clear();
      this.source = data;
      this.previewUrl = url;
    } catch {
      URL.revokeObjectURL(url);
      toast.show('Fotku nelze načíst', { type: 'danger' });
    } finally {
      this.loading = false;
    }
  }

  clear() {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
    this.source = null;
  }
}

function decodeImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export const colorsPhoto = new ColorsPhoto();
