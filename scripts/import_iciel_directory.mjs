import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inputRoot = "C:/Users/Admin/Downloads/Font iCiel Full";
const outputJson = path.join(root, "src", "data", "vietnamese-fonts.json");

function slugify(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\.(ttf|otf)$/i, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function category(name) {
  const value = name.toLowerCase();
  if (/script|hand|brush|callig|signature|cursive|chancery/.test(value)) return "HANDWRITING";
  if (/serif|times|baskerville|bodoni|garamond/.test(value)) return "SERIF";
  if (/sans|gothic|grotesk|arial|helvetica/.test(value)) return "SANS_SERIF";
  return "DISPLAY";
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === "__MACOSX" || entry.name.startsWith("._")) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (/\.(ttf|otf)$/i.test(entry.name)) files.push(full);
  }
  return files;
}

const existing = JSON.parse(await readFile(outputJson, "utf8"));
const used = new Set(existing.map((font) => font.slug));
const records = [];
for (const source of await walk(inputRoot)) {
  const filename = path.basename(source);
  const baseName = filename.replace(/\.(ttf|otf)$/i, "");
  const rawSlug = `iciel-${slugify(baseName)}`;
  let slug = rawSlug;
  let suffix = 2;
  while (used.has(slug)) slug = `${rawSlug}-${suffix++}`;
  used.add(slug);
  const relativeDir = path.posix.join("sources/vietnamese/iciel", slug);
  const relativeFile = path.posix.join(relativeDir, filename);
  await mkdir(path.join(root, ...relativeDir.split("/")), { recursive: true });
  await copyFile(source, path.join(root, ...relativeFile.split("/")));
  records.push({ id: `vietnamese/iciel/${slugify(baseName)}`, slug, name: baseName, designer: "iCiel", category: category(baseName), license: "Personal Use", subsets: ["vietnamese"], supportsVietnamese: true, sourcePath: relativeDir, sourceUrl: "https://fonts.blissbiovn.com/vietnamese", sourceGroup: "iCIEL", sourceFile: relativeFile, status: "published", tags: ["Vietnamese", "iCiel", "Personal Use"] });
}

records.sort((a, b) => a.name.localeCompare(b.name));
await writeFile(outputJson, JSON.stringify([...existing, ...records], null, 2) + "\n", "utf8");
console.log(`imported=${records.length} totalVietnamese=${existing.length + records.length}`);
