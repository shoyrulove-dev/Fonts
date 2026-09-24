import type { NextRequest } from "next/server";
import { adminCookieName, verifySession } from "@/lib/session";

export async function isAdminRequest(request: NextRequest) {
  return Boolean(await verifySession(request.cookies.get(adminCookieName)?.value));
}
