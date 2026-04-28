"""
Lesson 07: Thresholding and morphological operations on binary masks.

Good combo: adaptive threshold on uneven lighting, then open/close to clean noise.
"""

import sys
from pathlib import Path

import cv2

ROOT = Path(__file__).resolve().parent.parent
IMAGE_PATH = ROOT / "images" / "sample.jpg"
OUTPUT_DIR = ROOT / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def main() -> None:
    img = cv2.imread(str(IMAGE_PATH))
    if img is None:
        print(f"Could not load: {IMAGE_PATH}")
        sys.exit(1)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)

    _, otsu = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    adaptive = cv2.adaptiveThreshold(
        blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    opened = cv2.morphologyEx(adaptive, cv2.MORPH_OPEN, kernel)
    closed = cv2.morphologyEx(adaptive, cv2.MORPH_CLOSE, kernel)

    cv2.imwrite(str(OUTPUT_DIR / "07_otsu.jpg"), otsu)
    cv2.imwrite(str(OUTPUT_DIR / "07_adaptive.jpg"), adaptive)
    cv2.imwrite(str(OUTPUT_DIR / "07_opened.jpg"), opened)
    cv2.imwrite(str(OUTPUT_DIR / "07_closed.jpg"), closed)

    cv2.imshow("gray blur", blur)
    cv2.imshow("Otsu", otsu)
    cv2.imshow("Adaptive Gaussian", adaptive)
    cv2.imshow("Morph open (clean specks)", opened)
    cv2.imshow("Morph close (fill holes)", closed)
    print("Press any key in a window to close all.")
    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
