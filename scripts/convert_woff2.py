"""Convert validated font files to WOFF2 without allowing one bad font to block a batch."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "manifests" / "font-validation.json"
OUTPUT = ROOT / "converted" / "woff2"
SKIP = {
    "sources/google-fonts/ofl/bpmfzihikaistd/BpmfZihiKaiStd-Regular.ttf",
    "sources/google-fonts/ofl/gamjaflower/GamjaFlower-Regular.ttf",
    "sources/google-fonts/ofl/gungsuh/Gungsuh-Regular.ttf",
    "sources/google-fonts/ofl/gungsuhche/GungsuhChe-Regular.ttf",
    "sources/google-fonts/ofl/himelody/HiMelody-Regular.ttf",
}


def convert_one(source: Path, target: Path) -> None:
    font = TTFont(source, recalcBBoxes=False, recalcTimestamp=False)
    font.flavor = "woff2"
    font.save(target)
    font.close()


def run_worker(source: Path, target: Path, display: str) -> dict | None:
    try:
        subprocess.run([sys.executable, __file__, "--worker", str(source), str(target)], check=True, timeout=20, capture_output=True)
        return None
    except subprocess.TimeoutExpired:
        return {"source": display, "error": "Timeout"}
    except subprocess.CalledProcessError:
        return {"source": display, "error": "ConversionError"}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--worker", nargs=2, metavar=("SOURCE", "TARGET"))
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()
    if args.worker:
        source, target = map(Path, args.worker)
        target.parent.mkdir(parents=True, exist_ok=True)
        convert_one(source, target)
        return

    report = json.loads(REPORT.read_text(encoding="utf-8"))
    pending = []
    skipped = 0
    for item in report["files"]:
        if item["status"] != "valid":
            continue
        if item["path"] in SKIP:
            skipped += 1
            continue
        source = ROOT / Path(item["path"])
        target = OUTPUT / source.relative_to(ROOT).with_suffix(".woff2")
        if target.exists() and target.stat().st_mtime >= source.stat().st_mtime:
            skipped += 1
            continue
        pending.append((source, target, item["path"]))
    if args.limit:
        pending = pending[:args.limit]

    errors = []
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(run_worker, *job) for job in pending]
        for index, future in enumerate(as_completed(futures), start=1):
            error = future.result()
            if error:
                errors.append(error)
            if index % 25 == 0 or index == len(futures):
                print(f"processed={index}/{len(futures)} errors={len(errors)}", flush=True)

    output = {"candidateCount": len(pending) + skipped, "convertedCount": len(pending) - len(errors), "skippedCount": skipped, "errorCount": len(errors), "errors": errors}
    (ROOT / "manifests" / "woff2-conversion.json").write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"complete converted={output['convertedCount']} skipped={skipped} errors={len(errors)}")


if __name__ == "__main__":
    main()
