const cookieName = "bliss_admin_session";

function encode(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
}

async function sessionKey(usage: KeyUsage) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("Missing ADMIN_SESSION_SECRET");
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [usage]);
}

async function sign(value: string) {
  const key = await sessionKey("sign");
  return encode(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)))));
}

async function signatureIsValid(value: string, signature: string) {
  const key = await sessionKey("verify");
  const bytes = Uint8Array.from(decode(signature), (character) => character.charCodeAt(0));
  return crypto.subtle.verify("HMAC", key, bytes, new TextEncoder().encode(value));
}

export async function createSession(user: string) {
  const payload = encode(JSON.stringify({ user, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 }));
  return payload + "." + await sign(payload);
}

export async function verifySession(token: string | undefined) {
  if (!token) return null;
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature || !(await signatureIsValid(payload, signature))) return null;
    const data = JSON.parse(decode(payload));
    return typeof data.exp === "number" && data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

export const adminCookieName = cookieName;
