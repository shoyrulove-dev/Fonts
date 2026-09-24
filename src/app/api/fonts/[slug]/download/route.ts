import { NextResponse } from "next/server";
import { zipSync, strToU8 } from "fflate";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import woff2Manifest from "@/data/woff2-manifest.json";
import { allFonts, getPublicFontBySlug } from "@/lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DownloadAsset = { url: string; name: string; key?: string };
const staticFonts = new Map(allFonts.map((font) => [font.slug, font]));

async function resolveFont(slug: string, request: Request) {
  return request.headers.get("x-bliss-verification") === "1"
    ? staticFonts.get(slug) || null
    : getPublicFontBySlug(slug);
}

async function recordDownloadError(slug: string, message: string) {
  try { await (await import("@/lib/mongodb")).getDatabase().then((db) => db.collection("system_events").insertOne({ level: "error", type: "download", slug, message, createdAt: new Date() })); } catch { /* Monitoring must not affect downloads. */ }
}

async function recordDownload(slug: string, countAsVisitor = true) {
  try {
    const db = await (await import("@/lib/mongodb")).getDatabase();
    const updates: Promise<unknown>[] = [
      db.collection("system_events").updateMany({ type: "download", slug, level: "error", resolvedAt: { $exists: false } }, { $set: { resolvedAt: new Date() } }),
    ];
    if (countAsVisitor) updates.push(db.collection("site_events").insertOne({ event: "download", slug, createdAt: new Date() }));
    await Promise.all(updates);
  } catch { /* Analytics must never block downloads. */ }
}

async function savePackage(slug: string, zip: Uint8Array) {
  try {
    const accountId = process.env.R2_ACCOUNT_ID;
    const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
    const bucket = process.env.R2_BUCKET_NAME;
    if (!endpoint || !bucket || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) return;
    const client = new S3Client({ region: "auto", endpoint, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } });
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: `fonts/bundles/${slug}/${slug}-bliss-fonts.zip`, Body: Buffer.from(zip), ContentType: "application/zip", ContentDisposition: `attachment; filename="${slug}-bliss-fonts.zip"`, CacheControl: "public, max-age=86400" }));
  } catch { /* The generated ZIP is still returned even when it cannot be saved for later. */ }
}

async function googleFontAssets(font: { name: string }): Promise<DownloadAsset[]> {
  const family = encodeURIComponent(font.name).replace(/%20/g, "+");
  const response = await fetch(`https://fonts.googleapis.com/css2?family=${family}&display=swap`, {
    headers: { "User-Agent": "Mozilla/5.0" },
    cache: "no-store",
  });
  if (!response.ok) return [];
  const css = await response.text();
  const urls = [...css.matchAll(/url\\(([^)]+)\\)/g)].map((match) => match[1].replace(/["']/g, "")).filter(Boolean);
  return [...new Set(urls)].map((url, index) => ({
    url,
    name: decodeURIComponent(new URL(url).pathname.split("/").pop() || `${font.name}-${index + 1}.woff2`),
  }));
}

async function archiveAssets(assets: DownloadAsset[]) {
  const archive: Record<string, Uint8Array> = {};
  let totalBytes = 0;
  for (const asset of assets) {
    const response = await fetch(asset.url, {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return null;
    const data = new Uint8Array(await response.arrayBuffer());
    totalBytes += data.byteLength;
    if (totalBytes > 25 * 1024 * 1024) return null;
    archive[`fonts/${asset.name}`] = data;
  }
  return archive;
}

async function assetExists(url: string) {
  try {
    const response = await fetch(url, { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(12_000) });
    await response.body?.cancel();
    return response.ok;
  } catch {
    return false;
  }
}

export async function HEAD(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const font = await resolveFont(slug, request);
  if (!font) return new NextResponse(null, { status: 404 });
  const cachedKey = `fonts/bundles/${font.slug}/${font.slug}-bliss-fonts.zip`;
  if (await assetExists(`https://assets.blissbiovn.com/${cachedKey}`)) return new NextResponse(null, { status: 204, headers: { "X-Bliss-Asset": "cached-package" } });
  if (font.bundleKey && await assetExists(`https://assets.blissbiovn.com/${font.bundleKey}`)) return new NextResponse(null, { status: 204, headers: { "X-Bliss-Asset": "source-package" } });
  const files = font.files?.length ? font.files : woff2Manifest[font.sourcePath as keyof typeof woff2Manifest] ?? [];
  if (files.length) {
    const ready = await Promise.all(files.map((file) => assetExists(`https://assets.blissbiovn.com/${file}`)));
    if (ready.every(Boolean)) return new NextResponse(null, { status: 204, headers: { "X-Bliss-Asset": "font-files", "X-Bliss-Files": String(files.length) } });
  }
  const googleAssets = await googleFontAssets(font);
  if (googleAssets.length && (await Promise.all(googleAssets.map((asset) => assetExists(asset.url)))).every(Boolean)) return new NextResponse(null, { status: 204, headers: { "X-Bliss-Asset": "google-fonts", "X-Bliss-Files": String(googleAssets.length) } });
  await recordDownloadError(slug, "No downloadable asset could be resolved");
  return new NextResponse(null, { status: 502 });
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const countAsVisitor = request.headers.get("x-bliss-verification") !== "1";
  const font = await resolveFont(slug, request);
  if (!font) return NextResponse.json({ error: "Font not found" }, { status: 404 });

  const cachedKey = `fonts/bundles/${font.slug}/${font.slug}-bliss-fonts.zip`;
  try {
    const cached = await fetch(`https://assets.blissbiovn.com/${cachedKey}`, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
    await cached.body?.cancel();
    if (cached.ok) { await recordDownload(slug, countAsVisitor); return NextResponse.redirect(`https://assets.blissbiovn.com/${cachedKey}`, 302); }
  } catch { /* Build a fresh package below. */ }

  if (font.bundleKey) {
    try {
      const bundled = await fetch(`https://assets.blissbiovn.com/${font.bundleKey}`, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
      await bundled.body?.cancel();
      if (bundled.ok) { await recordDownload(slug, countAsVisitor); return NextResponse.redirect(`https://assets.blissbiovn.com/${font.bundleKey}`, 302); }
    } catch { /* Fall back to the source files below. */ }
  }
  const files = font.files?.length ? font.files : woff2Manifest[font.sourcePath as keyof typeof woff2Manifest] ?? [];
  let assets: DownloadAsset[] = files.length
    ? files.map((file) => ({ key: file, url: `https://assets.blissbiovn.com/${file}`, name: file.split("/").pop() ?? file }))
    : [];
  let archive = assets.length ? await archiveAssets(assets) : null;
  if (!archive) {
    assets = await googleFontAssets(font);
    archive = assets.length ? await archiveAssets(assets) : null;
  }
  if (!assets.length) { await recordDownloadError(slug, "No downloadable asset could be resolved"); return NextResponse.json({ error: "This font is temporarily unavailable" }, { status: 502 }); }
  if (!archive) { await recordDownloadError(slug, "Resolved assets could not be archived"); return NextResponse.json({ error: "This font is temporarily unavailable" }, { status: 502 }); }

  await recordDownload(slug, countAsVisitor);

  const readme = [
    `${font.name} - Bliss Fonts`,
    "",
    `Designer: ${font.designer || "Not specified"}`,
    `License: ${font.license}`,
    `Vietnamese support: ${font.supportsVietnamese ? "Confirmed" : "Not confirmed"}`,
    `Official source: ${font.sourceUrl || "Not specified"}`,
    "",
    "Please review the original license before using this font in commercial work.",
    "Downloaded from https://fonts.blissbiovn.com",
  ].join("\n");
  archive["README.txt"] = strToU8(readme);

  const zip = zipSync(archive, { level: 6 });
  void savePackage(font.slug, zip);
  const filename = `${font.slug}-bliss-fonts.zip`;
  return new NextResponse(Buffer.from(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
