"""
Lesson 09: Histogram equalization and CLAHE (contrast on flat images).

Input: images/chelsea.png (color photo; regenerate with src/regenerate_images.py if missing).

Each view stacks the image (top) with the matching histogram (bottom), same width.
"""

import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
IMAGE_PATH = ROOT / "images" / "chelsea.png"
OUTPUT_DIR = ROOT / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def histogram_panel(gray: np.ndarray, title: str, width: int = 640) -> np.ndarray:
    """Draw a 256-bin grayscale histogram as a BGR image with a title."""
    height = 240
    panel = np.full((height, width, 3), 255, dtype=np.uint8)
    cv2.putText(
        panel,
        title,
        (10, 22),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        (0, 0, 0),
        1,
        cv2.LINE_AA,
    )

    hist = cv2.calcHist([gray], [0], None, [256], [0, 256]).ravel()
    max_val = float(hist.max()) or 1.0
    top = 36
    bottom = height - 8
    bar_area = bottom - top
    bar_heights = (hist * bar_area / max_val).astype(np.int32)

    for i in range(256):
        x1 = int(i * width / 256)
        x2 = max(x1 + 1, int((i + 1) * width / 256))
        y1 = bottom - int(bar_heights[i])
        cv2.rectangle(panel, (x1, bottom), (x2, y1), (50, 50, 50), -1)

    return panel


def stack_image_and_histogram(
    image: np.ndarray,
    hist_panel: np.ndarray,
) -> np.ndarray:
    """Place BGR or grayscale image above histogram; resize histogram to image width."""
    if image.ndim == 2:
        top = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    else:
        top = image

    img_w = top.shape[1]
    hh, hw = hist_panel.shape[0], hist_panel.shape[1]
    new_w = img_w
    new_h = max(1, int(hh * (new_w / float(hw))))
    bottom = cv2.resize(hist_panel, (new_w, new_h), interpolation=cv2.INTER_AREA)

    return np.vstack((top, bottom))


def main() -> None:
    img = cv2.imread(str(IMAGE_PATH))
    if img is None:
        print(f"Could not load: {IMAGE_PATH}")
        print("Add images\\chelsea.png or change IMAGE_PATH in this script.")
        sys.exit(1)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    eq_gray = cv2.equalizeHist(gray)

    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_equalized = clahe.apply(l_channel)
    lab2 = cv2.merge((l_equalized, a_channel, b_channel))
    clahe_bgr = cv2.cvtColor(lab2, cv2.COLOR_LAB2BGR)

    cv2.imwrite(str(OUTPUT_DIR / "09_eq_gray.jpg"), eq_gray)
    cv2.imwrite(str(OUTPUT_DIR / "09_clahe_bgr.jpg"), clahe_bgr)

    w = max(img.shape[1], 640)
    hist_before_eq = histogram_panel(gray, "Histogram: gray BEFORE equalizeHist", width=w)
    hist_after_eq = histogram_panel(eq_gray, "Histogram: gray AFTER equalizeHist", width=w)
    hist_l_before = histogram_panel(l_channel, "Histogram: L BEFORE CLAHE", width=w)
    hist_l_after = histogram_panel(l_equalized, "Histogram: L AFTER CLAHE", width=w)

    view1 = stack_image_and_histogram(gray, hist_before_eq)
    view2 = stack_image_and_histogram(eq_gray, hist_after_eq)
    view3 = stack_image_and_histogram(img, hist_l_before)
    view4 = stack_image_and_histogram(clahe_bgr, hist_l_after)

    cv2.imshow("1 gray + hist before equalizeHist", view1)
    cv2.imshow("2 equalized gray + hist after equalizeHist", view2)
    cv2.imshow("3 original BGR + hist L before CLAHE", view3)
    cv2.imshow("4 CLAHE BGR + hist L after CLAHE", view4)

    print("Press any key in a window to close all.")
    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
