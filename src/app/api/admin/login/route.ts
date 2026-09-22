import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { adminCookieName, createSession } from "@/lib/session";

export const runtime = "nodejs";
type AdminUser = { username: string; passwordHash: string; createdAt: Date; role: string };

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();
  const db = await getDatabase();
  const collection = db.collection<AdminUser>("admin_users");
  const existing = await collection.findOne({ username });
  let admin: AdminUser | null = existing;
  if (!existing && username === process.env.ADMIN_USER && process.env.ADMIN_PASSWORD) {
    admin = { username, passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12), createdAt: new Date(), role: "owner" };
    await collection.insertOne(admin);
  }
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName, await createSession(username), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return response;
}
