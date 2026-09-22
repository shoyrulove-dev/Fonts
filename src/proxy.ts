import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminCookieName, verifySession } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname === "/admin/login" || pathname === "/api/admin/login") return NextResponse.next();
  if (await verifySession(request.cookies.get(adminCookieName)?.value)) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = { matcher: ["/admin/:path*"] };
