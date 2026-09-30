import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createReadStream } from "node:fs";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(await readFile(path.join(root, "src", "data", "open-fonts.json"), "utf8"));
const envText = await readFile(path.join(root, ".env.r2.local"), "utf8");
const localEnv = Object.fromEntries(envText.split(/\r?\n/).flatMap((line) => {
  const match = line.match(/^([A-Z0-9_]+)="?([^"\r\n]*)"?$/);
  return match ? [[match[1], match[2]]] : [];
}));
const config = { ...localEnv, ...process.env };
for (const key of ["R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "R2_ENDPOINT"]) {
  if (!config[key]) throw new Error(`Missing ${key}`);
}

const client = new S3Client({
  region: "auto",
  endpoint: config.R2_ENDPOINT,
  credentials: { accessKeyId: config.R2_ACCESS_KEY_ID, secretAccessKey: config.R2_SECRET_ACCESS_KEY },
});

const jobs = [];
for (const font of catalog) {
  const bundle = path.join(root, font.sourcePath, "source-package.zip");
  jobs.push({
    file: bundle,
    key: font.bundleKey,
    type: "application/zip",
    disposition: `attachment; filename="${font.slug}-bliss-fonts.zip"`,
  });
  const preview = path.join(root, "converted", "woff2", font.sourcePath, "preview.woff2");
  try {
    await stat(preview);
    jobs.push({ file: preview, key: `fonts/${font.sourcePath}/preview.woff2`, type: "font/woff2" });
  } catch { /* Oversized families remain downloadable without a web preview. */ }
}

let uploaded = 0;
let skipped = 0;
const failures = [];
const queue = [...jobs];

async function upload(job) {
  const info = await stat(job.file);
  try {
    const existing = await client.send(new HeadObjectCommand({ Bucket: config.R2_BUCKET_NAME, Key: job.key }));
    if (Number(existing.ContentLength) === info.size) { skipped++; return; }
  } catch { /* Missing object: upload it. */ }
  await client.send(new PutObjectCommand({
    Bucket: config.R2_BUCKET_NAME,
    Key: job.key,
    Body: createReadStream(job.file),
    ContentLength: info.size,
    ContentType: job.type,
    ...(job.disposition ? { ContentDisposition: job.disposition } : {}),
    CacheControl: job.type === "font/woff2" ? "public, max-age=31536000, immutable" : "public, max-age=86400",
  }));
  uploaded++;
}

await Promise.all(Array.from({ length: 8 }, async () => {
  while (queue.length) {
    const job = queue.shift();
    try { await upload(job); }
    catch (error) { failures.push({ key: job.key, error: error?.name || error?.message || "UploadError" }); }
    const completed = uploaded + skipped + failures.length;
    if (completed % 50 === 0 || completed === jobs.length) console.log(`uploaded=${uploaded} skipped=${skipped} failed=${failures.length} total=${completed}/${jobs.length}`);
  }
}));

const report = { createdAt: new Date().toISOString(), jobs: jobs.length, uploaded, skipped, failures };
await writeFile(path.join(root, "manifests", "open-font-upload.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`complete uploaded=${uploaded} skipped=${skipped} failed=${failures.length}`);
if (failures.length) process.exitCode = 1;
