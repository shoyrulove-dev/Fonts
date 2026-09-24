import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { isAdminRequest } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { currentPassword, newPassword } = await request.json();
  if (!newPassword || newPassword.length < 12) return NextResponse.json({ error: "New password must be at least 12 characters" }, { status: 400 });
  const db = await getDatabase();
  const collection = db.collection("admin_users");
  const username = process.env.ADMIN_USER;
  const admin = await collection.findOne({ username });
  if (!admin || !(await bcrypt.compare(currentPassword, admin.passwordHash))) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  await collection.updateOne({ username }, { $set: { passwordHash: await bcrypt.hash(newPassword, 12), updatedAt: new Date() } });
  await db.collection("admin_audit_events").insertOne({ event: "password_changed", username, createdAt: new Date() });
  return NextResponse.json({ ok: true });
}
