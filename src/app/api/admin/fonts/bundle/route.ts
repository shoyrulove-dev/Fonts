import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { zipSync, strToU8 } from "fflate";
import fonts from "@/data/google-fonts.json";
import woff2Manifest from "@/data/woff2-manifest.json";
import { getDatabase } from "@/lib/mongodb";
import { isAdminRequest } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type FontRecord = (typeof fonts)[number] & { files?: string[]; bundleKey?: string };

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { fontId } = await request.json();
  const db = await getDatabase(); const collection = db.collection<FontRecord>("fonts"); const font = await collection.findOne({ id: String(fontId || "") });
  if (!font) return NextResponse.json({ error: "Font not found" }, { status: 404 });
  const files = font.files?.length ? font.files : woff2Manifest[font.sourcePath as keyof typeof woff2Manifest] ?? [];
  if (!files.length) return NextResponse.json({ error: "Upload at least one font file first" }, { status: 400 });
  const archive: Record<string, Uint8Array> = {}; let total = 0;
  for (const file of files) { const response = await fetch(`https://assets.blissbiovn.com/${file}`, { cache: "no-store" }); if (!response.ok) return NextResponse.json({ error: `Missing asset: ${file}` }, { status: 502 }); const data = new Uint8Array(await response.arrayBuffer()); total += data.byteLength; if (total > 25 * 1024 * 1024) return NextResponse.json({ error: "Bundle exceeds 25 MB" }, { status: 413 }); archive[`fonts/${file.split("/").pop() || file}`] = data; }
  archive["README.txt"] = strToU8(`${font.name} — Bliss Fonts\n\nLicense: ${font.license}\nSource: ${font.sourceUrl || "Not specified"}\n\nReview the original license before commercial use.\n`);
  const accountId = process.env.R2_ACCOUNT_ID; const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : ""); const bucket = process.env.R2_BUCKET_NAME;
  if (!accountId || !endpoint || !bucket || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) return NextResponse.json({ error: "R2 is not configured" }, { status: 503 });
  const key = `fonts/bundles/${font.slug}/${font.slug}-bliss-fonts.zip`; const client = new S3Client({ region: "auto", endpoint, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } });
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: Buffer.from(zipSync(archive, { level: 6 })), ContentType: "application/zip", ContentDisposition: `attachment; filename="${font.slug}-bliss-fonts.zip"`, CacheControl: "public, max-age=86400" }));
  await collection.updateOne({ id: font.id }, { $set: { bundleKey: key, updatedAt: new Date() } });
  return NextResponse.json({ ok: true, key, url: `${process.env.R2_PUBLIC_URL || "https://assets.blissbiovn.com"}/${key}` });
}
