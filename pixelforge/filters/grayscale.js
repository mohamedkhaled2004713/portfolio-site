/**
 * PixelForge — Grayscale Filter
 * Converts image pixels to grayscale using luminance formula.
 */
'use strict';

const GrayscaleFilter = {
  name: 'Grayscale',

  /**
   * Apply grayscale to ImageData
   * @param {ImageData} imageData
   * @returns {ImageData}
   */
  apply(imageData) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Luminance-weighted average (BT.601)
      const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i]     = lum; // R
      data[i + 1] = lum; // G
      data[i + 2] = lum; // B
      // Alpha (i+3) unchanged
    }
    return imageData;
  },
};
