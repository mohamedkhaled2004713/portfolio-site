"""
Lesson 06: Gradients and Canny edge detection.

TODO: tune threshold1 and threshold2 — if edges are broken, lower thresholds;
if too much noise appears, raise them.
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

    sobelx = cv2.Sobel(blur, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(blur, cv2.CV_64F, 0, 1, ksize=3)
    sobelx = cv2.convertScaleAbs(sobelx)
    sobely = cv2.convertScaleAbs(sobely)
    sobel = cv2.addWeighted(sobelx, 0.5, sobely, 0.5, 0)

    lap = cv2.Laplacian(blur, cv2.CV_64F)
    lap = cv2.convertScaleAbs(lap)

    t1, t2 = 80, 160
    edges = cv2.Canny(blur, t1, t2)

    cv2.imwrite(str(OUTPUT_DIR / "06_sobel.jpg"), sobel)
    cv2.imwrite(str(OUTPUT_DIR / "06_laplacian.jpg"), lap)
    cv2.imwrite(str(OUTPUT_DIR / "06_canny.jpg"), edges)

    cv2.imshow("blur", blur)
    cv2.imshow("Sobel magnitude", sobel)
    cv2.imshow("Laplacian", lap)
    cv2.imshow(f"Canny ({t1}, {t2})", edges)
    print("Press any key in a window to close all.")
    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
