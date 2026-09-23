import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import fonts from "@/data/google-fonts.json";
import vietnameseFonts from "@/data/vietnamese-fonts.json";
import type { CatalogFont } from "@/lib/catalog";
import { isAdminRequest } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FontRecord = CatalogFont;

async function seedIfEmpty() {
  const db = await getDatabase();
  const collection = db.collection<FontRecord>("fonts");
  const catalog = [...fonts, ...vietnameseFonts] as FontRecord[];
  if (await collection.estimatedDocumentCount() === 0) {
    await collection.createIndex({ slug: 1 }, { unique: true });
    await collection.createIndex({ category: 1, supportsVietnamese: 1 });
    await collection.insertMany(catalog, { ordered: false });
  }
  return collection;
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const collection = await seedIfEmpty();
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim();
  const category = url.searchParams.get("category");
  const vietnamese = url.searchParams.get("vietnamese") === "true";
  const archiveOnly = url.searchParams.get("collection") === "vietnamese";
  const group = url.searchParams.get("group") || "ALL";
  const hasAssets = url.searchParams.get("hasAssets") === "true";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 30), 1), 100);
  const clauses: Record<string, unknown>[] = [];
  if (category && category !== "ALL") clauses.push({ category });
  if (vietnamese) clauses.push({ supportsVietnamese: true });
  if (archiveOnly) clauses.push({ $or: [{ id: /^vietnamese\// }, { sourceGroup: { $exists: true, $nin: [""] } }] });
  if (group !== "ALL") clauses.push({ sourceGroup: group });
  if (hasAssets) clauses.push({ $or: [{ sourcePath: { $exists: true, $nin: [null, ""] } }, { files: { $exists: true, $ne: [] } }, { bundleKey: { $exists: true, $nin: [null, ""] } }] });
  if (query) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = { $regex: escaped, $options: "i" };
    clauses.push({ $or: [{ name: pattern }, { designer: pattern }, { category: pattern }, { sourceGroup: pattern }] });
  }
  const filter = clauses.length ? { $and: clauses } : {};
  const archiveFilter = { $or: [{ id: /^vietnamese\// }, { sourceGroup: { $exists: true, $nin: [""] } }] };
  const compatibleFilter = { supportsVietnamese: true, $nor: [archiveFilter] };
  const [result, filteredTotal, total, published, hidden, archive, compatible, personalUse] = await Promise.all([
    collection.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).toArray(),
    collection.countDocuments(filter),
    collection.countDocuments(),
    collection.countDocuments({ status: { $nin: ["draft", "archived"] } }),
    collection.countDocuments({ status: { $in: ["draft", "archived"] } }),
    collection.countDocuments(archiveFilter),
    collection.countDocuments(compatibleFilter),
    collection.countDocuments({ ...archiveFilter, license: "Personal Use" }),
  ]);
  return NextResponse.json({ count: result.length, total: filteredTotal, page, pages: Math.max(1, Math.ceil(filteredTotal / limit)), fonts: result, summary: { total, published, hidden, archive, international: Math.max(total - archive, 0), compatible, personalUse } });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const updates = Object.fromEntries(Object.entries(body).filter(([key]) => ["name", "designer", "category", "license", "supportsVietnamese", "tags", "status"].includes(key)));
  if (updates.status && !["draft", "published", "archived"].includes(String(updates.status))) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const collection = await seedIfEmpty();
  const result = await collection.updateOne({ id: body.id }, { $set: { ...updates, updatedAt: new Date() } });
  if (!result.matchedCount) return NextResponse.json({ error: "Font not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body.name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  const slug = String(body.slug || body.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const collection = await seedIfEmpty();
  const record = { id: "manual/" + slug, slug, name: body.name, designer: body.designer || "", category: body.category || "DISPLAY", license: body.license || "Pending review", subsets: [], supportsVietnamese: Boolean(body.supportsVietnamese), sourcePath: "manual/" + slug, sourceUrl: body.sourceUrl || "", status: "draft", tags: Array.isArray(body.tags) ? body.tags : [] };
  try { await collection.insertOne(record as FontRecord); } catch { return NextResponse.json({ error: "A font with this slug already exists" }, { status: 409 }); }
  return NextResponse.json({ ok: true, font: record }, { status: 201 });
}
