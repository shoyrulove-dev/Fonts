import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import assets from "@/data/woff2-manifest.json";
import { allFonts } from "@/lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, boolean> = { app: true, database: false, assets: false };
  let databaseFamilies = 0;
  const catalogAssets = allFonts.map((font) => assets[font.sourcePath as keyof typeof assets] ?? []);
  const assetKeys = catalogAssets.flat();
  try { const db = await getDatabase(); await db.command({ ping: 1 }); databaseFamilies = await db.collection("fonts").countDocuments(); checks.database = true; } catch { /* expose state without secret details */ }
  try { checks.assets = Boolean(assetKeys[0]) && (await fetch(`https://assets.blissbiovn.com/${assetKeys[0]}`, { method: "HEAD", signal: AbortSignal.timeout(5000) })).ok; } catch { /* health reports the unavailable dependency */ }
  const healthy = checks.app && checks.database;
  const assetFiles = assetKeys.length;
  return NextResponse.json({ healthy, checks, catalog: { databaseFamilies, assetFamilies: catalogAssets.filter((files) => files.length > 0).length, assetFiles }, checkedAt: new Date().toISOString() }, { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
