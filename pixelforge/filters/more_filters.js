/**
 * PixelForge — Advanced Filters
 * Sharpen, Sepia, Invert, Brightness & Contrast,
 * Cartoon, Vintage, Noise Reduction, Pixelate, Emboss, Oil Paint
 */
'use strict';

/* ─── Helper: clamp ──────────────────────────────────────────────────────── */
const clamp = (v, lo = 0, hi = 255) => Math.max(lo, Math.min(hi, v));

/* ─── Helper: convolution ────────────────────────────────────────────────── */
function convolve3x3(imageData, kernel, factor = 1, bias = 0) {
  const { data, width, height } = imageData;
  const out = new Uint8ClampedArray(data);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let r = 0, g = 0, b = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const w = kernel[(ky + 1) * 3 + (kx + 1)];
          r += data[idx]     * w;
          g += data[idx + 1] * w;
          b += data[idx + 2] * w;
        }
      }
      const base = (y * width + x) * 4;
      out[base]     = clamp(r * factor + bias);
      out[base + 1] = clamp(g * factor + bias);
      out[base + 2] = clamp(b * factor + bias);
      out[base + 3] = data[base + 3];
    }
  }
  imageData.data.set(out);
  return imageData;
}

/* ─── Sharpen ─────────────────────────────────────────────────────────────── */
const SharpenFilter = {
  name: 'Sharpen',
  apply(imageData, intensity = 60) {
    const w = 1 + (intensity / 100) * 7;
    const s = -(w - 1) / 4;
    const kernel = [0, s, 0, s, w, s, 0, s, 0];
    // normalize so sum=1
    return convolve3x3(imageData, kernel);
  },
};

/* ─── Brightness & Contrast ──────────────────────────────────────────────── */
const BrightnessContrastFilter = {
  name: 'Brightness & Contrast',
  apply(imageData, brightness = 0, contrast = 0) {
    const data = imageData.data;
    // brightness: -100..100 → -255..255
    const b = (brightness / 100) * 255;
    // contrast: -100..100 → factor
    const factor = contrast > 0
      ? (259 * (contrast + 255)) / (255 * (259 - contrast))
      : 1 + contrast / 100;
    for (let i = 0; i < data.length; i += 4) {
      data[i]     = clamp(factor * (data[i]     - 128) + 128 + b);
      data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128 + b);
      data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128 + b);
    }
    return imageData;
  },
};

/* ─── Sepia ──────────────────────────────────────────────────────────────── */
const SepiaFilter = {
  name: 'Sepia',
  apply(imageData, intensity = 100) {
    const data = imageData.data;
    const t = intensity / 100;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const sr = clamp(r * 0.393 + g * 0.769 + b * 0.189);
      const sg = clamp(r * 0.349 + g * 0.686 + b * 0.168);
      const sb = clamp(r * 0.272 + g * 0.534 + b * 0.131);
      data[i]     = r + (sr - r) * t;
      data[i + 1] = g + (sg - g) * t;
      data[i + 2] = b + (sb - b) * t;
    }
    return imageData;
  },
};

/* ─── Invert ─────────────────────────────────────────────────────────────── */
const InvertFilter = {
  name: 'Invert',
  apply(imageData) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i]     = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
    return imageData;
  },
};

/* ─── Cartoon Effect ─────────────────────────────────────────────────────── */
const CartoonFilter = {
  name: 'Cartoon',
  apply(imageData, intensity = 70) {
    const { data, width, height } = imageData;
    const levels = Math.max(2, Math.round(4 + (1 - intensity / 100) * 6));
    const step = 255 / levels;

    // 1) Posterize
    const posterized = new Uint8ClampedArray(data);
    for (let i = 0; i < posterized.length; i += 4) {
      posterized[i]     = Math.round(posterized[i]     / step) * step;
      posterized[i + 1] = Math.round(posterized[i + 1] / step) * step;
      posterized[i + 2] = Math.round(posterized[i + 2] / step) * step;
    }

    // 2) Detect edges (Sobel on original)
    const gray = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      gray[i] = data[i*4] * 0.299 + data[i*4+1] * 0.587 + data[i*4+2] * 0.114;
    }
    const sobelX = [-1,0,1,-2,0,2,-1,0,1];
    const sobelY = [-1,-2,-1,0,0,0,1,2,1];
    const edgeThreshold = 30 + (1 - intensity / 100) * 60;

    const out = new Uint8ClampedArray(data.length);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        for (let ky=-1; ky<=1; ky++) {
          for (let kx=-1; kx<=1; kx++) {
            const k = (ky+1)*3+(kx+1);
            const g = gray[(y+ky)*width+(x+kx)];
            gx += g * sobelX[k];
            gy += g * sobelY[k];
          }
        }
        const mag = Math.sqrt(gx*gx + gy*gy);
        const base = (y * width + x) * 4;
        if (mag > edgeThreshold) {
          out[base] = out[base+1] = out[base+2] = 0;
        } else {
          out[base]   = posterized[base];
          out[base+1] = posterized[base+1];
          out[base+2] = posterized[base+2];
        }
        out[base+3] = data[base+3];
      }
    }
    imageData.data.set(out);
    return imageData;
  },
};

/* ─── Vintage Filter ─────────────────────────────────────────────────────── */
const VintageFilter = {
  name: 'Vintage',
  apply(imageData, intensity = 80) {
    const data = imageData.data;
    const t = intensity / 100;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      // warm tone + fade
      const vr = clamp(r * 1.1 + 15);
      const vg = clamp(g * 0.9 + 5);
      const vb = clamp(b * 0.7);
      // slight sepia blend
      const sr = clamp(r * 0.393 + g * 0.769 + b * 0.189);
      const sg = clamp(r * 0.349 + g * 0.686 + b * 0.168);
      const sb = clamp(r * 0.272 + g * 0.534 + b * 0.131);
      data[i]     = r + (vr * 0.6 + sr * 0.4 - r) * t;
      data[i+1]   = g + (vg * 0.6 + sg * 0.4 - g) * t;
      data[i+2]   = b + (vb * 0.6 + sb * 0.4 - b) * t;
    }
    // Vignette
    const { width, height } = imageData;
    const cx = width / 2, cy = height / 2;
    const maxDist = Math.sqrt(cx*cx + cy*cy);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx*dx + dy*dy) / maxDist;
        const vignette = 1 - dist * dist * 0.7 * t;
        const base = (y * width + x) * 4;
        data[base]   = clamp(data[base]   * vignette);
        data[base+1] = clamp(data[base+1] * vignette);
        data[base+2] = clamp(data[base+2] * vignette);
      }
    }
    return imageData;
  },
};

/* ─── Noise Reduction (mean filter) ─────────────────────────────────────── */
const NoiseReductionFilter = {
  name: 'Noise Reduction',
  apply(imageData, intensity = 60) {
    // Use BlurFilter box blur for noise reduction
    const radius = Math.max(1, Math.round((intensity / 100) * 4));
    return BlurFilter.applyBox(imageData, radius);
  },
};

/* ─── Pixelate ───────────────────────────────────────────────────────────── */
const PixelateFilter = {
  name: 'Pixelate',
  apply(imageData, intensity = 50) {
    const { data, width, height } = imageData;
    const size = Math.max(2, Math.round((intensity / 100) * 30));
    const out = new Uint8ClampedArray(data);
    for (let y = 0; y < height; y += size) {
      for (let x = 0; x < width; x += size) {
        // Sample center pixel
        const cx = Math.min(x + Math.floor(size/2), width-1);
        const cy = Math.min(y + Math.floor(size/2), height-1);
        const c = (cy * width + cx) * 4;
        const r = data[c], g = data[c+1], b = data[c+2], a = data[c+3];
        // Fill block
        for (let by = y; by < Math.min(y+size, height); by++) {
          for (let bx = x; bx < Math.min(x+size, width); bx++) {
            const p = (by * width + bx) * 4;
            out[p] = r; out[p+1] = g; out[p+2] = b; out[p+3] = a;
          }
        }
      }
    }
    imageData.data.set(out);
    return imageData;
  },
};

/* ─── Emboss Filter ──────────────────────────────────────────────────────── */
const EmbossFilter = {
  name: 'Emboss',
  apply(imageData) {
    const kernel = [-2, -1, 0, -1, 1, 1, 0, 1, 2];
    return convolve3x3(imageData, kernel, 1, 128);
  },
};

/* ─── Oil Paint Effect ───────────────────────────────────────────────────── */
const OilPaintFilter = {
  name: 'Oil Paint',
  apply(imageData, intensity = 60) {
    const { data, width, height } = imageData;
    const radius = Math.max(1, Math.round((intensity / 100) * 4));
    const levels = 20;
    const out = new Uint8ClampedArray(data);

    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const rBins = new Int32Array(levels);
        const gBins = new Int32Array(levels);
        const bBins = new Int32Array(levels);
        const counts = new Int32Array(levels);
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const idx = ((y+ky)*width+(x+kx))*4;
            const r = data[idx], g = data[idx+1], b = data[idx+2];
            const lum = Math.floor(((r + g + b) / 3) * (levels - 1) / 255);
            rBins[lum] += r; gBins[lum] += g; bBins[lum] += b;
            counts[lum]++;
          }
        }
        let maxCount = 0, maxBin = 0;
        for (let l = 0; l < levels; l++) {
          if (counts[l] > maxCount) { maxCount = counts[l]; maxBin = l; }
        }
        const base = (y * width + x) * 4;
        const c = maxCount;
        out[base]   = clamp(rBins[maxBin] / c);
        out[base+1] = clamp(gBins[maxBin] / c);
        out[base+2] = clamp(bBins[maxBin] / c);
        out[base+3] = data[base+3];
      }
    }
    imageData.data.set(out);
    return imageData;
  },
};

/* ─── Warm / Cool Color Grading ──────────────────────────────────────────── */
const WarmFilter = {
  name: 'Warm',
  apply(imageData, intensity = 70) {
    const data = imageData.data;
    const t = intensity / 100;
    for (let i = 0; i < data.length; i += 4) {
      data[i]   = clamp(data[i]   + 30 * t);
      data[i+1] = clamp(data[i+1] + 10 * t);
      data[i+2] = clamp(data[i+2] - 20 * t);
    }
    return imageData;
  },
};

const CoolFilter = {
  name: 'Cool',
  apply(imageData, intensity = 70) {
    const data = imageData.data;
    const t = intensity / 100;
    for (let i = 0; i < data.length; i += 4) {
      data[i]   = clamp(data[i]   - 20 * t);
      data[i+1] = clamp(data[i+1] + 5  * t);
      data[i+2] = clamp(data[i+2] + 35 * t);
    }
    return imageData;
  },
};
