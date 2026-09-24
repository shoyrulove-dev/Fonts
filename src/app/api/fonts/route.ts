import { NextResponse } from "next/server";
import { getCachedPublicFonts, type CatalogFont } from "@/lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isVietnameseArchive(font: CatalogFont) {
  return font.id.startsWith("vietnamese/") || Boolean(font.sourceGroup);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() || "";
  const category = url.searchParams.get("category") || "ALL";
  const group = url.searchParams.get("group") || "ALL";
  const vietnameseOnly = url.searchParams.get("vietnamese") === "true";
  const archiveOnly = url.searchParams.get("collection") === "vietnamese";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(48, Math.max(1, Number(url.searchParams.get("limit")) || 24));

  const catalog = await getCachedPublicFonts();
  const needle = query.toLowerCase();
  const filtered = catalog.filter((font) =>
      (!needle || [font.name, font.designer, font.category, font.sourceGroup].join(" ").toLowerCase().includes(needle)) &&
      (category === "ALL" || font.category === category) &&
      (!vietnameseOnly || font.supportsVietnamese) &&
      (!archiveOnly || isVietnameseArchive(font)) &&
      (group === "ALL" || (font.sourceGroup || "Other") === group),
  );
  const start = (page - 1) * limit;
  const fonts = filtered.slice(start, start + limit).map(({ id, slug, name, designer, category: style, license, supportsVietnamese, sourceGroup }) => ({ id, slug, name, designer, category: style, license, supportsVietnamese, sourceGroup }));
  return NextResponse.json({ fonts, total: filtered.length, page, pages: Math.max(1, Math.ceil(filtered.length / limit)) }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300", "X-Bliss-Source": "cached-catalog" } });
}
