"""
Regenerate files under images/ using OpenCV and NumPy.

Run from project root:
    python src\\regenerate_images.py
    python src\\regenerate_images.py --skimage-count 12 --skimage-seed 0
    python src\\regenerate_images.py --skimage-all

Always writes: sample.jpg and the synthetic_*.png set.
If scikit-image is installed (pip install scikit-image), also writes a random subset
of bundled ``skimage.data`` images to images/*.png (see --skimage-count / --skimage-all).
"""

from __future__ import annotations

import argparse
import random
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "images"

# Skip huge or non-image callables in skimage.data (path strings, multi-volume sets, etc.).
_SKIMAGE_EXCLUDE = frozenset(
    {
        "hubble_deep_field",
        "lfw_subset",
        "lbpcascade_frontalface_path",
        "lbp_frontal_face_cascade_filename",
    }
)
_MAX_SKIMAGE_PIXELS = 6_000_000


def ensure_images_dir() -> None:
    IMAGES.mkdir(parents=True, exist_ok=True)


def checkerboard(size: int = 512, cells: int = 16) -> np.ndarray:
    cell = max(1, size // cells)
    img = np.zeros((size, size), dtype=np.uint8)
    for i in range(cells):
        for j in range(cells):
            if (i + j) % 2 == 0:
                y0, x0 = i * cell, j * cell
                img[y0 : min(y0 + cell, size), x0 : min(x0 + cell, size)] = 255
    return img


def stripes(size: int = 512, n_stripes: int = 32) -> np.ndarray:
    img = np.zeros((size, size), dtype=np.uint8)
    w = max(1, size // n_stripes)
    for k in range(n_stripes):
        x0 = k * w
        if x0 >= size:
            break
        x1 = min((k + 1) * w, size)
        if k % 2 == 0:
            img[:, x0:x1] = 255
    return img


def rings(size: int = 512) -> np.ndarray:
    img = np.full((size, size), 220, dtype=np.uint8)
    c = size // 2
    center = (c, c)
    for r in range(min(c - 10, 220), 8, -14):
        shade = int(25 + (r % 5) * 35)
        cv2.circle(img, center, r, shade, 2)
    return img


def color_patches(size: int = 512) -> np.ndarray:
    img = np.zeros((size, size, 3), dtype=np.uint8)
    colors = (
        (0, 0, 255),
        (0, 255, 0),
        (255, 0, 0),
        (0, 255, 255),
        (255, 0, 255),
        (255, 255, 0),
        (128, 0, 128),
        (0, 128, 255),
    )
    rows, cols = 2, 4
    ch, cw = size // rows, size // cols
    for idx, (i, j) in enumerate(
        (i, j) for i in range(rows) for j in range(cols)
    ):
        y0, x0 = i * ch, j * cw
        img[y0 : y0 + ch, x0 : x0 + cw] = colors[idx % len(colors)]
    return img


def gradient_noise(size: int = 512, seed: int = 42) -> np.ndarray:
    g = np.linspace(0, 255, size, dtype=np.float32)
    gx, gy = np.meshgrid(g, g)
    base = (0.5 * gx + 0.5 * gy).astype(np.uint8)
    rng = np.random.default_rng(seed)
    noise = rng.integers(-25, 26, (size, size), dtype=np.int16)
    return np.clip(base.astype(np.int16) + noise, 0, 255).astype(np.uint8)


def sample_scene(size: int = 512) -> np.ndarray:
    """Grayscale image with clear edges and regions for lessons 01–09."""
    img = np.full((size, size), 180, dtype=np.uint8)
    cv2.rectangle(img, (100, 360), (412, 480), 90, -1)
    cv2.rectangle(img, (200, 200), (312, 360), 60, -1)
    cv2.circle(img, (256, 140), 72, 40, -1)
    cv2.rectangle(img, (236, 248), (276, 320), 200, -1)
    return cv2.GaussianBlur(img, (3, 3), 0)


def _write_gray(path: Path, img: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not cv2.imwrite(str(path), img):
        raise OSError(f"cv2.imwrite failed: {path}")


def _write_bgr(path: Path, bgr: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not cv2.imwrite(str(path), bgr):
        raise OSError(f"cv2.imwrite failed: {path}")


def write_core_assets() -> None:
    ensure_images_dir()
    assets = [
        ("synthetic_checkerboard.png", checkerboard()),
        ("synthetic_stripes.png", stripes()),
        ("synthetic_rings.png", rings()),
        ("synthetic_color_patches.png", color_patches()),
        ("synthetic_gradient_noise.png", gradient_noise()),
    ]
    for name, arr in assets:
        p = IMAGES / name
        if arr.ndim == 2:
            _write_gray(p, arr)
        else:
            _write_bgr(p, arr)
        print("Wrote", p)

    sample = sample_scene()
    jp = IMAGES / "sample.jpg"
    if not cv2.imwrite(str(jp), sample, [cv2.IMWRITE_JPEG_QUALITY, 92]):
        raise OSError(f"cv2.imwrite failed: {jp}")
    print("Wrote", jp)


def _skimage_to_bgr_or_gray(arr: np.ndarray) -> np.ndarray:
    if arr.dtype == np.float64 or arr.dtype == np.float32:
        if arr.max() <= 1.0:
            arr = np.clip(arr * 255.0, 0, 255).astype(np.uint8)
        else:
            arr = arr.astype(np.uint8)
    if arr.ndim == 2:
        return arr
    if arr.shape[-1] == 4:
        arr = arr[..., :3]
    return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)


def discover_skimage_image_loaders(data_mod: object) -> list[str]:
    """Names in skimage.data that are no-arg callables returning a 2D+ image array."""
    pool: list[str] = []
    for name in sorted(dir(data_mod)):
        if name.startswith("_") or name in _SKIMAGE_EXCLUDE:
            continue
        obj = getattr(data_mod, name, None)
        if not callable(obj):
            continue
        try:
            raw = obj()
        except Exception:
            continue
        if not isinstance(raw, np.ndarray) or raw.ndim < 2 or raw.size == 0:
            continue
        if raw.size > _MAX_SKIMAGE_PIXELS:
            continue
        pool.append(name)
    return pool


def export_skimage_random(
    count: int,
    *,
    seed: int | None = None,
    export_all: bool = False,
) -> None:
    """
    Write PNGs from scikit-image's bundled ``data`` module into images/.

    If export_all is True, writes every discovered loader; otherwise writes a random
    subset of size ``count`` (capped by pool size).
    """
    try:
        from skimage import data  # type: ignore[import-untyped]
    except ImportError:
        print(
            "Optional: pip install scikit-image to also write random classical PNGs in images/."
        )
        return

    pool = discover_skimage_image_loaders(data)
    if not pool:
        print("scikit-image: no suitable image loaders found in skimage.data.")
        return

    if export_all:
        chosen = pool
        print(f"scikit-image: exporting all {len(chosen)} discovered dataset(s).")
    else:
        k = min(max(0, count), len(pool))
        if k == 0:
            print("scikit-image: skipped (--skimage-count 0).")
            return
        rng = random.Random(seed)
        chosen = rng.sample(pool, k=k)
        print(
            f"scikit-image: exporting random subset of {len(chosen)} image(s)"
            + (f" (seed={seed})" if seed is not None else "")
            + f": {', '.join(chosen)}"
        )

    for attr in chosen:
        loader = getattr(data, attr)
        try:
            raw = np.asarray(loader())
        except Exception as e:
            print(f"Skip {attr}: {e}")
            continue
        try:
            out = _skimage_to_bgr_or_gray(raw)
        except Exception as e:
            print(f"Skip {attr} (convert): {e}")
            continue
        path = IMAGES / f"{attr}.png"
        if out.ndim == 2:
            _write_gray(path, out)
        else:
            _write_bgr(path, out)
        print("Wrote", path)


def parse_args(argv: list[str] | None) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Regenerate synthetic assets and optional scikit-image samples in images/."
    )
    p.add_argument(
        "--skimage-count",
        type=int,
        default=8,
        metavar="N",
        help="How many random skimage.data images to save (default: 8). Use 0 to skip.",
    )
    p.add_argument(
        "--skimage-seed",
        type=int,
        default=None,
        metavar="INT",
        help="RNG seed so the random subset is reproducible.",
    )
    p.add_argument(
        "--skimage-all",
        action="store_true",
        help="Save every discovered skimage.data image instead of a random subset.",
    )
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    if not ROOT.is_dir():
        print("Unexpected layout: expected project root above src/.", file=sys.stderr)
        return 1
    write_core_assets()
    if args.skimage_all:
        export_skimage_random(0, export_all=True)
    elif args.skimage_count > 0:
        export_skimage_random(
            args.skimage_count,
            seed=args.skimage_seed,
            export_all=False,
        )
    else:
        print("scikit-image: skipped (--skimage-count 0).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
