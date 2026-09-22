import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import fonts from "@/data/google-fonts.json";
import { isAdminRequest } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FontRecord = (typeof fonts)[number];

async function seedIfEmpty() {
  const db = await getDatabase();
  const collection = db.collection<FontRecord>("fonts");
  if (await collection.estimatedDocumentCount() === 0) {
    await collection.createIndex({ slug: 1 }, { unique: true });
    await collection.createIndex({ category: 1, supportsVietnamese: 1 });
    await collection.insertMany(fonts as FontRecord[], { ordered: false });
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
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 2030);
  const filter: Record<string, unknown> = {};
  if (category && category !== "ALL") filter.category = category;
  if (vietnamese) filter.supportsVietnamese = true;
  if (query) filter.$or = [{ name: { $regex: query, $options: "i" } }, { designer: { $regex: query, $options: "i" } }, { category: { $regex: query, $options: "i" } }];
  const result = await collection.find(filter).sort({ name: 1 }).limit(limit).toArray();
  return NextResponse.json({ count: result.length, total: await collection.countDocuments(), fonts: result });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const updates = Object.fromEntries(Object.entries(body).filter(([key]) => ["name", "designer", "category", "license", "supportsVietnamese", "tags", "status"].includes(key)));
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
