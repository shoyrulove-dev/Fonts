import { mongoRequestScope } from "./mongo-request-scope.mjs";

export function usesPublicFontEdgeCache() {
  return Boolean(mongoRequestScope.getStore()?.publicCacheOrigin && process.env.MONGODB_URI);
}

export async function cachedPublicFontData<T>(key: string, load: () => Promise<T>): Promise<T> {
  const scope = mongoRequestScope.getStore();
  if (!scope?.publicCacheOrigin || key.length > 256) return load();

  // A named cache stores data only, not public HTTP responses or admin pages.
  const request = new Request(new URL("/.fonts-public-cache/v1/" + encodeURIComponent(key), scope.publicCacheOrigin));
  let storage: Cache | undefined;
  try {
    storage = await caches.open("bliss-fonts-public-data-v1");
    const hit = await storage.match(request);
    if (hit) {
      const value = await hit.json() as T;
      scope.publicCacheResult = "hit";
      return value;
    }
  } catch {
    // The public catalog can still load if the edge cache is unavailable.
  }

  scope.publicCacheResult = "miss";
  const value = await load();
  if (storage && value !== null) {
    const response = Response.json(value, { headers: { "Cache-Control": "public, max-age=60" } });
    const write = storage.put(request, response).catch(() => {});
    if (scope.waitUntil) scope.waitUntil(write);
    else await write;
  }
  return value;
}
