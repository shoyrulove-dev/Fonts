import { readFileSync, writeFileSync } from "node:fs";

const handler = new URL("../.open-next/middleware/handler.mjs", import.meta.url);
const code = readFileSync(handler, "utf8");

// Work around OpenNext's Node middleware cookie import after bundling.
// Keep the cookie header intact: the proxy uses it to verify admin sessions.
const broken = /\b([\w$]*import_cookie[\w$]*)\.default\.parse\(cookieHeader\)/g;
const matches = [...code.matchAll(broken)];
if (matches.length !== 1) {
  throw new Error(`Expected one OpenNext cookie converter to patch, found ${matches.length}; review the generated middleware before deploying.`);
}
writeFileSync(handler, code.replace(broken, "($1.default??$1).parse(cookieHeader)"));
console.log("Patched the OpenNext middleware cookie parser.");
