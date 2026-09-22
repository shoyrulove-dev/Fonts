"""Build a local SQLite catalog from the generated font manifests."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "manifests" / "google-fonts.json"
VALIDATION = ROOT / "manifests" / "font-validation.json"
DATABASE = ROOT / "catalog.sqlite"


def main() -> None:
    families = json.loads(MANIFEST.read_text(encoding="utf-8"))
    validation = json.loads(VALIDATION.read_text(encoding="utf-8"))["files"]
    by_family: dict[str, list[dict]] = {}
    for item in validation:
        path = Path(item["path"])
        family_key = path.parent.as_posix()
        by_family.setdefault(family_key, []).append(item)

    DATABASE.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DATABASE) as db:
        db.executescript(
            """
            PRAGMA journal_mode=WAL;
            CREATE TABLE IF NOT EXISTS fonts (
                id TEXT PRIMARY KEY,
                slug TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                designer TEXT,
                category TEXT,
                license TEXT NOT NULL,
                source_url TEXT NOT NULL,
                supports_vietnamese INTEGER NOT NULL,
                status TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS font_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                font_id TEXT NOT NULL REFERENCES fonts(id),
                source_path TEXT NOT NULL,
                file_name TEXT NOT NULL,
                extension TEXT NOT NULL,
                size_bytes INTEGER NOT NULL,
                glyph_count INTEGER,
                unicode_count INTEGER,
                supports_vietnamese_core INTEGER NOT NULL,
                validation_status TEXT NOT NULL,
                UNIQUE(font_id, source_path)
            );
            DELETE FROM font_files;
            DELETE FROM fonts;
            """
        )
        for family in families:
            db.execute(
                "INSERT INTO fonts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    family["id"], family["slug"], family["name"], family.get("designer"),
                    family.get("category"), family["license"], family["sourceUrl"],
                    int(family["supportsVietnamese"]), family["status"],
                ),
            )
            for item in by_family.get(family["sourcePath"], []):
                db.execute(
                    """INSERT INTO font_files
                    (font_id, source_path, file_name, extension, size_bytes, glyph_count,
                     unicode_count, supports_vietnamese_core, validation_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        family["id"], item["path"], item["file"], item["extension"],
                        item["size"], item.get("glyphCount"), item.get("unicodeCount"),
                        int(item.get("supportsVietnameseCore", False)), item["status"],
                    ),
                )
        db.commit()
        counts = db.execute("SELECT COUNT(*), (SELECT COUNT(*) FROM font_files) FROM fonts").fetchone()
    print(f"families={counts[0]} files={counts[1]} database={DATABASE}")


if __name__ == "__main__":
    main()
