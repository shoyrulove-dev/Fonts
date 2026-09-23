from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "sources" / "vietnamese"
OUTPUT = ROOT / "converted" / "woff2"
files = [path for path in SOURCE.rglob("*") if path.suffix.lower() in {".ttf", ".otf"}]

def convert(source):
    target = OUTPUT / source.relative_to(ROOT).with_suffix(".woff2")
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists() and target.stat().st_mtime >= source.stat().st_mtime:
        return "skipped"
    font = TTFont(source, recalcBBoxes=False, recalcTimestamp=False)
    font.flavor = "woff2"
    font.save(target)
    font.close()
    return "converted"

converted = skipped = errors = 0
with ThreadPoolExecutor(max_workers=4) as executor:
    futures = [executor.submit(convert, file) for file in files]
    for future in as_completed(futures):
        try:
            if future.result() == "converted": converted += 1
            else: skipped += 1
        except Exception as error:
            errors += 1
            print(f"error={type(error).__name__}")
print(f"complete files={len(files)} converted={converted} skipped={skipped} errors={errors}")
