import type { NextRequest } from "next/server";

export function isAdminRequest(request: NextRequest) {
  const expectedUser = process.env.ADMIN_USER;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const authorization = request.headers.get("authorization");
  if (!expectedUser || !expectedPassword || !authorization?.startsWith("Basic ")) return false;
  const decoded = atob(authorization.slice(6));
  const separator = decoded.indexOf(":");
  return separator >= 0 && decoded.slice(0, separator) === expectedUser && decoded.slice(separator + 1) === expectedPassword;
}
