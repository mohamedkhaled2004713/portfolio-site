"""
Lesson 03: Resize, crop a region (ROI), rotate, flip.

Run from the project folder. Compare resize methods: INTER_AREA is often used
when making an image smaller; INTER_LINEAR when enlarging.
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
        print("Could not read:", IMAGE_PATH)
        sys.exit(1)

    height, width = img.shape[0], img.shape[1]
    half_h = height // 2
    half_w = width // 2

    new_width = width // 2
    new_height = height // 2
    smaller = cv2.resize(img, (new_width, new_height), interpolation=cv2.INTER_AREA)

    top_left = img[0:half_h, 0:half_w].copy()

    center_x = width // 2
    center_y = height // 2
    angle_degrees = 45
    scale = 0.8
    rot_matrix = cv2.getRotationMatrix2D((center_x, center_y), angle_degrees, scale)
    rotated = cv2.warpAffine(
        img,
        rot_matrix,
        (width, height),
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=(0, 0, 0),
    )

    flip_left_right = 1
    mirrored = cv2.flip(img, flip_left_right)

    cv2.imwrite(str(OUTPUT_DIR / "03_small.jpg"), smaller)
    cv2.imwrite(str(OUTPUT_DIR / "03_roi.jpg"), top_left)
    cv2.imwrite(str(OUTPUT_DIR / "03_rotated.jpg"), rotated)
    cv2.imwrite(str(OUTPUT_DIR / "03_flipped.jpg"), mirrored)

    cv2.imshow("original", img)
    cv2.imshow("half size", smaller)
    cv2.imshow("crop top-left quarter", top_left)
    cv2.imshow("rotated", rotated)
    cv2.imshow("mirror left-right", mirrored)
    print("Click an image window, then press any key to close all.")
    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
