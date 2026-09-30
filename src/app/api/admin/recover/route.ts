import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const expected = process.env.ADMIN_RESET_TOKEN;
  const supplied = request.headers.get("x-admin-reset-token");
  if (!expected || !supplied || supplied !== expected) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < 12) return NextResponse.json({ error: "Password must be at least 12 characters" }, { status: 400 });
  const username = process.env.ADMIN_USER || "admin";
  const db = await getDatabase();
  const result = await db.collection("admin_users").updateOne(
    { username },
    { $set: { passwordHash: await bcrypt.hash(password, 12), updatedAt: new Date() }, $setOnInsert: { username, createdAt: new Date(), role: "owner" } },
    { upsert: true },
  );
  await db.collection("admin_login_attempts").deleteMany({});
  return NextResponse.json({ ok: true, matched: result.matchedCount, created: result.upsertedCount });
}
