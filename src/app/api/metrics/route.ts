import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (!["font_view", "download", "ad_click"].includes(body.event) || !body.slug) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  try { await (await getDatabase()).collection("site_events").insertOne({ event: body.event, slug: String(body.slug).slice(0, 160), createdAt: new Date() }); } catch { /* Analytics must never block the user action. */ }
  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const days = Math.min(Number(new URL(request.url).searchParams.get("days") || 30), 90);
  const since = new Date(Date.now() - days * 86400000);
  const rows = await (await getDatabase()).collection("site_events").aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: "$event", count: { $sum: 1 } } }]).toArray();
  return NextResponse.json(Object.fromEntries(rows.map((row) => [row._id, row.count])));
}
