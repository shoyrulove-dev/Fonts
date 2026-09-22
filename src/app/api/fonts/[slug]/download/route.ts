import { NextResponse } from "next/server";
import { zipSync, strToU8 } from "fflate";
import fonts from "@/data/google-fonts.json";
import woff2Manifest from "@/data/woff2-manifest.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const font = fonts.find((item) => item.slug === slug);
  if (!font) return NextResponse.json({ error: "Font not found" }, { status: 404 });

  const files = woff2Manifest[font.sourcePath as keyof typeof woff2Manifest] ?? [];
  if (!files.length) return NextResponse.json({ error: "No webfont files available" }, { status: 404 });

  const archive: Record<string, Uint8Array> = {};
  for (const file of files) {
    const response = await fetch(`https://assets.blissbiovn.com/${file}`, { cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: "A font asset could not be downloaded" }, { status: 502 });
    const filename = file.split("/").pop() ?? file;
    archive[`fonts/${filename}`] = new Uint8Array(await response.arrayBuffer());
  }

  const readme = [
    `${font.name} — Bliss Fonts`,
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
  const filename = `${font.slug}-bliss-fonts.zip`;
  return new NextResponse(Buffer.from(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
