import { NextResponse } from "next/server";
import { allFonts, getPublicFonts, type CatalogFont } from "@/lib/catalog";
import { getDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fields = {
  _id: 0,
  id: 1,
  slug: 1,
  name: 1,
  designer: 1,
  category: 1,
  license: 1,
  supportsVietnamese: 1,
  sourceGroup: 1,
} as const;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

  try {
    if (!process.env.MONGODB_URI) throw new Error("Static catalog");
    const clauses: Record<string, unknown>[] = [{ status: { $nin: ["draft", "archived"] } }];
    if (category !== "ALL") clauses.push({ category });
    if (vietnameseOnly) clauses.push({ supportsVietnamese: true });
    if (archiveOnly) clauses.push({ $or: [{ id: /^vietnamese\// }, { sourceGroup: { $exists: true, $nin: [""] } }] });
    if (group !== "ALL") clauses.push({ sourceGroup: group });
    if (query) {
      const pattern = { $regex: escapeRegex(query), $options: "i" };
      clauses.push({ $or: [{ name: pattern }, { designer: pattern }, { category: pattern }, { sourceGroup: pattern }] });
    }
    const filter = clauses.length === 1 ? clauses[0] : { $and: clauses };
    const collection = (await getDatabase()).collection<CatalogFont>("fonts");
    const [fonts, total] = await Promise.all([
      collection.find(filter, { projection: fields }).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).toArray(),
      collection.countDocuments(filter),
    ]);
    return NextResponse.json({ fonts, total, page, pages: Math.max(1, Math.ceil(total / limit)) }, { headers: { "X-Bliss-Source": "database" } });
  } catch (error) {
    console.error("Public font query fell back to the merged catalog", error);
    const fallbackFonts = process.env.MONGODB_URI ? await getPublicFonts() : allFonts;
    const needle = query.toLowerCase();
    const filtered = fallbackFonts.filter((font) =>
      (!needle || [font.name, font.designer, font.category, font.sourceGroup].join(" ").toLowerCase().includes(needle)) &&
      (category === "ALL" || font.category === category) &&
      (!vietnameseOnly || font.supportsVietnamese) &&
      (!archiveOnly || isVietnameseArchive(font)) &&
      (group === "ALL" || (font.sourceGroup || "Other") === group),
    );
    const start = (page - 1) * limit;
    const fonts = filtered.slice(start, start + limit).map(({ id, slug, name, designer, category: style, license, supportsVietnamese, sourceGroup }) => ({ id, slug, name, designer, category: style, license, supportsVietnamese, sourceGroup }));
    return NextResponse.json({ fonts, total: filtered.length, page, pages: Math.max(1, Math.ceil(filtered.length / limit)) }, { headers: { "X-Bliss-Source": "merged-fallback" } });
  }
}
