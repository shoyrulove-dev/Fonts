import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminCookieName, verifySession } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const locale = request.nextUrl.searchParams.get("lang");
  const requestHeaders = new Headers(request.headers);
  if (locale && ["en", "vi", "zh", "fr", "es"].includes(locale)) requestHeaders.set("x-bliss-locale", locale);
  const next = () => NextResponse.next({ request: { headers: requestHeaders } });
  if (pathname === "/admin/login" || pathname === "/api/admin/login") return next();
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api")) return next();
  if (await verifySession(request.cookies.get(adminCookieName)?.value)) return next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
