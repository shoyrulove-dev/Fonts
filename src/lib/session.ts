const cookieName = "bliss_admin_session";

function encode(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decode(value: string) {
  return atob(value.replace(/-/g, "+").replace(/_/g, "/"));
}

async function sign(value: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("Missing ADMIN_SESSION_SECRET");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return encode(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)))));
}

export async function createSession(user: string) {
  const payload = encode(JSON.stringify({ user, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 }));
  return payload + "." + await sign(payload);
}

export async function verifySession(token: string | undefined) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || signature !== await sign(payload)) return null;
  const data = JSON.parse(decode(payload));
  return data.exp > Date.now() ? data : null;
}

export const adminCookieName = cookieName;
