"""
Lesson 04: Draw primitives and text on an image (annotation).

TODO: change thickness, colors (B, G, R), and font scale.
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

    canvas = img.copy()
    h, w = canvas.shape[:2]

    cv2.rectangle(canvas, (20, 20), (200, 120), color=(0, 255, 0), thickness=2)
    cv2.circle(canvas, (w // 2, h // 2), radius=60, color=(255, 0, 0), thickness=2)
    cv2.line(canvas, (0, 0), (w - 1, h - 1), color=(0, 165, 255), thickness=2)

    label = "OpenCV lesson 04"
    cv2.putText(
        canvas,
        label,
        org=(30, h - 40),
        fontFace=cv2.FONT_HERSHEY_SIMPLEX,
        fontScale=0.9,
        color=(255, 255, 255),
        thickness=2,
        lineType=cv2.LINE_AA,
    )

    out = OUTPUT_DIR / "04_annotated.jpg"
    cv2.imwrite(str(out), canvas)
    print("Wrote:", out)

    cv2.imshow("annotated", canvas)
    print("Press any key in the image window to close.")
    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
