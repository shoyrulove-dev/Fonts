import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { strToU8, zipSync } from "fflate";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "converted", "woff2");
const catalog = JSON.parse(await readFile(path.join(root, "src/data/google-fonts.json"), "utf8"));
const manifest = JSON.parse(await readFile(path.join(root, "src/data/woff2-manifest.json"), "utf8"));
const localEnv = Object.fromEntries((await readFile(path.join(root, ".env.r2.local"), "utf8")).split(/\r?\n/).flatMap((line) => {
  const match = line.match(/^([A-Z0-9_]+)="?([^"]*)"?$/);
  return match ? [[match[1], match[2]]] : [];
}));
const config = { ...localEnv, ...process.env };
const client = new S3Client({
  region: "auto",
  endpoint: config.R2_ENDPOINT,
  credentials: { accessKeyId: config.R2_ACCESS_KEY_ID, secretAccessKey: config.R2_SECRET_ACCESS_KEY },
});
const threshold = 3 * 1024 * 1024;
const candidates = [];

for (const font of catalog) {
  const files = manifest[font.sourcePath] || [];
  if (!files.length) continue;
  let bytes = 0;
  for (const key of files) bytes += (await stat(path.join(sourceRoot, key.replace(/^fonts\//, "")))).size;
  if (bytes > threshold) candidates.push({ font, files, bytes });
}

console.log(`large families=${candidates.length} of ${catalog.length}`);
if (process.argv.includes("--dry-run")) process.exit(0);

let uploaded = 0;
let failed = 0;
for (const { font, files, bytes } of candidates) {
  try {
    const archive = {};
    for (const key of files) archive[`fonts/${path.basename(key)}`] = new Uint8Array(await readFile(path.join(sourceRoot, key.replace(/^fonts\//, ""))));
    archive["README.txt"] = strToU8([
      `${font.name} - Bliss Fonts`,
      "",
      `Designer: ${font.designer || "Not specified"}`,
      `License: ${font.license}`,
      `Vietnamese support: ${font.supportsVietnamese ? "Confirmed" : "Not confirmed"}`,
      `Official source: ${font.sourceUrl || "Not specified"}`,
      "",
      "Please review the original license before using this font in commercial work.",
      "Downloaded from https://fonts.blissbiovn.com",
    ].join("\n"));
    const zip = zipSync(archive, { level: 0 });
    await client.send(new PutObjectCommand({
      Bucket: config.R2_BUCKET_NAME,
      Key: `fonts/bundles/${font.slug}/${font.slug}-bliss-fonts.zip`,
      Body: Buffer.from(zip),
      ContentLength: zip.length,
      ContentType: "application/zip",
      ContentDisposition: `attachment; filename="${font.slug}-bliss-fonts.zip"`,
      CacheControl: "public, max-age=86400",
    }));
    uploaded++;
    console.log(`uploaded=${uploaded}/${candidates.length} slug=${font.slug} sourceMiB=${(bytes / 1048576).toFixed(1)}`);
  } catch (error) {
    failed++;
    console.error(`failed slug=${font.slug} error=${error.name || "UploadError"}`);
  }
}
console.log(`complete uploaded=${uploaded} failed=${failed}`);
if (failed) process.exitCode = 1;
