import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import fonts from "@/data/google-fonts.json";
import { isAdminRequest } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type FontRecord = (typeof fonts)[number];

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const rows = Array.isArray(body) ? body : body.fonts;
  if (!Array.isArray(rows) || rows.length === 0) return NextResponse.json({ error: "Provide a non-empty fonts array" }, { status: 400 });
  if (rows.length > 500) return NextResponse.json({ error: "Import is limited to 500 records per request" }, { status: 413 });
  const records = rows.filter((row) => row && String(row.name || "").trim()).map((row) => {
    const name = String(row.name).trim();
    const slug = String(row.slug || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return { id: String(row.id || `manual/${slug}`), slug, name, designer: String(row.designer || ""), category: String(row.category || "DISPLAY"), license: String(row.license || "Pending review"), subsets: Array.isArray(row.subsets) ? row.subsets : [], supportsVietnamese: Boolean(row.supportsVietnamese), sourcePath: String(row.sourcePath || `manual/${slug}`), sourceUrl: String(row.sourceUrl || ""), tags: Array.isArray(row.tags) ? row.tags.map(String) : [], status: row.status === "published" ? "published" : "draft", ...(Array.isArray(row.files) ? { files: row.files.map(String) } : {}) } as FontRecord;
  });
  if (!records.length) return NextResponse.json({ error: "No valid records found" }, { status: 400 });
  const collection = (await getDatabase()).collection<FontRecord>("fonts");
  await collection.createIndex({ id: 1 }, { unique: true });
  try {
    const result = await collection.insertMany(records, { ordered: false });
    return NextResponse.json({ ok: true, inserted: result.insertedCount, skipped: 0, received: records.length }, { status: 201 });
  } catch (error) {
    const result = (error as { result?: { insertedCount?: number } }).result;
    const inserted = result?.insertedCount || 0;
    return NextResponse.json({ ok: inserted > 0, inserted, skipped: records.length - inserted, received: records.length, message: "Duplicate IDs were skipped." }, { status: inserted > 0 ? 207 : 409 });
  }
}
