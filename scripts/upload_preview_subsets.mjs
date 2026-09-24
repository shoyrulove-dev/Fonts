import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const loadEnv = (text) => Object.fromEntries(text.split(/\r?\n/).flatMap((line) => { const match = line.match(/^([A-Z0-9_]+)="?([^"]*)"?$/); return match ? [[match[1], match[2]]] : []; }));
const env = { ...loadEnv(await readFile(path.join(root, ".env.r2.local"), "utf8")), ...process.env };
for (const key of ["R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "R2_ENDPOINT"]) if (!env[key]) throw new Error(`Missing ${key}`);
const report = JSON.parse(await readFile(path.join(root, "manifests", "preview-subsets.json"), "utf8"));
const client = new S3Client({ region: "auto", endpoint: env.R2_ENDPOINT, credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY } });
const queue = [...report.created];
let uploaded = 0;
let failed = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (queue.length) {
    const item = queue.shift();
    const file = path.join(root, "converted", "woff2", item.target);
    try {
      const info = await stat(file);
      await client.send(new PutObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: `fonts/${item.target}`, Body: createReadStream(file), ContentLength: info.size, ContentType: "font/woff2", CacheControl: "public, max-age=31536000, immutable" }));
      uploaded += 1;
      if (uploaded % 20 === 0 || uploaded === report.created.length) console.log(`uploaded=${uploaded}/${report.created.length} failed=${failed}`);
    } catch (error) { failed += 1; console.error(`failed=${item.slug} error=${error.name || "UploadError"}`); }
  }
}));
console.log(`complete uploaded=${uploaded} failed=${failed}`);
if (failed) process.exitCode = 1;
