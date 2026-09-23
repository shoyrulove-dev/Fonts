import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.env.FONT_SITE_URL || "https://fonts.blissbiovn.com";
const limit = Number(process.env.FONT_VERIFY_LIMIT || 0);
const offset = Number(process.env.FONT_VERIFY_OFFSET || 0);
const timeoutMs = Number(process.env.FONT_VERIFY_TIMEOUT_MS || 45000);
const concurrency = Math.max(1, Number(process.env.FONT_VERIFY_CONCURRENCY || 2));
const catalog = JSON.parse(await fs.readFile(path.join(root, "src", "data", "google-fonts.json"), "utf8"));
const fonts = limit > 0 ? catalog.slice(offset, offset + limit) : catalog.slice(offset);
const failures = [];
let completed = 0;
const queue = [...fonts];

async function check(font) {
  try {
    const response = await fetch(`${baseUrl}/api/fonts/${font.slug}/download`, { signal: AbortSignal.timeout(timeoutMs) });
    const bytes = new Uint8Array(await response.arrayBuffer());
    const zip = bytes.length > 22 && bytes[0] === 0x50 && bytes[1] === 0x4b;
    if (!response.ok || !response.headers.get("content-type")?.includes("application/zip") || !zip) failures.push({ slug: font.slug, status: response.status, contentType: response.headers.get("content-type"), bytes: bytes.length });
  } catch (error) { failures.push({ slug: font.slug, error: error.name }); }
  completed++;
  if (completed % 25 === 0 || completed === fonts.length) console.log(`checked=${completed}/${fonts.length} failures=${failures.length}`);
}

await Promise.all(Array.from({ length: concurrency }, async () => { while (queue.length) await check(queue.shift()); }));
const report = { baseUrl, offset, checked: fonts.length, failures, createdAt: new Date().toISOString() };
await fs.mkdir(path.join(root, "manifests"), { recursive: true });
await fs.writeFile(path.join(root, "manifests", "download-verification.json"), JSON.stringify(report, null, 2) + "\n");
console.log(`complete checked=${fonts.length} failures=${failures.length}`);
if (failures.length) process.exitCode = 1;
