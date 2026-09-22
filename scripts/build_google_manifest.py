"""Build a license-aware manifest from the official google/fonts checkout."""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "sources" / "google-fonts"
OUTPUT = ROOT / "manifests" / "google-fonts.json"


def field(text: str, name: str) -> str | None:
    match = re.search(rf'^\s*{re.escape(name)}:\s*"([^"]*)"', text, re.MULTILINE)
    return match.group(1) if match else None


def all_fields(text: str, name: str) -> list[str]:
    return re.findall(rf'^\s*{re.escape(name)}:\s*"([^"]*)"', text, re.MULTILINE)


def main() -> None:
    records = []
    for metadata_path in sorted(SOURCE.rglob("METADATA.pb")):
        text = metadata_path.read_text(encoding="utf-8")
        subsets = all_fields(text, "subsets")
        license_name = field(text, "license")
        family = field(text, "name")
        if not family or not license_name:
            continue
        rel_dir = metadata_path.parent.relative_to(SOURCE).as_posix()
        records.append(
            {
                "id": rel_dir,
                "slug": metadata_path.parent.name,
                "name": family,
                "designer": field(text, "designer"),
                "category": field(text, "category"),
                "license": license_name,
                "subsets": sorted(set(subsets)),
                "supportsVietnamese": "vietnamese" in subsets,
                "sourcePath": str(metadata_path.parent.relative_to(ROOT)).replace("\\", "/"),
                "sourceUrl": f"https://github.com/google/fonts/tree/main/{rel_dir}",
                "status": "approved-source" if license_name in {"OFL", "APACHE2", "UFL"} else "review",
            }
        )

    records.sort(key=lambda item: item["name"].casefold())
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    vietnamese = sum(item["supportsVietnamese"] for item in records)
    print(f"families={len(records)} vietnamese={vietnamese} output={OUTPUT}")


if __name__ == "__main__":
    main()
