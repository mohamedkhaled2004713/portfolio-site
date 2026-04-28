
"""
Run a lesson (01-09) with a chosen input image.

From project root:
    python src\\main.py --lesson 3 --image images\\page.png
    python src\\main.py -l 9 -i 2

With no arguments, you are prompted for lesson number, then a numbered list of
files in images/ lets you pick by number (or type a path).

Default image index if you press Enter: 1 (first file in the list, sorted by name).
"""

from __future__ import annotations

import argparse
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"

_IMAGE_SUFFIXES = frozenset({".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"})

LESSONS: dict[int, tuple[str, str]] = {
    1: ("01_read_display_save", "Read, display, save"),
    2: ("02_colorspaces_channels", "BGR, gray, HSV, channels"),
    3: ("03_resize_crop_rotate", "Resize, crop, rotate, flip"),
    4: ("04_draw_shapes_text", "Draw shapes and text"),
    5: ("05_filters_blur", "Blur filters"),
    6: ("06_edges_canny", "Gradients and Canny"),
    7: ("07_thresholding_morphology", "Threshold and morphology"),
    8: ("08_contours_shapes", "Contours"),
    9: ("09_histogram_equalization", "Histogram equalization and CLAHE"),
}


def list_images_in_folder() -> list[Path]:
    """Sorted image files directly under images/ (by name)."""
    folder = ROOT / "images"
    if not folder.is_dir():
        return []
    out: list[Path] = []
    for p in sorted(folder.iterdir(), key=lambda x: x.name.lower()):
        if p.is_file() and p.suffix.lower() in _IMAGE_SUFFIXES:
            out.append(p)
    return out


def resolve_image_path(user_input: str) -> Path:
    """Accept absolute path, path relative to project root, or a filename under images/."""
    raw = user_input.strip()
    if not raw:
        raw = str(ROOT / "images" / "sample.jpg")

    p = Path(raw)
    if p.is_file():
        return p.resolve()

    rel_root = (ROOT / raw).resolve()
    if rel_root.is_file():
        return rel_root

    in_images = (ROOT / "images" / raw).resolve()
    if in_images.is_file():
        return in_images

    raise FileNotFoundError(
        f"Image not found: {user_input!r}\n"
        f"Tried: {p}, {rel_root}, {in_images}"
    )


def resolve_image_selection(user_input: str, indexed_files: list[Path]) -> Path:
    """
    If user_input is a positive integer, treat it as index into indexed_files (1-based).
    Otherwise treat as path / filename for resolve_image_path.
    """
    raw = user_input.strip()
    if raw.isdigit():
        n = int(raw)
        if not indexed_files:
            raise FileNotFoundError(
                "No image files found in images/. Add .jpg/.png etc., or type a full path."
            )
        if 1 <= n <= len(indexed_files):
            return indexed_files[n - 1].resolve()
        raise FileNotFoundError(
            f"No image number {n}. Use 1-{len(indexed_files)} or type a path / filename."
        )
    return resolve_image_path(raw)


def load_and_run_lesson(stem: str, image_path: Path) -> None:
    script = SRC / f"{stem}.py"
    if not script.is_file():
        raise FileNotFoundError(f"Missing lesson file: {script}")

    name = f"_lesson_launch_{stem}"
    spec = importlib.util.spec_from_file_location(name, script)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load spec for {script}")

    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    mod.IMAGE_PATH = image_path
    mod.main()


def parse_args(argv: list[str] | None) -> argparse.Namespace | None:
    p = argparse.ArgumentParser(
        description="Run OpenCV lessons 01-09 with a chosen input image."
    )
    p.add_argument(
        "-l",
        "--lesson",
        type=int,
        choices=range(1, 10),
        metavar="N",
        help="Lesson number 1-9.",
    )
    p.add_argument(
        "-i",
        "--image",
        type=str,
        default=None,
        help="Image: number (1,2,...) matching sorted files in images/, or path/filename.",
    )
    args = p.parse_args(argv)
    if args.lesson is None and args.image is None:
        return None
    if args.lesson is None:
        p.error("--lesson is required when using non-interactive mode (or run with no args for prompts).")
    return args


def interactive_choose() -> tuple[int, Path]:
    print("Lessons (OpenCV):")
    for n, (_, title) in LESSONS.items():
        print(f"  {n} - {title}")

    while True:
        s = input("Lesson number (1-9): ").strip()
        try:
            num = int(s)
        except ValueError:
            print("Enter an integer 1-9.")
            continue
        if num not in LESSONS:
            print("Enter a number from 1 to 9.")
            continue
        break

    image_files = list_images_in_folder()
    print()
    if image_files:
        print(f"Images in {ROOT / 'images'}:")
        for i, p in enumerate(image_files, start=1):
            print(f"  {i}  {p.name}")
        default_hint = "1"
        prompt = f"Image number (1-{len(image_files)}) or path/filename [{default_hint}]: "
    else:
        print("No image files found in images/. Type a full path to an image.")
        default_hint = str(ROOT / "images" / "sample.jpg")
        prompt = f"Path to image [{default_hint}]: "

    while True:
        img_in = input(prompt).strip()
        if not img_in:
            if image_files:
                img_in = "1"
            else:
                img_in = str(ROOT / "images" / "sample.jpg")
        try:
            path = resolve_image_selection(img_in, image_files)
            break
        except FileNotFoundError as e:
            print(e)

    return num, path


def main(argv: list[str] | None = None) -> int:
    image_files = list_images_in_folder()
    args = parse_args(argv)
    if args is None:
        try:
            lesson_num, image_path = interactive_choose()
        except (EOFError, KeyboardInterrupt):
            print("\nCancelled.")
            return 130
    else:
        lesson_num = args.lesson
        assert lesson_num is not None
        img_arg = args.image or (
            "1" if image_files else str(ROOT / "images" / "sample.jpg")
        )
        try:
            image_path = resolve_image_selection(img_arg, image_files)
        except FileNotFoundError as e:
            print(e, file=sys.stderr)
            return 1

    stem, title = LESSONS[lesson_num]
    print(f"Lesson {lesson_num}: {stem} - {title}")
    print(f"Input image: {image_path}")

    try:
        load_and_run_lesson(stem, image_path)
    except FileNotFoundError as e:
        print(e, file=sys.stderr)
        return 1
    except SystemExit as e:
        if isinstance(e.code, int):
            return e.code
        return 1 if e.code else 0
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
