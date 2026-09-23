import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.env.FONT_SITE_URL || "https://fonts.blissbiovn.com";
const limit = Number(process.env.FONT_VERIFY_LIMIT || 0);
const offset = Number(process.env.FONT_VERIFY_OFFSET || 0);
const timeoutMs = Number(process.env.FONT_VERIFY_TIMEOUT_MS || 45000);
const concurrency = Math.max(1, Number(process.env.FONT_VERIFY_CONCURRENCY || 2));
const international = JSON.parse(await fs.readFile(path.join(root, "src", "data", "google-fonts.json"), "utf8"));
const vietnamese = JSON.parse(await fs.readFile(path.join(root, "src", "data", "vietnamese-fonts.json"), "utf8"));
const catalog = [...international, ...vietnamese];
const fonts = limit > 0 ? catalog.slice(offset, offset + limit) : catalog.slice(offset);
const failures = [];
const results = [];
let completed = 0;
const queue = [...fonts];

async function check(font) {
  try {
    const response = await fetch(`${baseUrl}/api/fonts/${font.slug}/download`, { headers: { Range: "bytes=0-3", "X-Bliss-Verification": "1" }, signal: AbortSignal.timeout(timeoutMs) });
    const reader = response.body?.getReader();
    const first = reader ? await reader.read() : { value: new Uint8Array() };
    await reader?.cancel();
    const bytes = first.value ?? new Uint8Array();
    const zip = bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;
    const result = { slug: font.slug, ok: response.ok && Boolean(response.headers.get("content-type")?.includes("application/zip")) && zip, status: response.status, contentType: response.headers.get("content-type"), checkedAt: new Date().toISOString() };
    results.push(result);
    if (!result.ok) failures.push(result);
  } catch (error) { const result = { slug: font.slug, ok: false, error: error.name, checkedAt: new Date().toISOString() }; results.push(result); failures.push(result); }
  completed++;
  if (completed % 25 === 0 || completed === fonts.length) console.log(`checked=${completed}/${fonts.length} failures=${failures.length}`);
}

await Promise.all(Array.from({ length: concurrency }, async () => { while (queue.length) await check(queue.shift()); }));
const report = { baseUrl, offset, checked: fonts.length, passed: fonts.length - failures.length, failures, createdAt: new Date().toISOString() };
await fs.mkdir(path.join(root, "manifests"), { recursive: true });
await fs.writeFile(path.join(root, "manifests", "download-verification.json"), JSON.stringify(report, null, 2) + "\n");
const progressPath = path.join(root, "manifests", "download-verification-progress.json");
let progress = {};
try { progress = JSON.parse(await fs.readFile(progressPath, "utf8")); } catch { /* Start a new cumulative report. */ }
for (const result of results) progress[result.slug] = result;
await fs.writeFile(progressPath, JSON.stringify(progress, null, 2) + "\n");
console.log(`complete checked=${fonts.length} failures=${failures.length}`);
if (failures.length) process.exitCode = 1;
