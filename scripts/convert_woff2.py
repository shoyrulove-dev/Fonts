"""Convert validated font files to WOFF2 for web previews and downloads."""

from __future__ import annotations

import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "manifests" / "font-validation.json"
OUTPUT = ROOT / "converted" / "woff2"


def main() -> None:
    report = json.loads(REPORT.read_text(encoding="utf-8"))
    candidates = [
        item for item in report["files"]
        if item["status"] == "valid"
    ]
    skipped = 0
    pending = []
    for item in candidates:
        source = ROOT / Path(item["path"])
        target = OUTPUT / source.relative_to(ROOT).with_suffix(".woff2")
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists() and target.stat().st_mtime >= source.stat().st_mtime:
            skipped += 1
            continue

        pending.append((source, target, item["path"]))

    def convert_one(job):
        source, target, display = job
        try:
            font = TTFont(source, recalcBBoxes=False, recalcTimestamp=False)
            font.flavor = "woff2"
            font.save(target)
            font.close()
            return None
        except Exception as exc:  # keep the batch running and report individual failures
            return {"source": display, "error": type(exc).__name__}

    errors = []
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = [executor.submit(convert_one, job) for job in pending]
        for index, future in enumerate(as_completed(futures), start=1):
            error = future.result()
            if error:
                errors.append(error)
            if index % 100 == 0 or index == len(futures):
                print(f"processed={index}/{len(futures)} errors={len(errors)}", flush=True)
    converted = len(pending) - len(errors)

    output_report = {
        "sourceReport": str(REPORT.relative_to(ROOT)).replace("\\", "/"),
        "candidateCount": len(candidates),
        "convertedCount": converted,
        "skippedCount": skipped,
        "errorCount": len(errors),
        "errors": errors,
    }
    out = ROOT / "manifests" / "woff2-conversion.json"
    out.write_text(json.dumps(output_report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"candidates={len(candidates)} converted={converted} "
        f"skipped={skipped} errors={len(errors)}"
    )


if __name__ == "__main__":
    main()
