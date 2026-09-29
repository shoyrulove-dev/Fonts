import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.env.FONT_SITE_URL || "https://fonts.blissbiovn.com";
const limit = Number(process.env.FONT_VERIFY_LIMIT || 0);
const offset = Number(process.env.FONT_VERIFY_OFFSET || 0);
const timeoutMs = Number(process.env.FONT_VERIFY_TIMEOUT_MS || 45000);
const concurrency = Math.max(1, Number(process.env.FONT_VERIFY_CONCURRENCY || 2));
const maxAttempts = Math.max(1, Number(process.env.FONT_VERIFY_RETRIES || 3));
const mode = process.env.FONT_VERIFY_MODE || "availability";
const international = JSON.parse(await fs.readFile(path.join(root, "src", "data", "google-fonts.json"), "utf8"));
const vietnamese = JSON.parse(await fs.readFile(path.join(root, "src", "data", "vietnamese-fonts.json"), "utf8"));
const catalog = [...international, ...vietnamese];
let selectedCatalog = catalog;
if (process.env.FONT_VERIFY_SLUGS) {
  const requested = new Set(process.env.FONT_VERIFY_SLUGS.split(",").map((slug) => slug.trim()).filter(Boolean));
  selectedCatalog = catalog.filter((font) => requested.has(font.slug));
} else if (process.env.FONT_VERIFY_RECHECK_FAILURES === "1") {
  const previous = JSON.parse(await fs.readFile(path.join(root, "manifests", "download-verification.json"), "utf8"));
  const failed = new Set(previous.failures.map((item) => item.slug));
  selectedCatalog = catalog.filter((font) => failed.has(font.slug));
}
const fonts = limit > 0 ? selectedCatalog.slice(offset, offset + limit) : selectedCatalog.slice(offset);
const failures = [];
const results = [];
let completed = 0;
const queue = [...fonts];

async function checkOnce(font) {
  try {
    const response = await fetch(`${baseUrl}/api/fonts/${font.slug}/download`, mode === "download"
      ? { headers: { Range: "bytes=0-3", "X-Bliss-Verification": "1" }, signal: AbortSignal.timeout(timeoutMs) }
      : { method: "HEAD", headers: { "X-Bliss-Verification": "1" }, signal: AbortSignal.timeout(timeoutMs) });
    let ok = response.ok;
    let contentType = response.headers.get("content-type");
    if (mode === "download") {
      const reader = response.body?.getReader();
      const first = reader ? await reader.read() : { value: new Uint8Array() };
      await reader?.cancel();
      const bytes = first.value ?? new Uint8Array();
      ok = ok && Boolean(contentType?.includes("application/zip")) && bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;
    }
    return { slug: font.slug, ok, status: response.status, asset: response.headers.get("x-bliss-asset"), contentType, checkedAt: new Date().toISOString() };
  } catch (error) {
    return { slug: font.slug, ok: false, error: error.name, checkedAt: new Date().toISOString() };
  }
}

async function check(font) {
  let result;
  let attempts = 0;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    attempts = attempt;
    result = await checkOnce(font);
    if (result.ok) break;
    if (attempt < maxAttempts) await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
  }
  result.attempts = attempts;
  results.push(result);
  if (!result.ok) failures.push(result);
  completed++;
  if (completed % 25 === 0 || completed === fonts.length) console.log(`checked=${completed}/${fonts.length} failures=${failures.length}`);
}

await Promise.all(Array.from({ length: concurrency }, async () => { while (queue.length) await check(queue.shift()); }));
const report = { baseUrl, mode, offset, maxAttempts, checked: fonts.length, passed: fonts.length - failures.length, failures, createdAt: new Date().toISOString() };
await fs.mkdir(path.join(root, "manifests"), { recursive: true });
await fs.writeFile(path.join(root, "manifests", "download-verification.json"), JSON.stringify(report, null, 2) + "\n");
const progressPath = path.join(root, "manifests", "download-verification-progress.json");
let progress = {};
try { progress = JSON.parse(await fs.readFile(progressPath, "utf8")); } catch { /* Start a new cumulative report. */ }
for (const result of results) progress[result.slug] = result;
await fs.writeFile(progressPath, JSON.stringify(progress, null, 2) + "\n");
console.log(`complete checked=${fonts.length} failures=${failures.length}`);
if (failures.length) process.exitCode = 1;
