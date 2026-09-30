import { headers } from "next/headers";
import { resolveLocale } from "@/lib/i18n";
export async function getRequestLocale() { const h = await headers(); return resolveLocale(h.get("x-bliss-locale") || h.get("x-vercel-ip-country"), h.get("accept-language"), h.get("cookie")); }
