import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import fonts from "@/data/google-fonts.json";
import { isAdminRequest } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FontRecord = (typeof fonts)[number] & { files?: string[] };

function contentType(name: string) {
  const extension = name.toLowerCase().split(".").pop();
  return extension === "woff2" ? "font/woff2" : extension === "woff" ? "font/woff" : extension === "otf" ? "font/otf" : "font/ttf";
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const formData = await request.formData();
  const id = String(formData.get("fontId") || "");
  const file = formData.get("file");
  if (!id || !(file instanceof File)) return NextResponse.json({ error: "fontId and file are required" }, { status: 400 });
  if (!/\.(woff2?|ttf|otf)$/i.test(file.name)) return NextResponse.json({ error: "Only WOFF, WOFF2, TTF and OTF files are supported" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Font file must be smaller than 10 MB" }, { status: 413 });

  const accountId = process.env.R2_ACCOUNT_ID;
  const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  const bucket = process.env.R2_BUCKET_NAME;
  if (!accountId || !endpoint || !bucket || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) return NextResponse.json({ error: "R2 is not configured" }, { status: 503 });

  const collection = (await getDatabase()).collection<FontRecord>("fonts");
  const font = await collection.findOne({ id });
  if (!font) return NextResponse.json({ error: "Font not found" }, { status: 404 });
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  const key = `fonts/manual/${font.slug}/${safeName}`;
  const client = new S3Client({ region: "auto", endpoint, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } });
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: Buffer.from(await file.arrayBuffer()), ContentType: contentType(file.name), CacheControl: "public, max-age=31536000, immutable" }));
  await collection.updateOne({ id }, { $addToSet: { files: key }, $unset: { bundleKey: "" }, $set: { updatedAt: new Date() } });
  return NextResponse.json({ ok: true, key, publicUrl: `${process.env.R2_PUBLIC_URL || "https://assets.blissbiovn.com"}/${key}` });
}
