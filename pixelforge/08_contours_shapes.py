"""
Lesson 08: Find contours and draw bounding boxes.

Uses a simple binary mask from Otsu; tune thresholding if contours look wrong.
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
    _, binary = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    contours, hierarchy = cv2.findContours(binary, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    vis = img.copy()
    cv2.drawContours(vis, contours, -1, color=(0, 255, 0), thickness=2)

    for i, cnt in enumerate(contours):
        area = cv2.contourArea(cnt)
        if area < 100:
            continue
        x, y, bw, bh = cv2.boundingRect(cnt)
        cv2.rectangle(vis, (x, y), (x + bw, y + bh), (255, 0, 0), 2)
        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.04 * peri, True)
        cv2.putText(
            vis,
            f"vertices~{len(approx)}",
            (x, max(y - 5, 15)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.4,
            (255, 255, 0),
            1,
            cv2.LINE_AA,
        )

    cv2.imwrite(str(OUTPUT_DIR / "08_binary.jpg"), binary)
    cv2.imwrite(str(OUTPUT_DIR / "08_contours.jpg"), vis)

    cv2.imshow("binary (inverted Otsu)", binary)
    cv2.imshow("contours + boxes", vis)
    print(f"Found {len(contours)} contours (many may be tiny).")
    print("Press any key in a window to close all.")
    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
