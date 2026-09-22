import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const expectedUser = process.env.ADMIN_USER;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPassword) return new NextResponse("Admin access is not configured.", { status: 503 });

  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Basic ")) {
    const decoded = atob(authorization.slice(6));
    const separator = decoded.indexOf(":");
    const user = separator >= 0 ? decoded.slice(0, separator) : "";
    const password = separator >= 0 ? decoded.slice(separator + 1) : "";
    if (user === expectedUser && password === expectedPassword) return NextResponse.next();
  }

  return new NextResponse("Authentication required.", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Bliss Fonts Admin"' } });
}

export const config = { matcher: ["/admin/:path*"] };
