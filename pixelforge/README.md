# 🎨 PixelForge — Real-Time Image Filter Studio

> A powerful, professional real-time image filtering web app built with pure HTML5, CSS3, and Vanilla JavaScript using the Canvas API.

---

## ✨ Features

### 🖼️ Image Handling
- Drag & Drop upload support
- File browser upload (JPG, PNG, WEBP, GIF, up to 20MB)
- Paste images directly from clipboard (Ctrl+V)

### 🎛️ 16 Advanced Filters
| Filter | Description |
|---|---|
| Grayscale | Luminance-based grayscale conversion |
| Blur | Adjustable box blur |
| Edge Detection | Sobel operator edge detection |
| Sharpen | Convolution-based sharpening |
| Brightness | Global brightness adjustment |
| Contrast | Global contrast adjustment |
| Sepia | Classic sepia tone |
| Invert | Color channel inversion |
| Cartoon 🔥 | Posterize + Sobel edge overlay |
| Vintage | Warm tone + vignette |
| Denoise | Mean filter noise reduction |
| Pixelate | Block pixelation effect |
| Emboss | 3D emboss convolution |
| Oil Paint 🔥 | Mode-filter oil painting effect |
| Warm | Warm color grading |
| Cool | Cool color grading |

### 🔢 8 One-Click Presets
Cinematic, Noir, Dreamy, Retro, Comic, Ghost, Cyberpunk, Watercolor

### 🔀 Stack Filters Mode
Enable "Stack Filters" to combine multiple filters simultaneously.

### 🖥️ 3 View Modes
1. **Preview** — Single filtered output
2. **Compare** — Side-by-side original vs filtered
3. **Slider** — Interactive split-slider comparison

### 🎚️ Adjustments
- Brightness (-100 to +100)
- Contrast (-100 to +100)
- Blur Radius (0-100)
- Intensity (0-100%)
- Global Intensity slider (blend between original and filtered)

### 📊 Live Histogram
RGB histogram displayed in real-time.

### 💾 Export
- PNG (Lossless)
- JPEG (adjustable quality)
- WebP (modern format)

---

## 🚀 How to Run

### Option 1: Direct
Just open `index.html` in your browser — no server required!

### Option 2: Local Server
```bash
python -m http.server
```
Then open: http://localhost:8000

---

## 📂 Project Structure
```
image filtring/
├── index.html          # Main HTML structure
├── style.css           # Complete design system (dark futuristic UI)
├── app.js              # Main application controller
├── filters/
│   ├── grayscale.js    # Grayscale filter
│   ├── blur.js         # Box blur filter
│   ├── edge.js         # Sobel edge detection
│   └── more_filters.js # All advanced filters
└── README.md
```

---

## 🛠️ Technologies
- **HTML5** — Semantic structure
- **CSS3** — Custom design system, glass morphism, animations
- **Vanilla JavaScript** — Zero dependencies
- **Canvas API** — Pixel-level image processing

---

## 👨‍💻 Author
**Mohamed Khaled** — AI Student & Web Developer
