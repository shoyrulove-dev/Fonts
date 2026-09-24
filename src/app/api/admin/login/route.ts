import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { adminCookieName, createSession } from "@/lib/session";

export const runtime = "nodejs";
type AdminUser = { username: string; passwordHash: string; createdAt: Date; role: string };
type LoginAttempt = { key: string; failures: number; firstAttemptAt: Date; blockedUntil?: Date; expiresAt: Date };

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

function requestFingerprint(request: NextRequest, username: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return createHash("sha256").update(`${forwarded}:${username.toLowerCase()}`).digest("hex");
}

async function recordAudit(db: Awaited<ReturnType<typeof getDatabase>>, event: string, username: string, key: string) {
  await db.collection("admin_audit_events").insertOne({ event, username, fingerprint: key, createdAt: new Date() });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!username || !password) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  const db = await getDatabase();
  const attempts = db.collection<LoginAttempt>("admin_login_attempts");
  await attempts.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "expire_login_attempts" });
  const key = requestFingerprint(request, username);
  const now = new Date();
  const attempt = await attempts.findOne({ key });
  if (attempt?.blockedUntil && attempt.blockedUntil > now) {
    const retryAfter = Math.max(1, Math.ceil((attempt.blockedUntil.getTime() - now.getTime()) / 1000));
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
  }
  const collection = db.collection<AdminUser>("admin_users");
  const existing = await collection.findOne({ username });
  let admin: AdminUser | null = existing;
  if (!existing && username === process.env.ADMIN_USER && process.env.ADMIN_PASSWORD) {
    admin = { username, passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12), createdAt: new Date(), role: "owner" };
    await collection.insertOne(admin);
  }
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    const insideWindow = Boolean(attempt && now.getTime() - attempt.firstAttemptAt.getTime() < WINDOW_MS);
    const failures = insideWindow ? (attempt?.failures || 0) + 1 : 1;
    const blockedUntil = failures >= MAX_FAILURES ? new Date(now.getTime() + WINDOW_MS) : undefined;
    await attempts.updateOne(
      { key },
      { $set: { key, failures, firstAttemptAt: insideWindow ? attempt!.firstAttemptAt : now, blockedUntil, expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) } },
      { upsert: true },
    );
    await recordAudit(db, "login_failed", username, key);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  await attempts.deleteOne({ key });
  await recordAudit(db, "login_success", username, key);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName, await createSession(username), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return response;
}
