import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, boolean> = { app: true, database: false, assets: false };
  try { await (await getDatabase()).command({ ping: 1 }); checks.database = true; } catch { /* expose state without secret details */ }
  try { checks.assets = (await fetch("https://assets.blissbiovn.com", { method: "HEAD", signal: AbortSignal.timeout(5000) })).ok; } catch { /* asset host may not list its root */ }
  const healthy = checks.app && checks.database;
  return NextResponse.json({ healthy, checks, checkedAt: new Date().toISOString() }, { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
