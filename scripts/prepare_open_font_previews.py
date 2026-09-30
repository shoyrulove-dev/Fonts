"""Validate imported open fonts and create one lightweight WOFF2 preview per family."""

from __future__ import annotations

import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "src" / "data" / "open-fonts.json"
OUTPUT_ROOT = ROOT / "converted" / "woff2"
REPORT = ROOT / "manifests" / "open-font-previews.json"
# Large CJK and Unicode families still need a lightweight web preview. The
# source ZIP remains untouched; this limit only controls preview conversion.
MAX_PREVIEW_SOURCE_BYTES = 128 * 1024 * 1024
REQUIRED_VIETNAMESE = set("ĂÂĐÊÔƠƯăâđêôơư")


def preference(path: Path) -> tuple[int, int, str]:
    name = path.stem.lower()
    regular = 0 if any(token in name for token in ("regular", "normal", "book", "roman")) else 1
    return regular, path.stat().st_size, path.name.casefold()


def inspect_font(path: Path) -> tuple[bool, bool]:
    try:
        font = TTFont(path, lazy=True, recalcBBoxes=False, recalcTimestamp=False)
        cmap = font.getBestCmap() or {}
        valid = "name" in font and "cmap" in font and bool(font.getGlyphOrder())
        vietnamese = all(ord(character) in cmap for character in REQUIRED_VIETNAMESE)
        font.close()
        return valid, vietnamese
    except Exception:
        return False, False


def convert_preview(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    font = TTFont(source, recalcBBoxes=False, recalcTimestamp=False)
    # Keep previews small even for CJK/Unicode families. The complete source
    # files remain in the ZIP; the web specimen only needs common Latin text.
    options = Options()
    options.layout_features = ["*"]
    subsetter = Subsetter(options=options)
    subsetter.populate(unicodes=set(range(0x20, 0x7F)) | set(range(0xA0, 0x100)) | set(map(ord, "ĂÂĐÊÔƠƯăâđêôơư")))
    try:
        subsetter.subset(font)
    except Exception:
        # A few legacy Unicode fonts contain malformed optional tables. Keep
        # the font usable by removing the broken layout table and retrying.
        font.close()
        font = TTFont(source, recalcBBoxes=False, recalcTimestamp=False)
        if "BASE" in font:
            del font["BASE"]
        subsetter.subset(font)
    font.flavor = "woff2"
    font.save(target)
    font.close()


def process(record: dict) -> dict:
    directory = ROOT / record["sourcePath"]
    candidates = sorted(
        (path for path in directory.iterdir() if path.suffix.lower() in {".ttf", ".otf"}),
        key=preference,
    )
    preview_candidates = [path for path in candidates if path.stat().st_size <= MAX_PREVIEW_SOURCE_BYTES]
    oversized_files = [path for path in candidates if path.stat().st_size > MAX_PREVIEW_SOURCE_BYTES]
    valid_files: list[Path] = []
    supports_vietnamese = False
    invalid_files: list[str] = []
    for candidate in preview_candidates:
        valid, vietnamese = inspect_font(candidate)
        if valid:
            valid_files.append(candidate)
            supports_vietnamese = supports_vietnamese or vietnamese
        else:
            invalid_files.append(candidate.name)

    preview_source = valid_files[0] if valid_files else None
    preview_error = None
    if preview_source:
        target = OUTPUT_ROOT / record["sourcePath"] / "preview.woff2"
        try:
            if not target.exists() or target.stat().st_mtime < preview_source.stat().st_mtime:
                convert_preview(preview_source, target)
        except Exception as error:
            preview_error = type(error).__name__
            preview_source = None

    return {
        "record": {
            **record,
            "sourceFileCount": len(candidates),
            "supportsVietnamese": supports_vietnamese,
        },
        "valid": len(valid_files),
        "retain": bool(valid_files or oversized_files),
        "oversized": [path.name for path in oversized_files],
        "invalid": invalid_files,
        "preview": preview_source.name if preview_source else None,
        "previewError": preview_error,
    }


def main() -> None:
    records = json.loads(CATALOG.read_text(encoding="utf-8"))
    results = []
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(process, record) for record in records]
        for completed, future in enumerate(as_completed(futures), start=1):
            results.append(future.result())
            if completed % 50 == 0 or completed == len(futures):
                print(f"prepared={completed}/{len(futures)}", flush=True)

    valid_results = [result for result in results if result["retain"]]
    output_records = sorted((result["record"] for result in valid_results), key=lambda item: item["name"].casefold())
    CATALOG.write_text(json.dumps(output_records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report = {
        "familyCount": len(records),
        "validFamilyCount": len(valid_results),
        "removedFamilyCount": len(records) - len(valid_results),
        "sourceFileCount": sum(result["record"]["sourceFileCount"] for result in valid_results),
        "invalidFileCount": sum(len(result["invalid"]) for result in results),
        "previewFamilyCount": sum(bool(result["preview"]) for result in valid_results),
        "oversizedFamilyCount": sum(bool(result["oversized"]) for result in valid_results),
        "previewErrors": [
            {"slug": result["record"]["slug"], "error": result["previewError"]}
            for result in valid_results if result["previewError"]
        ],
        "removed": [result["record"]["slug"] for result in results if not result["retain"]],
    }
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
