/**
 * PixelForge — Edge Detection Filter
 * Implements Sobel operator for edge detection.
 */
'use strict';

const EdgeFilter = {
  name: 'Edge Detection',

  /**
   * Convolve image with 3x3 kernel
   * @param {Uint8ClampedArray} data   source pixel data
   * @param {number} width
   * @param {number} height
   * @param {number[]} kernel          3x3 kernel (row-major)
   * @param {number} channel           0=R, 1=G, 2=B
   * @returns {Float32Array}           convolved channel
   */
  _convolve(data, width, height, kernel, channel) {
    const result = new Float32Array(width * height);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const px = (( y + ky) * width + (x + kx)) * 4 + channel;
            sum += data[px] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        result[y * width + x] = sum;
      }
    }
    return result;
  },

  /**
   * Apply Sobel edge detection
   * @param {ImageData} imageData
   * @param {number} intensity  0..100
   * @returns {ImageData}
   */
  apply(imageData, intensity = 80) {
    const { data, width, height } = imageData;
    const threshold = (1 - intensity / 100) * 80;

    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    // Convert to grayscale first
    const gray = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const p = i * 4;
      gray[i] = data[p] * 0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114;
    }

    const out = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i += 4) {
      out[i + 3] = data[i + 3]; // preserve alpha
    }

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const g = gray[(y + ky) * width + (x + kx)];
            const k = (ky + 1) * 3 + (kx + 1);
            gx += g * sobelX[k];
            gy += g * sobelY[k];
          }
        }
        const mag = Math.min(255, Math.sqrt(gx * gx + gy * gy));
        const val = mag > threshold ? 255 : 0;
        const idx = (y * width + x) * 4;
        out[idx] = out[idx + 1] = out[idx + 2] = val;
      }
    }
    imageData.data.set(out);
    return imageData;
  },
};
