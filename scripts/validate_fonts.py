"""Validate font files for metadata, Vietnamese glyph coverage, and readability."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from fontTools.ttLib import TTFont, TTLibError


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "sources" / "google-fonts"
OUTPUT = ROOT / "manifests" / "font-validation.json"
REQUIRED_VIETNAMESE = set("ĂÂĐÊÔƠƯăâđêôơư")


def best_name(font: TTFont, name_id: int) -> str | None:
    names = font["name"].names if "name" in font else []
    for record in names:
        if record.nameID != name_id:
            continue
        try:
            value = record.toUnicode().strip()
        except UnicodeDecodeError:
            continue
        if value:
            return value
    return None


def validate(path: Path) -> dict:
    result = {
        "path": path.relative_to(ROOT).as_posix(),
        "file": path.name,
        "extension": path.suffix.lower(),
        "size": path.stat().st_size,
        "status": "valid",
        "errors": [],
    }
    try:
        font = TTFont(path, lazy=True, recalcBBoxes=False, recalcTimestamp=False)
        cmap = font.getBestCmap() or {}
        result.update(
            {
                "family": best_name(font, 1),
                "subfamily": best_name(font, 2),
                "postScriptName": best_name(font, 6),
                "glyphCount": len(font.getGlyphOrder()),
                "unicodeCount": len(cmap),
                "vietnameseCoverage": sorted(
                    character for character in REQUIRED_VIETNAMESE if ord(character) in cmap
                ),
                "supportsVietnameseCore": all(
                    ord(character) in cmap for character in REQUIRED_VIETNAMESE
                ),
            }
        )
        if "name" not in font or "cmap" not in font:
            result["status"] = "review"
            result["errors"].append("missing-required-table")
        font.close()
    except (TTLibError, OSError, ValueError) as exc:
        result["status"] = "invalid"
        result["errors"].append(type(exc).__name__)
    return result


def main() -> None:
    files = sorted(
        path
        for path in SOURCE.rglob("*")
        if path.is_file() and path.suffix.lower() in {".ttf", ".otf"}
    )
    records = [validate(path) for path in files]
    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": "google/fonts",
        "fileCount": len(records),
        "validCount": sum(item["status"] == "valid" for item in records),
        "invalidCount": sum(item["status"] == "invalid" for item in records),
        "vietnameseCoreCount": sum(item.get("supportsVietnameseCore", False) for item in records),
        "files": records,
    }
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"files={report['fileCount']} valid={report['validCount']} "
        f"invalid={report['invalidCount']} vietnamese_core={report['vietnameseCoreCount']}"
    )


if __name__ == "__main__":
    main()
