import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { strToU8, unzipSync, zipSync } from "fflate";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(root, "sources", "open-fonts");
const outputJson = path.join(root, "src", "data", "open-fonts.json");
const reportPath = path.join(root, "manifests", "open-font-import.json");
const googleFonts = JSON.parse(await readFile(path.join(root, "src", "data", "google-fonts.json"), "utf8"));
const vietnameseFonts = JSON.parse(await readFile(path.join(root, "src", "data", "vietnamese-fonts.json"), "utf8"));

const FONT_LIBRARY_LICENSES = [
  ["OFL (SIL Open Font License)", 927, "standard"],
  ["MIT (X11) License", 48, "standard"],
  ["Apache 2.0", 30, "standard"],
  ["Public Domain (not a license)", 25, "standard"],
  ["CC-0", 10, "standard"],
  ["Bitstream Vera License (and derivative projects)", 25, "standard"],
  ["M+ Fonts Project License", 14, "standard"],
  ["GPL with font exception", 6, "standard"],
  ["GUST Font License", 6, "standard"],
  ["Arphic Public License", 17, "standard"],
  ["CC-BY", 39, "attribution"],
  ["CC-BY-SA", 22, "attribution"],
  ["GNU Lesser General Public License", 10, "attribution"],
  ["GNU General Public License", 138, "attribution"],
];

const normalizeName = (value) => String(value).toLowerCase().normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "").replace(/&/g, "and").replace(/[^a-z0-9]+/g, "");
const slugify = (value) => String(value).toLowerCase().normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function decodeHtml(value = "") {
  return value.replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/\s+/g, " ").trim();
}

function category(value = "") {
  const name = value.toLowerCase();
  if (/mono/.test(name)) return "MONOSPACE";
  if (/hand|script|callig|cursive/.test(name)) return "HANDWRITING";
  if (/sans/.test(name)) return "SANS_SERIF";
  if (/serif/.test(name)) return "SERIF";
  return "DISPLAY";
}

async function fetchWithRetry(url, options = {}, attempts = 4) {
  let error;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(45_000) });
      if (response.ok) return response;
      error = new Error(`HTTP ${response.status}: ${url}`);
    } catch (caught) { error = caught; }
    if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 750));
  }
  throw error;
}

async function fontLibraryCandidates() {
  const candidates = new Map();
  for (const [license, count, tier] of FONT_LIBRARY_LICENSES) {
    const pages = Math.ceil(count / 20) + 1;
    const htmlPages = await Promise.all(Array.from({ length: pages }, (_, index) => {
      const url = `https://fontlibrary.org/en/search?license=${encodeURIComponent(license)}&order=name&page=${index + 1}`;
      return fetchWithRetry(url).then((response) => response.text());
    }));
    for (const html of htmlPages) {
      for (const match of html.matchAll(/<li class="family-name heading"><a href="https:\/\/fontlibrary\.org\/en\/font\/([^"']+)">([^<]+)<\/a>/g)) {
        const [, pageSlug, rawName] = match;
        const name = decodeHtml(rawName);
        const key = normalizeName(name);
        if (!candidates.has(key)) candidates.set(key, { pageSlug, name, license, tier });
      }
    }
  }
  return [...candidates.values()];
}

function uniqueFilename(name, used) {
  const parsed = path.parse(path.basename(name));
  let candidate = `${slugify(parsed.name) || "font"}${parsed.ext.toLowerCase()}`;
  let suffix = 2;
  while (used.has(candidate)) candidate = `${slugify(parsed.name) || "font"}-${suffix++}${parsed.ext.toLowerCase()}`;
  used.add(candidate);
  return candidate;
}

async function importFontLibrary(candidate) {
  const pageUrl = `https://fontlibrary.org/en/font/${candidate.pageSlug}`;
  const html = await (await fetchWithRetry(pageUrl)).text();
  const downloadMatch = html.match(/href="(\/assets\/downloads\/[^"']+\.zip)"/i);
  if (!downloadMatch) throw new Error("missing-download-link");
  const archiveUrl = new URL(downloadMatch[1], "https://fontlibrary.org").href;
  const archiveBytes = new Uint8Array(await (await fetchWithRetry(archiveUrl)).arrayBuffer());
  const entries = unzipSync(archiveBytes);
  const fontEntries = Object.entries(entries).filter(([name, data]) => /\.(ttf|otf)$/i.test(name) && data.length);
  if (!fontEntries.length) throw new Error("archive-has-no-font-files");

  const slug = `fontlibrary-${candidate.pageSlug}`;
  const relativeDir = path.posix.join("sources/open-fonts/fontlibrary", slug);
  const directory = path.join(root, ...relativeDir.split("/"));
  await mkdir(directory, { recursive: true });
  const used = new Set();
  for (const [name, data] of fontEntries) await writeFile(path.join(directory, uniqueFilename(name, used)), data);
  await writeFile(path.join(directory, "source-package.zip"), archiveBytes);

  const categoryMatch = html.match(/<dt>Category<\/dt><dd><a[^>]*>([^<]+)<\/a>/i);
  const designerBlock = html.match(/<dt>Designer<\/dt><dd>([\s\S]*?)<\/dd>/i)?.[1] ?? "";
  const designer = decodeHtml(designerBlock) || "Not specified";
  return {
    id: `open/fontlibrary/${candidate.pageSlug}`,
    slug,
    name: candidate.name,
    designer,
    category: category(decodeHtml(categoryMatch?.[1] ?? "Display")),
    license: candidate.license,
    licenseTier: candidate.tier,
    subsets: [],
    supportsVietnamese: false,
    sourcePath: relativeDir,
    sourceUrl: pageUrl,
    sourceGroup: "Font Library",
    bundleKey: `fonts/bundles/${slug}/${slug}-bliss-fonts.zip`,
    status: "published",
    tags: ["Open Source", candidate.tier === "attribution" ? "Attribution Required" : "Open License"],
  };
}

async function fontsourceCandidates() {
  const response = await fetchWithRetry("https://api.github.com/repos/fontsource/font-files/contents/sources", {
    headers: { "User-Agent": "Bliss-Fonts-Importer" },
  });
  const directories = await response.json();
  return (await Promise.all(directories.map(async ({ name: id }) => {
    const metadataUrl = `https://raw.githubusercontent.com/fontsource/font-files/main/sources/${id}/metadata.json`;
    const metadataResponse = await fetchWithRetry(metadataUrl);
    return { id, metadata: await metadataResponse.json() };
  }))).filter(({ metadata }) => metadata?.family && metadata?.sourceFiles?.length);
}

async function importFontsource({ id, metadata }) {
  const slug = `fontsource-${id}`;
  const relativeDir = path.posix.join("sources/open-fonts/fontsource", slug);
  const directory = path.join(root, ...relativeDir.split("/"));
  await mkdir(directory, { recursive: true });
  const archive = {};
  for (const sourceFile of metadata.sourceFiles) {
    const rawUrl = `https://raw.githubusercontent.com/fontsource/font-files/main/sources/${id}/${sourceFile.path}`;
    const data = new Uint8Array(await (await fetchWithRetry(rawUrl)).arrayBuffer());
    const filename = path.basename(sourceFile.path);
    await writeFile(path.join(directory, filename), data);
    archive[`fonts/${filename}`] = data;
  }
  const licenseResponse = await fetchWithRetry(metadata.license.url);
  const licenseText = await licenseResponse.text();
  archive["LICENSE.txt"] = strToU8(licenseText);
  archive["README.txt"] = strToU8(`${metadata.family}\n\nDesigner: ${metadata.designer || "Not specified"}\nLicense: ${metadata.license.id}\nSource: ${metadata.project?.repository || "https://fontsource.org"}\n`);
  await writeFile(path.join(directory, "source-package.zip"), zipSync(archive, { level: 6 }));
  return {
    id: `open/fontsource/${id}`,
    slug,
    name: metadata.family,
    designer: metadata.designer || "Not specified",
    category: category((metadata.classifications || []).join(" ")),
    license: metadata.license.id,
    licenseTier: "standard",
    subsets: [],
    supportsVietnamese: false,
    sourcePath: relativeDir,
    sourceUrl: metadata.project?.repository || `https://fontsource.org/fonts/${id}`,
    sourceGroup: "Fontsource Community",
    bundleKey: `fonts/bundles/${slug}/${slug}-bliss-fonts.zip`,
    status: "published",
    tags: ["Open Source", "Open License"],
  };
}

async function fileExists(filename) {
  try { return (await stat(filename)).isFile(); } catch { return false; }
}

async function runQueue(items, worker, records, failures, label, concurrency = 5) {
  const queue = [...items];
  let completed = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      const item = queue.shift();
      try {
        const expectedSlug = label === "Font Library" ? `fontlibrary-${item.pageSlug}` : `fontsource-${item.id}`;
        const packagePath = path.join(outputRoot, label === "Font Library" ? "fontlibrary" : "fontsource", expectedSlug, "source-package.zip");
        const existing = records.find((record) => record.slug === expectedSlug);
        if (existing && await fileExists(packagePath)) continue;
        records.push(await worker(item));
      } catch (error) {
        failures.push({ source: label, id: item.pageSlug || item.id, error: error?.message || "ImportError" });
      } finally {
        completed++;
        if (completed % 25 === 0 || completed === items.length) {
          console.log(`${label}: ${completed}/${items.length} imported=${records.length} failed=${failures.length}`);
          await writeFile(outputJson, `${JSON.stringify(records, null, 2)}\n`, "utf8");
        }
      }
    }
  }));
}

await mkdir(outputRoot, { recursive: true });
await mkdir(path.dirname(reportPath), { recursive: true });
let records = [];
try { records = JSON.parse(await readFile(outputJson, "utf8")); } catch { /* First import. */ }
const failures = [];
const knownNames = new Set([...googleFonts, ...vietnameseFonts].map((font) => normalizeName(font.name)));
for (const record of records) knownNames.add(normalizeName(record.name));

const library = (await fontLibraryCandidates()).filter((font) => {
  const key = normalizeName(font.name);
  if (knownNames.has(key)) return false;
  knownNames.add(key);
  return true;
});
await runQueue(library, importFontLibrary, records, failures, "Font Library", 5);

const fontsource = (await fontsourceCandidates()).filter(({ metadata }) => {
  const key = normalizeName(metadata.family);
  if (knownNames.has(key)) return false;
  knownNames.add(key);
  return true;
});
await runQueue(fontsource, importFontsource, records, failures, "Fontsource", 5);

records = [...new Map(records.map((record) => [normalizeName(record.name), record])).values()]
  .sort((a, b) => a.name.localeCompare(b.name));
await writeFile(outputJson, `${JSON.stringify(records, null, 2)}\n`, "utf8");
await writeFile(reportPath, `${JSON.stringify({ createdAt: new Date().toISOString(), imported: records.length, failures }, null, 2)}\n`, "utf8");
console.log(`complete imported=${records.length} failures=${failures.length}`);
