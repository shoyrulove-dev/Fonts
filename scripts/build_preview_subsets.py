"""Create small WOFF2 preview files for large fonts skipped by the full converter."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "converted" / "woff2"
REPORT = ROOT / "manifests" / "preview-subsets.json"
SAMPLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ẮăÂâĐđÊêÔôƠơƯư àáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵ 日本語 中文 한글 .,!?&@#%+-–—'\"()[]:;/"


def convert(source: Path, target: Path) -> None:
    font = TTFont(source, recalcBBoxes=False, recalcTimestamp=False)
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.name_legacy = True
    options.name_languages = ["*"]
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text=SAMPLE)
    subsetter.subset(font)
    target.parent.mkdir(parents=True, exist_ok=True)
    font.flavor = "woff2"
    font.save(target)
    font.close()


def candidate(directory: Path) -> Path | None:
    files = [item for item in directory.rglob("*") if item.suffix.lower() in {".ttf", ".otf"}]
    if not files:
        return None
    def score(item: Path) -> tuple[int, int, int]:
        name = item.stem.lower()
        return (0 if "regular" in name else 1, 1 if "variable" in name else 0, item.stat().st_size)
    return min(files, key=score)


def worker(source: Path, target: Path) -> None:
    subprocess.run([sys.executable, __file__, "--worker", str(source), str(target)], check=True, timeout=120, capture_output=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--worker", nargs=2)
    args = parser.parse_args()
    if args.worker:
        convert(Path(args.worker[0]), Path(args.worker[1]))
        return

    catalog = json.loads((ROOT / "src" / "data" / "google-fonts.json").read_text(encoding="utf-8"))
    catalog += json.loads((ROOT / "src" / "data" / "vietnamese-fonts.json").read_text(encoding="utf-8"))
    manifest = json.loads((ROOT / "src" / "data" / "woff2-manifest.json").read_text(encoding="utf-8"))
    jobs: list[tuple[dict, Path, Path]] = []
    errors: list[dict] = []
    for font in catalog:
        source_path = font.get("sourcePath")
        if not source_path or manifest.get(source_path):
            continue
        source = candidate(ROOT / source_path)
        if not source:
            errors.append({"slug": font["slug"], "error": "No TTF or OTF source"})
            continue
        target = OUTPUT / source_path / "preview-subset.woff2"
        jobs.append((font, source, target))

    completed: list[dict] = []
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(worker, source, target): (font, source, target) for font, source, target in jobs}
        for index, future in enumerate(as_completed(futures), start=1):
            font, source, target = futures[future]
            try:
                future.result()
                completed.append({"slug": font["slug"], "source": source.relative_to(ROOT).as_posix(), "target": target.relative_to(OUTPUT).as_posix(), "bytes": target.stat().st_size})
            except subprocess.TimeoutExpired:
                errors.append({"slug": font["slug"], "error": "Timeout"})
            except subprocess.CalledProcessError:
                errors.append({"slug": font["slug"], "error": "Conversion failed"})
            if index % 20 == 0 or index == len(futures):
                print(f"processed={index}/{len(futures)} errors={len(errors)}", flush=True)

    REPORT.write_text(json.dumps({"created": completed, "errors": errors}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"complete created={len(completed)} errors={len(errors)}")


if __name__ == "__main__":
    main()
