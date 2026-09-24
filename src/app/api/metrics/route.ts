import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (!["font_view", "download", "ad_click", "ad_impression"].includes(body.event) || !body.slug) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  try { await (await getDatabase()).collection("site_events").insertOne({ event: body.event, slug: String(body.slug).slice(0, 160), createdAt: new Date() }); } catch { /* Analytics must never block the user action. */ }
  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const days = Math.min(Number(new URL(request.url).searchParams.get("days") || 30), 90);
  const since = new Date(Date.now() - days * 86400000);
  const events = (await getDatabase()).collection("site_events");
  const [rows, topDownloads, dailyDownloads, dailyViews, recentErrors] = await Promise.all([
    events.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: "$event", count: { $sum: 1 } } }]).toArray(),
    events.aggregate([{ $match: { event: "download", createdAt: { $gte: since } } }, { $group: { _id: "$slug", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]).toArray(),
    events.aggregate([{ $match: { event: "download", createdAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]).toArray(),
    events.aggregate([{ $match: { event: "font_view", createdAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]).toArray(),
    (await getDatabase()).collection("system_events").aggregate([
      { $match: { createdAt: { $gte: since }, level: "error", resolvedAt: { $exists: false } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$slug", slug: { $first: "$slug" }, message: { $first: "$message" }, createdAt: { $first: "$createdAt" } } },
      { $limit: 10 },
    ]).toArray(),
  ]);
  const checkedErrors = await Promise.all(recentErrors.map(async (item) => {
    const slug = String(item.slug || "");
    if (!slug) return { item, resolved: false };
    try {
      const response = await fetch(`https://assets.blissbiovn.com/fonts/bundles/${slug}/${slug}-bliss-fonts.zip`, { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(4000) });
      return { item, resolved: response.ok };
    } catch { return { item, resolved: false }; }
  }));
  const resolvedSlugs = checkedErrors.filter((entry) => entry.resolved).map((entry) => String(entry.item.slug));
  if (resolvedSlugs.length) await (await getDatabase()).collection("system_events").updateMany({ type: "download", slug: { $in: resolvedSlugs }, level: "error", resolvedAt: { $exists: false } }, { $set: { resolvedAt: new Date() } });
  const activeErrors = checkedErrors.filter((entry) => !entry.resolved).map((entry) => entry.item);
  return NextResponse.json({ ...Object.fromEntries(rows.map((row) => [row._id, row.count])), topDownloads, dailyDownloads, dailyViews, recentErrors: activeErrors });
}
