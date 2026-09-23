import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-admin-recovery-token");
  if (!token || token !== process.env.ADMIN_RECOVERY_TOKEN) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { password } = await request.json().catch(() => ({}));
  if (typeof password !== "string" || password.length < 12) return NextResponse.json({ error: "Use a password with at least 12 characters" }, { status: 400 });
  await (await getDatabase()).collection("admin_users").updateOne(
    { username: "admin" },
    { $set: { passwordHash: await bcrypt.hash(password, 12), updatedAt: new Date(), role: "owner" }, $setOnInsert: { username: "admin", createdAt: new Date() } },
    { upsert: true },
  );
  return NextResponse.json({ ok: true });
}
