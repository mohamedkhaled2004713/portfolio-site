"""
Lesson 01: Read an image, print basic facts, save a copy, show it in a window.

OpenCV stores color images as BGR. Try changing JPEG quality (0–100) below.
"""

import sys
from pathlib import Path

import cv2

ROOT = Path(__file__).resolve().parent.parent
IMAGE_PATH = ROOT / "images" / "sample.jpg"
OUTPUT_DIR = ROOT / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

JPEG_QUALITY = 90


def main() -> None:
    img = cv2.imread(str(IMAGE_PATH))
    if img is None:
        print("Could not read:", IMAGE_PATH)
        print("Put a file at images\\sample.jpg or change IMAGE_PATH above.")
        sys.exit(1)

    print("shape (height, width, channels):", img.shape)
    print("dtype:", img.dtype)
    print("smallest / largest pixel value:", int(img.min()), int(img.max()))

    out_file = OUTPUT_DIR / "01_copy.jpg"
    cv2.imwrite(str(out_file), img, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
    print("Saved:", out_file)

    cv2.imshow("Lesson 01 - BGR image", img)
    print("Click the image window, then press any key to exit.")
    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
