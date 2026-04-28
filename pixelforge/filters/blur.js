/**
 * PixelForge — Blur Filters
 * Implements Box Blur and Gaussian Blur via convolution.
 */
'use strict';

const BlurFilter = {
  name: 'Blur',

  /**
   * Box blur — fast approximation
   * @param {ImageData} imageData
   * @param {number} radius  1..20
   * @returns {ImageData}
   */
  applyBox(imageData, radius = 3) {
    const { width, height, data } = imageData;
    const out = new Uint8ClampedArray(data);
    const r = Math.max(1, Math.round(radius));
    const size = 2 * r + 1;
    const invSize = 1 / (size * size);

    // Horizontal pass
    const tmp = new Uint8ClampedArray(data.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sr = 0, sg = 0, sb = 0, sa = 0, count = 0;
        for (let kx = -r; kx <= r; kx++) {
          const nx = Math.max(0, Math.min(width - 1, x + kx));
          const idx = (y * width + nx) * 4;
          sr += data[idx];
          sg += data[idx + 1];
          sb += data[idx + 2];
          sa += data[idx + 3];
          count++;
        }
        const base = (y * width + x) * 4;
        tmp[base]     = sr / count;
        tmp[base + 1] = sg / count;
        tmp[base + 2] = sb / count;
        tmp[base + 3] = sa / count;
      }
    }
    // Vertical pass
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let sr = 0, sg = 0, sb = 0, sa = 0, count = 0;
        for (let ky = -r; ky <= r; ky++) {
          const ny = Math.max(0, Math.min(height - 1, y + ky));
          const idx = (ny * width + x) * 4;
          sr += tmp[idx];
          sg += tmp[idx + 1];
          sb += tmp[idx + 2];
          sa += tmp[idx + 3];
          count++;
        }
        const base = (y * width + x) * 4;
        out[base]     = sr / count;
        out[base + 1] = sg / count;
        out[base + 2] = sb / count;
        out[base + 3] = sa / count;
      }
    }
    imageData.data.set(out);
    return imageData;
  },

  /**
   * Apply blur to imageData
   * @param {ImageData} imageData
   * @param {number} intensity  0..100
   * @returns {ImageData}
   */
  apply(imageData, intensity = 50) {
    const radius = Math.max(1, Math.round((intensity / 100) * 12));
    return this.applyBox(imageData, radius);
  },
};
