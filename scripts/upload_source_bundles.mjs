import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { strToU8, zipSync } from "fflate";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(await readFile(path.join(root, "src/data/google-fonts.json"), "utf8"));
const localEnv = Object.fromEntries((await readFile(path.join(root, ".env.r2.local"), "utf8")).split(/\r?\n/).flatMap((line) => {
  const match = line.match(/^([A-Z0-9_]+)="?([^"]*)"?$/);
  return match ? [[match[1], match[2]]] : [];
}));
const config = { ...localEnv, ...process.env };
const client = new S3Client({ region: "auto", endpoint: config.R2_ENDPOINT, credentials: { accessKeyId: config.R2_ACCESS_KEY_ID, secretAccessKey: config.R2_SECRET_ACCESS_KEY } });
const requested = process.argv.slice(2);
if (!requested.length) throw new Error("Pass one or more font slugs.");

for (const slug of requested) {
  const font = catalog.find((item) => item.slug === slug);
  if (!font) throw new Error(`Unknown font slug: ${slug}`);
  const directory = path.join(root, font.sourcePath);
  const names = (await readdir(directory)).filter((name) => /\.(ttf|otf|woff2?)$/i.test(name));
  if (!names.length) throw new Error(`No source font files found for ${slug}`);
  const archive = {};
  for (const name of names) archive[`fonts/${name}`] = new Uint8Array(await readFile(path.join(directory, name)));
  archive["README.txt"] = strToU8([`${font.name} - Bliss Fonts`, "", `Designer: ${font.designer || "Not specified"}`, `License: ${font.license}`, `Official source: ${font.sourceUrl}`, "", "Review the original license before commercial use."].join("\n"));
  const zip = zipSync(archive, { level: 0 });
  const key = `fonts/bundles/${slug}/${slug}-bliss-fonts.zip`;
  await client.send(new PutObjectCommand({ Bucket: config.R2_BUCKET_NAME, Key: key, Body: Buffer.from(zip), ContentLength: zip.length, ContentType: "application/zip", ContentDisposition: `attachment; filename="${slug}-bliss-fonts.zip"`, CacheControl: "public, max-age=86400" }));
  console.log(`uploaded slug=${slug} files=${names.length} bytes=${zip.length}`);
}
