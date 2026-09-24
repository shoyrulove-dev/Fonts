import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import previewManifest from "@/data/woff2-manifest.json";
import { isAdminRequest } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await getDatabase();
  const collection = db.collection("fonts");
  const hidden = await collection.find(
    { status: { $in: ["draft", "archived"] } },
    { projection: { id: 1, slug: 1, status: 1, sourcePath: 1, files: 1, bundleKey: 1 } },
  ).toArray();
  const manifest = previewManifest as Record<string, string[]>;
  const readyIds = hidden.filter((font) => font.status === "draft" && Boolean(
    (font.sourcePath && manifest[String(font.sourcePath)]?.length)
    || (Array.isArray(font.files) && font.files.length)
    || font.bundleKey,
  )).map((font) => font.id).filter(Boolean);
  const result = readyIds.length
    ? await collection.updateMany({ id: { $in: readyIds } }, { $set: { status: "published", updatedAt: new Date() } })
    : { modifiedCount: 0 };
  await db.collection("admin_audit_events").insertOne({ event: "ready_fonts_published", count: result.modifiedCount, createdAt: new Date() });
  revalidatePath("/", "layout");
  return NextResponse.json({ reviewed: hidden.length, published: result.modifiedCount, remaining: hidden.length - result.modifiedCount });
}
