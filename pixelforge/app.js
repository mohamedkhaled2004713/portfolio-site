/**
 * PixelForge — Main Application Controller
 * Real-time image filtering using Canvas API
 * Author: Mohamed Khaled
 */
'use strict';

/* ═══════════════════════════════════════════════════════════════════════════
   FILTER REGISTRY
   ═══════════════════════════════════════════════════════════════════════════ */
const FILTER_REGISTRY = [
  {
    id: 'grayscale',
    name: 'Grayscale',
    icon: '🌑',
    group: 'basic',
    applyFn: (id, iv) => id => GrayscaleFilter.apply(id),
    fn: (imageData) => GrayscaleFilter.apply(imageData),
  },
  {
    id: 'blur',
    name: 'Blur',
    icon: '💨',
    group: 'basic',
    fn: (imageData, adjustments) => BlurFilter.apply(imageData, adjustments.blur ?? 50),
  },
  {
    id: 'edge',
    name: 'Edge Detect',
    icon: '🔲',
    group: 'advanced',
    fn: (imageData, adjustments) => EdgeFilter.apply(imageData, adjustments.intensity ?? 80),
  },
  {
    id: 'sharpen',
    name: 'Sharpen',
    icon: '🔪',
    group: 'basic',
    fn: (imageData, adjustments) => SharpenFilter.apply(imageData, adjustments.intensity ?? 60),
  },
  {
    id: 'brightness',
    name: 'Brightness',
    icon: '☀️',
    group: 'adjust',
    fn: (imageData, adjustments) => BrightnessContrastFilter.apply(imageData, adjustments.brightness ?? 30, 0),
  },
  {
    id: 'contrast',
    name: 'Contrast',
    icon: '◑',
    group: 'adjust',
    fn: (imageData, adjustments) => BrightnessContrastFilter.apply(imageData, 0, adjustments.contrast ?? 40),
  },
  {
    id: 'sepia',
    name: 'Sepia',
    icon: '🟫',
    group: 'tone',
    fn: (imageData, adjustments) => SepiaFilter.apply(imageData, adjustments.intensity ?? 100),
  },
  {
    id: 'invert',
    name: 'Invert',
    icon: '🔄',
    group: 'basic',
    fn: (imageData) => InvertFilter.apply(imageData),
  },
  {
    id: 'cartoon',
    name: 'Cartoon 🔥',
    icon: '🎨',
    group: 'advanced',
    fn: (imageData, adjustments) => CartoonFilter.apply(imageData, adjustments.intensity ?? 70),
    badge: 'HOT',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    icon: '📷',
    group: 'tone',
    fn: (imageData, adjustments) => VintageFilter.apply(imageData, adjustments.intensity ?? 80),
  },
  {
    id: 'noise',
    name: 'Denoise',
    icon: '🧹',
    group: 'advanced',
    fn: (imageData, adjustments) => NoiseReductionFilter.apply(imageData, adjustments.intensity ?? 60),
  },
  {
    id: 'pixelate',
    name: 'Pixelate',
    icon: '🟦',
    group: 'advanced',
    fn: (imageData, adjustments) => PixelateFilter.apply(imageData, adjustments.intensity ?? 50),
  },
  {
    id: 'emboss',
    name: 'Emboss',
    icon: '🗿',
    group: 'advanced',
    fn: (imageData) => EmbossFilter.apply(imageData),
  },
  {
    id: 'oilpaint',
    name: 'Oil Paint',
    icon: '🖌️',
    group: 'advanced',
    fn: (imageData, adjustments) => OilPaintFilter.apply(imageData, adjustments.intensity ?? 60),
    badge: 'PRO',
  },
  {
    id: 'warm',
    name: 'Warm',
    icon: '🌅',
    group: 'tone',
    fn: (imageData, adjustments) => WarmFilter.apply(imageData, adjustments.intensity ?? 70),
  },
  {
    id: 'cool',
    name: 'Cool',
    icon: '🌊',
    group: 'tone',
    fn: (imageData, adjustments) => CoolFilter.apply(imageData, adjustments.intensity ?? 70),
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   PRESET REGISTRY
   ═══════════════════════════════════════════════════════════════════════════ */
const PRESETS = [
  {
    id: 'cinematic',
    name: 'Cinematic',
    emoji: '🎬',
    desc: 'Movie look',
    color: 'linear-gradient(90deg,#f59e0b,#ef4444)',
    filters: ['contrast', 'vintage'],
    adjustments: { contrast: 35, intensity: 60 },
  },
  {
    id: 'noir',
    name: 'Noir',
    emoji: '🌑',
    desc: 'Classic black & white',
    color: 'linear-gradient(90deg,#374151,#111827)',
    filters: ['grayscale', 'contrast'],
    adjustments: { contrast: 50 },
  },
  {
    id: 'dreamy',
    name: 'Dreamy',
    emoji: '✨',
    desc: 'Soft glow',
    color: 'linear-gradient(90deg,#a855f7,#ec4899)',
    filters: ['blur', 'warm'],
    adjustments: { blur: 15, intensity: 50 },
  },
  {
    id: 'retro',
    name: 'Retro',
    emoji: '📻',
    desc: 'Old school vibes',
    color: 'linear-gradient(90deg,#d97706,#92400e)',
    filters: ['sepia', 'contrast'],
    adjustments: { intensity: 80, contrast: 20 },
  },
  {
    id: 'comic',
    name: 'Comic',
    emoji: '💥',
    desc: 'Cartoon style',
    color: 'linear-gradient(90deg,#06b6d4,#6366f1)',
    filters: ['cartoon'],
    adjustments: { intensity: 80 },
  },
  {
    id: 'ghost',
    name: 'Ghost',
    emoji: '👻',
    desc: 'Ethereal look',
    color: 'linear-gradient(90deg,#e0f2fe,#94a3b8)',
    filters: ['invert', 'blur'],
    adjustments: { blur: 10 },
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    emoji: '🤖',
    desc: 'Neon future',
    color: 'linear-gradient(90deg,#a855f7,#06b6d4)',
    filters: ['cool', 'edge'],
    adjustments: { intensity: 60 },
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    emoji: '🎨',
    desc: 'Painted style',
    color: 'linear-gradient(90deg,#34d399,#06b6d4)',
    filters: ['oilpaint', 'warm'],
    adjustments: { intensity: 40 },
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   ADJUSTMENT CONTROLS CONFIG
   ═══════════════════════════════════════════════════════════════════════════ */
const ADJUSTMENTS_CONFIG = [
  { key: 'brightness', label: 'Brightness', min: -100, max: 100, default: 0, unit: '' },
  { key: 'contrast',   label: 'Contrast',   min: -100, max: 100, default: 0, unit: '' },
  { key: 'blur',       label: 'Blur Radius', min: 0,   max: 100, default: 0, unit: '' },
  { key: 'intensity',  label: 'Intensity',  min: 0,    max: 100, default: 70, unit: '%' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   APPLICATION STATE
   ═══════════════════════════════════════════════════════════════════════════ */
const State = {
  originalImage: null,       // HTMLImageElement
  sourceFile: null,          // File object
  activeFilters: new Set(),  // Set of filter IDs
  stackMode: false,          // allow multiple filters
  adjustments: {             // slider values
    brightness: 0,
    contrast: 0,
    blur: 0,
    intensity: 70,
  },
  globalIntensity: 100,      // 0..100
  activePreset: null,
  splitPosition: 50,         // split view %
  isDraggingSplit: false,
  viewMode: 'single',        // 'single' | 'compare' | 'split'
  processing: false,
  renderedBlob: null,
};

/* ═══════════════════════════════════════════════════════════════════════════
   DOM REFERENCES
   ═══════════════════════════════════════════════════════════════════════════ */
const Dom = {
  uploadSection:     document.getElementById('upload-section'),
  editorSection:     document.getElementById('editor-section'),
  dropZone:          document.getElementById('drop-zone'),
  fileInput:         document.getElementById('file-input'),
  btnBrowse:         document.getElementById('btn-browse'),
  filterGrid:        document.getElementById('filter-grid'),
  slidersContainer:  document.getElementById('sliders-container'),
  presetGrid:        document.getElementById('preset-grid'),
  multiToggle:       document.getElementById('multi-filter-toggle'),
  activeFilterCount: document.getElementById('active-filter-count'),
  globalIntensity:   document.getElementById('global-intensity'),
  intensityValue:    document.getElementById('intensity-value'),
  outputCanvas:      document.getElementById('output-canvas'),
  canvasOriginal:    document.getElementById('canvas-original'),
  canvasFiltered:    document.getElementById('canvas-filtered'),
  canvasSplitBase:   document.getElementById('canvas-split-base'),
  canvasSplitOverlay:document.getElementById('canvas-split-overlay'),
  splitHandle:       document.getElementById('split-handle'),
  singleView:        document.getElementById('single-view'),
  compareView:       document.getElementById('compare-view'),
  splitView:         document.getElementById('split-view'),
  processingBadge:   document.getElementById('processing-badge'),
  infoDimensions:    document.getElementById('info-dimensions'),
  infoSize:          document.getElementById('info-size'),
  infoFilter:        document.getElementById('info-filter'),
  btnSingle:         document.getElementById('btn-single'),
  btnCompare:        document.getElementById('btn-compare'),
  btnSplitview:      document.getElementById('btn-splitview'),
  btnDownload:       document.getElementById('btn-download'),
  btnDownloadPanel:  document.getElementById('btn-download-panel'),
  btnNewImage:       document.getElementById('btn-new-image'),
  btnResetAll:       document.getElementById('btn-reset-all'),
  btnClearFilters:   document.getElementById('btn-clear-filters'),
  btnRandomFilter:   document.getElementById('btn-random-filter'),
  exportFormat:      document.getElementById('export-format'),
  exportQuality:     document.getElementById('export-quality'),
  qualityValue:      document.getElementById('quality-value'),
  qualityRow:        document.getElementById('quality-row'),
  histogramCanvas:   document.getElementById('histogram-canvas'),
  toastContainer:    document.getElementById('toast-container'),
};

/* ═══════════════════════════════════════════════════════════════════════════
   TOAST SYSTEM
   ═══════════════════════════════════════════════════════════════════════════ */
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon"></span><span>${message}</span>`;
  Dom.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

/* ═══════════════════════════════════════════════════════════════════════════
   IMAGE LOADING
   ═══════════════════════════════════════════════════════════════════════════ */
function loadImageFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('Please upload a valid image file (JPG, PNG, WEBP, GIF)', 'error');
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    showToast('File too large. Maximum size is 20MB.', 'error');
    return;
  }
  State.sourceFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      State.originalImage = img;
      State.activeFilters.clear();
      State.activePreset = null;
      updateFilterCards();
      updatePresetCards();
      showEditor();
      updateInfoBar();
      drawOutput();
      drawHistogram();
      showToast(`Image loaded: ${img.width}×${img.height}`, 'success');
    };
    img.onerror = () => showToast('Failed to load image.', 'error');
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* ═══════════════════════════════════════════════════════════════════════════
   CANVAS DRAWING
   ═══════════════════════════════════════════════════════════════════════════ */
function getImageDataFromImage(img, canvas) {
  canvas.width  = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function applyFiltersToImageData(imageData) {
  if (State.activeFilters.size === 0 && State.adjustments.brightness === 0 && State.adjustments.contrast === 0) {
    return imageData;
  }
  const filtersToApply = FILTER_REGISTRY.filter(f => State.activeFilters.has(f.id));

  // Apply brightness/contrast globally if set (separate from filter selection)
  let data = imageData;
  if ((State.adjustments.brightness !== 0 || State.adjustments.contrast !== 0) && !State.activeFilters.has('brightness') && !State.activeFilters.has('contrast')) {
    data = BrightnessContrastFilter.apply(data, State.adjustments.brightness, State.adjustments.contrast);
  }

  for (const filter of filtersToApply) {
    try {
      data = filter.fn(data, State.adjustments);
    } catch (err) {
      console.warn(`Filter "${filter.name}" failed:`, err);
    }
  }
  return data;
}

let renderTimer = null;
function scheduleRender() {
  if (renderTimer) clearTimeout(renderTimer);
  renderTimer = setTimeout(() => drawOutput(), 16);
}

function drawOutput() {
  if (!State.originalImage) return;
  State.processing = true;
  Dom.processingBadge.classList.add('visible');

  // Use requestAnimationFrame for smooth rendering
  requestAnimationFrame(() => {
    try {
      _doRender();
    } finally {
      State.processing = false;
      Dom.processingBadge.classList.remove('visible');
    }
  });
}

function _doRender() {
  const img = State.originalImage;

  if (State.viewMode === 'single') {
    // Render filtered image to output canvas
    const canvas = Dom.outputCanvas;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    if (State.activeFilters.size > 0 || State.adjustments.brightness !== 0 || State.adjustments.contrast !== 0) {
      let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      imgData = applyFiltersToImageData(imgData);
      // Apply global intensity blend
      const gi = State.globalIntensity / 100;
      if (gi < 1) {
        const orig = getImageDataFromImage(img, document.createElement('canvas'));
        for (let i = 0; i < imgData.data.length; i += 4) {
          imgData.data[i]   = orig.data[i]   * (1-gi) + imgData.data[i]   * gi;
          imgData.data[i+1] = orig.data[i+1] * (1-gi) + imgData.data[i+1] * gi;
          imgData.data[i+2] = orig.data[i+2] * (1-gi) + imgData.data[i+2] * gi;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }
  } else if (State.viewMode === 'compare') {
    // Original
    const ctxO = Dom.canvasOriginal.getContext('2d');
    Dom.canvasOriginal.width = img.naturalWidth;
    Dom.canvasOriginal.height = img.naturalHeight;
    ctxO.drawImage(img, 0, 0);
    // Filtered
    const ctxF = Dom.canvasFiltered.getContext('2d', { willReadFrequently: true });
    Dom.canvasFiltered.width = img.naturalWidth;
    Dom.canvasFiltered.height = img.naturalHeight;
    ctxF.drawImage(img, 0, 0);
    if (State.activeFilters.size > 0) {
      let imgData = ctxF.getImageData(0, 0, Dom.canvasFiltered.width, Dom.canvasFiltered.height);
      imgData = applyFiltersToImageData(imgData);
      ctxF.putImageData(imgData, 0, 0);
    }
  } else if (State.viewMode === 'split') {
    // Base (original)
    const ctxB = Dom.canvasSplitBase.getContext('2d');
    Dom.canvasSplitBase.width = img.naturalWidth;
    Dom.canvasSplitBase.height = img.naturalHeight;
    ctxB.drawImage(img, 0, 0);
    // Overlay (filtered)
    const ctxOv = Dom.canvasSplitOverlay.getContext('2d', { willReadFrequently: true });
    Dom.canvasSplitOverlay.width = img.naturalWidth;
    Dom.canvasSplitOverlay.height = img.naturalHeight;
    ctxOv.drawImage(img, 0, 0);
    if (State.activeFilters.size > 0) {
      let imgData = ctxOv.getImageData(0, 0, Dom.canvasSplitOverlay.width, Dom.canvasSplitOverlay.height);
      imgData = applyFiltersToImageData(imgData);
      ctxOv.putImageData(imgData, 0, 0);
    }
    updateSplitClip();
  }

  updateDownloadButtons();
  updateInfoBar();
}

function updateSplitClip() {
  const pct = State.splitPosition;
  Dom.canvasSplitOverlay.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
  Dom.splitHandle.style.left = `${pct}%`;
  Dom.splitHandle.setAttribute('aria-valuenow', Math.round(pct));
}

function drawHistogram() {
  if (!State.originalImage) return;
  const tmpCanvas = document.createElement('canvas');
  const img = State.originalImage;
  tmpCanvas.width = img.naturalWidth;
  tmpCanvas.height = img.naturalHeight;
  const tmpCtx = tmpCanvas.getContext('2d', { willReadFrequently: true });
  tmpCtx.drawImage(img, 0, 0);
  const imgData = tmpCtx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height);
  const data = imgData.data;

  const bins = 64;
  const rHist = new Float32Array(bins);
  const gHist = new Float32Array(bins);
  const bHist = new Float32Array(bins);

  for (let i = 0; i < data.length; i += 4) {
    rHist[Math.floor(data[i]   / 256 * bins)]++;
    gHist[Math.floor(data[i+1] / 256 * bins)]++;
    bHist[Math.floor(data[i+2] / 256 * bins)]++;
  }
  const maxVal = Math.max(...rHist, ...gHist, ...bHist);

  const hCtx = Dom.histogramCanvas.getContext('2d');
  const w = Dom.histogramCanvas.width;
  const h = Dom.histogramCanvas.height;
  hCtx.clearRect(0, 0, w, h);

  const barW = w / bins;
  [
    { hist: rHist, color: 'rgba(239,68,68,0.7)' },
    { hist: gHist, color: 'rgba(34,197,94,0.7)' },
    { hist: bHist, color: 'rgba(99,102,241,0.7)' },
  ].forEach(({ hist, color }) => {
    hCtx.fillStyle = color;
    for (let i = 0; i < bins; i++) {
      const barH = (hist[i] / maxVal) * h;
      hCtx.fillRect(i * barW, h - barH, barW, barH);
    }
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   UI BUILD
   ═══════════════════════════════════════════════════════════════════════════ */
function buildFilterGrid() {
  Dom.filterGrid.innerHTML = '';
  FILTER_REGISTRY.forEach(filter => {
    const card = document.createElement('div');
    card.className = 'filter-card';
    card.dataset.filterId = filter.id;
    card.setAttribute('role', 'option');
    card.setAttribute('aria-selected', 'false');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${filter.name} filter`);
    card.innerHTML = `
      <div class="filter-check" aria-hidden="true">
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M1 4l2 2 4-4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="filter-icon">${filter.icon}</div>
      <div class="filter-name">${filter.name}</div>
    `;
    card.addEventListener('click', () => toggleFilter(filter.id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFilter(filter.id); }
    });
    Dom.filterGrid.appendChild(card);
  });
}

function buildSlidersContainer() {
  Dom.slidersContainer.innerHTML = '';
  ADJUSTMENTS_CONFIG.forEach(cfg => {
    const group = document.createElement('div');
    group.className = 'slider-group';
    group.innerHTML = `
      <div class="slider-row">
        <label class="slider-label" for="slider-${cfg.key}">${cfg.label}</label>
        <span class="slider-val" id="val-${cfg.key}">${State.adjustments[cfg.key]}${cfg.unit}</span>
      </div>
      <input
        type="range"
        class="range-input"
        id="slider-${cfg.key}"
        min="${cfg.min}"
        max="${cfg.max}"
        value="${State.adjustments[cfg.key]}"
        aria-label="${cfg.label}"
        aria-valuemin="${cfg.min}"
        aria-valuemax="${cfg.max}"
        aria-valuenow="${State.adjustments[cfg.key]}"
      />
    `;
    const input = group.querySelector('input');
    const valSpan = group.querySelector('.slider-val');
    input.addEventListener('input', () => {
      const v = Number(input.value);
      State.adjustments[cfg.key] = v;
      valSpan.textContent = v + cfg.unit;
      updateRangeFill(input);
      scheduleRender();
    });
    updateRangeFill(input);
    Dom.slidersContainer.appendChild(group);
  });
}

function buildPresetGrid() {
  Dom.presetGrid.innerHTML = '';
  PRESETS.forEach(preset => {
    const card = document.createElement('div');
    card.className = 'preset-card';
    card.dataset.presetId = preset.id;
    card.style.setProperty('--preset-color', preset.color);
    card.setAttribute('role', 'option');
    card.setAttribute('aria-selected', 'false');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${preset.name} preset`);
    card.innerHTML = `
      <span class="preset-emoji">${preset.emoji}</span>
      <span class="preset-name">${preset.name}</span>
      <span class="preset-desc">${preset.desc}</span>
    `;
    card.addEventListener('click', () => applyPreset(preset.id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); applyPreset(preset.id); }
    });
    Dom.presetGrid.appendChild(card);
  });
}

function updateRangeFill(input) {
  const min = Number(input.min);
  const max = Number(input.max);
  const val = Number(input.value);
  const pct = ((val - min) / (max - min)) * 100;
  input.style.setProperty('--fill', `${pct}%`);
  input.setAttribute('aria-valuenow', val);
}

/* ═══════════════════════════════════════════════════════════════════════════
   FILTER LOGIC
   ═══════════════════════════════════════════════════════════════════════════ */
function toggleFilter(filterId) {
  if (State.activeFilters.has(filterId)) {
    State.activeFilters.delete(filterId);
  } else {
    if (!State.stackMode) State.activeFilters.clear();
    State.activeFilters.add(filterId);
  }
  State.activePreset = null;
  updateFilterCards();
  updatePresetCards();
  scheduleRender();
}

function applyPreset(presetId) {
  const preset = PRESETS.find(p => p.id === presetId);
  if (!preset) return;
  if (State.activePreset === presetId) {
    // Toggle off
    State.activePreset = null;
    State.activeFilters.clear();
    Object.assign(State.adjustments, { brightness: 0, contrast: 0, blur: 0, intensity: 70 });
  } else {
    State.activePreset = presetId;
    State.activeFilters.clear();
    preset.filters.forEach(f => State.activeFilters.add(f));
    Object.assign(State.adjustments, { brightness: 0, contrast: 0, blur: 0, intensity: 70 }, preset.adjustments);
  }
  updateFilterCards();
  updatePresetCards();
  syncSliders();
  scheduleRender();
  if (State.activePreset) showToast(`Preset applied: ${preset.name}`, 'success');
}

function updateFilterCards() {
  Dom.filterGrid.querySelectorAll('.filter-card').forEach(card => {
    const id = card.dataset.filterId;
    const active = State.activeFilters.has(id);
    card.classList.toggle('active', active);
    card.setAttribute('aria-selected', active);
  });
  const count = State.activeFilters.size;
  Dom.activeFilterCount.textContent = count === 0 ? 'None active' : `${count} active`;
}

function updatePresetCards() {
  Dom.presetGrid.querySelectorAll('.preset-card').forEach(card => {
    const id = card.dataset.presetId;
    const active = State.activePreset === id;
    card.classList.toggle('active', active);
    card.setAttribute('aria-selected', active);
  });
}

function syncSliders() {
  ADJUSTMENTS_CONFIG.forEach(cfg => {
    const input = document.getElementById(`slider-${cfg.key}`);
    const val   = document.getElementById(`val-${cfg.key}`);
    if (!input || !val) return;
    input.value = State.adjustments[cfg.key];
    val.textContent = State.adjustments[cfg.key] + cfg.unit;
    updateRangeFill(input);
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   VIEW MODES
   ═══════════════════════════════════════════════════════════════════════════ */
function setViewMode(mode) {
  State.viewMode = mode;
  Dom.singleView.classList.toggle('hidden',  mode !== 'single');
  Dom.compareView.classList.toggle('hidden', mode !== 'compare');
  Dom.splitView.classList.toggle('hidden',   mode !== 'split');
  [Dom.btnSingle, Dom.btnCompare, Dom.btnSplitview].forEach((btn, i) => {
    const modes = ['single', 'compare', 'split'];
    btn.classList.toggle('active', modes[i] === mode);
    btn.setAttribute('aria-pressed', modes[i] === mode);
  });
  drawOutput();
}

/* ═══════════════════════════════════════════════════════════════════════════
   SPLIT SLIDER
   ═══════════════════════════════════════════════════════════════════════════ */
function initSplitSlider() {
  const splitView = Dom.splitView;
  const handle    = Dom.splitHandle;

  const getPercent = (clientX) => {
    const rect = splitView.getBoundingClientRect();
    return Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
  };

  const onMove = (clientX) => {
    State.splitPosition = getPercent(clientX);
    updateSplitClip();
  };

  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    State.isDraggingSplit = true;
  });
  document.addEventListener('mousemove', (e) => {
    if (State.isDraggingSplit) onMove(e.clientX);
  });
  document.addEventListener('mouseup', () => { State.isDraggingSplit = false; });

  handle.addEventListener('touchstart', (e) => { e.preventDefault(); State.isDraggingSplit = true; }, { passive: false });
  document.addEventListener('touchmove', (e) => {
    if (State.isDraggingSplit) onMove(e.touches[0].clientX);
  }, { passive: true });
  document.addEventListener('touchend', () => { State.isDraggingSplit = false; });

  // Keyboard support
  handle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { State.splitPosition = Math.max(5, State.splitPosition - 2); updateSplitClip(); }
    if (e.key === 'ArrowRight') { State.splitPosition = Math.min(95, State.splitPosition + 2); updateSplitClip(); }
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOWNLOAD
   ═══════════════════════════════════════════════════════════════════════════ */
function downloadImage() {
  if (!State.originalImage) return;

  // إنشاء canvas للتصدير
  const exportCanvas = document.createElement('canvas');
  const img = State.originalImage;
  exportCanvas.width  = img.naturalWidth;
  exportCanvas.height = img.naturalHeight;
  const ctx = exportCanvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);

  if (State.activeFilters.size > 0 || State.adjustments.brightness !== 0 || State.adjustments.contrast !== 0) {
    let imgData = ctx.getImageData(0, 0, exportCanvas.width, exportCanvas.height);
    imgData = applyFiltersToImageData(imgData);
    ctx.putImageData(imgData, 0, 0);
  }

  const format   = Dom.exportFormat.value;
  const quality  = Number(Dom.exportQuality.value) / 100;
  const ext      = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
  const fileName = `pixelforge-${State.activeFilters.size ? [...State.activeFilters].join('-') : 'original'}.${ext}`;
  const dataURL  = exportCanvas.toDataURL(format, quality);

  // ── محاولة 1: تحميل تلقائي ────────────────────────────────────────────
  try {
    const a = document.createElement('a');
    a.href     = dataURL;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 300);
  } catch (e) {
    console.warn('Auto-download failed:', e);
  }

  // ── محاولة 2: فتح الصورة في تاب جديد كـ fallback ────────────────────
  // بيفتح الصورة في تاب منفصل — كليك يمين > حفظ
  const newTab = window.open();
  if (newTab) {
    newTab.document.write(`
      <html>
        <head><title>${fileName}</title>
          <style>
            body { margin:0; background:#111; display:flex; flex-direction:column;
                   align-items:center; justify-content:center; min-height:100vh; gap:16px; }
            img  { max-width:100%; max-height:90vh; border-radius:8px; box-shadow:0 0 40px rgba(0,0,0,0.6); }
            p    { color:#aaa; font-family:sans-serif; font-size:14px; }
            a    { display:inline-block; padding:10px 24px; background:#6366f1;
                   color:white; text-decoration:none; border-radius:8px;
                   font-family:sans-serif; font-weight:600; }
          </style>
        </head>
        <body>
          <p>اضغط على الزر أو كليك يمين على الصورة واختر "حفظ الصورة"</p>
          <a href="${dataURL}" download="${fileName}">⬇ حفظ الصورة (${fileName})</a>
          <br/>
          <img src="${dataURL}" alt="filtered image"/>
        </body>
      </html>
    `);
    newTab.document.close();
  }

  showToast('تم! اضغط "حفظ الصورة" في التاب الجديد 📥', 'success', 5000);
}


function updateDownloadButtons() {
  const enabled = !!State.originalImage;
  Dom.btnDownload.disabled      = !enabled;
  Dom.btnDownloadPanel.disabled = !enabled;
}

/* ═══════════════════════════════════════════════════════════════════════════
   INFO BAR
   ═══════════════════════════════════════════════════════════════════════════ */
function updateInfoBar() {
  if (!State.originalImage) return;
  const img = State.originalImage;
  Dom.infoDimensions.childNodes[1].textContent = ` ${img.naturalWidth} × ${img.naturalHeight}px`;
  if (State.sourceFile) {
    const size = State.sourceFile.size;
    const sizeStr = size > 1024 * 1024
      ? `${(size / 1024 / 1024).toFixed(1)} MB`
      : `${(size / 1024).toFixed(0)} KB`;
    Dom.infoSize.childNodes[1].textContent = ` ${sizeStr}`;
  }
  const filterNames = [...State.activeFilters].map(id => FILTER_REGISTRY.find(f => f.id === id)?.name).filter(Boolean);
  Dom.infoFilter.childNodes[1].textContent = filterNames.length ? ` ${filterNames.join(' + ')}` : ' No filter';
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHOW / HIDE SECTIONS
   ═══════════════════════════════════════════════════════════════════════════ */
function showEditor() {
  Dom.uploadSection.classList.add('hidden');
  Dom.editorSection.classList.remove('hidden');
}

function showUpload() {
  Dom.editorSection.classList.add('hidden');
  Dom.uploadSection.classList.remove('hidden');
  // Reset state
  State.originalImage   = null;
  State.sourceFile      = null;
  State.activeFilters.clear();
  State.activePreset    = null;
  State.viewMode        = 'single';
  setViewMode('single');
  updateDownloadButtons();
}

/* ═══════════════════════════════════════════════════════════════════════════
   RANDOM FILTER
   ═══════════════════════════════════════════════════════════════════════════ */
function applyRandomFilter() {
  const random = FILTER_REGISTRY[Math.floor(Math.random() * FILTER_REGISTRY.length)];
  State.activeFilters.clear();
  State.activeFilters.add(random.id);
  updateFilterCards();
  scheduleRender();
  showToast(`Surprise! Applied "${random.name}" 🎲`, 'info');
}

/* ═══════════════════════════════════════════════════════════════════════════
   EVENT LISTENERS
   ═══════════════════════════════════════════════════════════════════════════ */
function initEventListeners() {
  // File upload
  Dom.btnBrowse.addEventListener('click', () => Dom.fileInput.click());
  Dom.fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) loadImageFile(e.target.files[0]);
    Dom.fileInput.value = '';
  });

  // Drag & drop
  Dom.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    Dom.dropZone.classList.add('drag-over');
  });
  Dom.dropZone.addEventListener('dragleave', () => Dom.dropZone.classList.remove('drag-over'));
  Dom.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    Dom.dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) loadImageFile(e.dataTransfer.files[0]);
  });
  Dom.dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); Dom.fileInput.click(); }
  });

  // Paste image
  document.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        loadImageFile(item.getAsFile());
        showToast('Image pasted from clipboard! 📋', 'success');
        break;
      }
    }
  });

  // View mode
  Dom.btnSingle.addEventListener('click',    () => setViewMode('single'));
  Dom.btnCompare.addEventListener('click',   () => setViewMode('compare'));
  Dom.btnSplitview.addEventListener('click', () => setViewMode('split'));

  // Multi-filter toggle
  Dom.multiToggle.addEventListener('change', () => {
    State.stackMode = Dom.multiToggle.checked;
    Dom.multiToggle.setAttribute('aria-checked', State.stackMode);
    if (!State.stackMode && State.activeFilters.size > 1) {
      const first = [...State.activeFilters][0];
      State.activeFilters.clear();
      State.activeFilters.add(first);
      updateFilterCards();
      scheduleRender();
    }
    showToast(State.stackMode ? 'Stack mode enabled' : 'Stack mode disabled', 'info');
  });

  // Global intensity
  Dom.globalIntensity.addEventListener('input', () => {
    State.globalIntensity = Number(Dom.globalIntensity.value);
    Dom.intensityValue.textContent = `${State.globalIntensity}%`;
    updateRangeFill(Dom.globalIntensity);
    scheduleRender();
  });
  updateRangeFill(Dom.globalIntensity);

  // Export format
  Dom.exportFormat.addEventListener('change', () => {
    Dom.qualityRow.style.display = Dom.exportFormat.value === 'image/png' ? 'none' : 'flex';
  });

  // Export quality
  Dom.exportQuality.addEventListener('input', () => {
    Dom.qualityValue.textContent = `${Dom.exportQuality.value}%`;
    updateRangeFill(Dom.exportQuality);
  });
  updateRangeFill(Dom.exportQuality);

  // Download buttons
  Dom.btnDownload.addEventListener('click', downloadImage);
  Dom.btnDownloadPanel.addEventListener('click', downloadImage);

  // New image
  Dom.btnNewImage.addEventListener('click', () => showUpload());

  // Reset all
  Dom.btnResetAll.addEventListener('click', () => {
    State.activeFilters.clear();
    State.activePreset = null;
    Object.assign(State.adjustments, { brightness: 0, contrast: 0, blur: 0, intensity: 70 });
    State.globalIntensity = 100;
    Dom.globalIntensity.value = 100;
    Dom.intensityValue.textContent = '100%';
    updateRangeFill(Dom.globalIntensity);
    updateFilterCards();
    updatePresetCards();
    syncSliders();
    drawOutput();
    showToast('All filters reset', 'info');
  });

  // Clear filters
  Dom.btnClearFilters.addEventListener('click', () => {
    State.activeFilters.clear();
    State.activePreset = null;
    updateFilterCards();
    updatePresetCards();
    scheduleRender();
    showToast('Filters cleared', 'info');
  });

  // Random filter
  Dom.btnRandomFilter.addEventListener('click', applyRandomFilter);

  // Global paste shortcut label
  showToast('Tip: You can also paste an image with Ctrl+V 📋', 'info', 4000);
}

/* ═══════════════════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════════════════ */
function init() {
  buildFilterGrid();
  buildSlidersContainer();
  buildPresetGrid();
  initSplitSlider();
  initEventListeners();
  updateDownloadButtons();
}

document.addEventListener('DOMContentLoaded', init);
