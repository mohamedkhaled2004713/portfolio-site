"""
Lesson 02: BGR image, grayscale, HSV, and single-color channels.

OpenCV uses BGR order (blue, green, red), not RGB.
"""

import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
IMAGE_PATH = ROOT / "images" / "sample.jpg"
OUTPUT_DIR = ROOT / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def main() -> None:
    bgr = cv2.imread(str(IMAGE_PATH))
    if bgr is None:
        print("Could not read:", IMAGE_PATH)
        sys.exit(1)

    height, width = bgr.shape[0], bgr.shape[1]
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)

    blue, green, red = cv2.split(bgr)
    empty = np.zeros((height, width), dtype=np.uint8)

    blue_only = cv2.merge([blue, empty, empty])
    green_only = cv2.merge([empty, green, empty])
    red_only = cv2.merge([empty, empty, red])

    cv2.imwrite(str(OUTPUT_DIR / "02_gray.jpg"), gray)
    cv2.imwrite(str(OUTPUT_DIR / "02_hsv.jpg"), hsv)

    cv2.imshow("1 - original BGR", bgr)
    cv2.imshow("2 - grayscale", gray)
    cv2.imshow("3 - HSV (still 3 channels)", hsv)
    cv2.imshow("4 - only blue channel", blue_only)
    cv2.imshow("5 - only green channel", green_only)
    cv2.imshow("6 - only red channel", red_only)
    print("Click an image window, then press any key to close all.")
    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
