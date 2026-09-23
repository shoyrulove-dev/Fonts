import { unzipSync } from "fflate";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const archiveRoot = "C:/Users/Admin/Downloads/drive-download-20260923T142655Z-1-001";
const outputRoot = path.join(root, "sources", "vietnamese");
const outputJson = path.join(root, "src", "data", "vietnamese-fonts.json");
const archives = ["SFU Font.zip", "SVN Font.zip", "UTM Font.zip", "UVF Font.zip", "UVN Font.zip"];

function slugify(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\.(ttf|otf|woff2?)$/i, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function category(name) {
  const value = name.toLowerCase();
  if (/script|hand|brush|callig|signature|cursive|chancery/.test(value)) return "HANDWRITING";
  if (/serif|times|baskerville|bodoni|garamond/.test(value)) return "SERIF";
  if (/sans|gothic|grotesk|arial|helvetica/.test(value)) return "SANS_SERIF";
  return "DISPLAY";
}

const records = [];
const usedSlugs = new Set();
await mkdir(outputRoot, { recursive: true });

for (const archiveName of archives) {
  const group = archiveName.replace(/\s+Font\.zip$/i, "").toLowerCase();
  const bytes = await readFile(path.join(archiveRoot, archiveName));
  const entries = unzipSync(new Uint8Array(bytes));
  for (const [entryName, data] of Object.entries(entries)) {
    if (!/\.(ttf|otf)$/i.test(entryName) || !data.length) continue;
    const filename = path.basename(entryName);
    const baseName = filename.replace(/\.(ttf|otf)$/i, "");
    const rawSlug = `${group}-${slugify(baseName)}`;
    let slug = rawSlug;
    let suffix = 2;
    while (usedSlugs.has(slug)) slug = `${rawSlug}-${suffix++}`;
    usedSlugs.add(slug);
    const relativeDir = path.posix.join("sources/vietnamese", group, slug);
    const relativeFile = path.posix.join(relativeDir, filename);
    const absoluteDir = path.join(root, ...relativeDir.split("/"));
    await mkdir(absoluteDir, { recursive: true });
    await writeFile(path.join(absoluteDir, filename), data);
    records.push({
      id: `vietnamese/${group}/${slugify(baseName)}`,
      slug,
      name: baseName,
      designer: group.toUpperCase(),
      category: category(baseName),
      license: "Personal Use",
      subsets: ["vietnamese"],
      supportsVietnamese: true,
      sourcePath: relativeDir,
      sourceUrl: "https://fonts.blissbiovn.com/vietnamese",
      sourceGroup: group.toUpperCase(),
      sourceFile: relativeFile,
      status: "published",
      tags: ["Vietnamese", group.toUpperCase(), "Personal Use"],
    });
  }
}

records.sort((a, b) => a.name.localeCompare(b.name));
await writeFile(outputJson, JSON.stringify(records, null, 2) + "\n", "utf8");
console.log(`imported=${records.length} archives=${archives.length}`);
