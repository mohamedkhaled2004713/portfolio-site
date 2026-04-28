"""
Lesson 05: Smoothing filters — Gaussian and median blur.

Larger kernel = more blur (use odd positive integers for Gaussian ksize).
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

    k = 9
    gauss = cv2.GaussianBlur(img, (k, k), 0)
    gauss_gray = cv2.GaussianBlur(gray, (k, k), 0)
    median = cv2.medianBlur(img, k)

    cv2.imwrite(str(OUTPUT_DIR / "05_gaussian.jpg"), gauss)
    cv2.imwrite(str(OUTPUT_DIR / "05_median.jpg"), median)

    cv2.imshow("original", img)
    cv2.imshow(f"Gaussian blur {k}x{k}", gauss)
    cv2.imshow(f"Gaussian on gray {k}x{k}", gauss_gray)
    cv2.imshow(f"Median blur {k}x{k}", median)
    print("Press any key in a window to close all.")
    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
