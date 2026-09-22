import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createReadStream } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "converted", "woff2");
const envPath = path.join(root, ".env.r2.local");

function loadEnv(text) {
  return Object.fromEntries(text.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^([A-Z0-9_]+)="?([^"]*)"?$/);
    return match ? [[match[1], match[2]]] : [];
  }));
}

const env = { ...loadEnv(await readFile(envPath, "utf8")), ...process.env };
const required = ["R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "R2_ENDPOINT"];
for (const key of required) if (!env[key]) throw new Error("Missing " + key + " in .env.r2.local");

const client = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(fullPath));
    else if (entry.name.toLowerCase().endsWith(".woff2")) files.push(fullPath);
  }
  return files;
}

const files = await filesIn(sourceRoot);
let completed = 0;
let failed = 0;
const queue = [...files];
const worker = async () => {
  while (queue.length) {
    const file = queue.shift();
    const key = path.relative(sourceRoot, file).split(path.sep).join("/");
    try {
      const info = await stat(file);
      await client.send(new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: "fonts/" + key,
        Body: createReadStream(file),
        ContentType: "font/woff2",
        ContentLength: info.size,
        CacheControl: "public, max-age=31536000, immutable",
      }));
      completed++;
      if (completed % 25 === 0 || completed === files.length) console.log("uploaded=" + completed + "/" + files.length + " failed=" + failed);
    } catch (error) {
      failed++;
      console.error("failed=" + key + " error=" + (error.name ?? "UploadError"));
    }
  }
};

await Promise.all(Array.from({ length: 8 }, worker));
if (failed) process.exitCode = 1;
console.log("complete uploaded=" + completed + " failed=" + failed);
