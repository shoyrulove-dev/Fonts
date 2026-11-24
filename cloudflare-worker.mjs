import next from "./.open-next/worker.js";
import { mongoRequestScope } from "./src/lib/mongo-request-scope.mjs";

export * from "./.open-next/worker.js";

async function closeMongo(scope) {
  try {
    await scope.client?.close();
  } catch (error) {
    console.warn("Fonts MongoDB cleanup failed", error?.name);
  }
}

export default {
  fetch(request, env, ctx) {
    const url = new URL(request.url);
    const isAdmin = /^(?:\/api)?\/admin(?:\/|$)/.test(url.pathname);
    const scope = {
      publicCacheOrigin: request.method === "GET" && !isAdmin ? url.origin : undefined,
      waitUntil: (promise) => ctx.waitUntil(promise),
    };
    return mongoRequestScope.run(scope, async () => {
      try {
        const response = await next.fetch(request, env, ctx);
        if (!response.body || response.status === 101) {
          ctx.waitUntil(closeMongo(scope));
          return response;
        }
        const stream = new TransformStream();
        ctx.waitUntil(response.body.pipeTo(stream.writable).catch(() => {}).finally(() => closeMongo(scope)));
        const output = new Response(stream.readable, response);
        if (scope.publicCacheResult) {
          output.headers.append("Server-Timing", `fontdata;desc="${scope.publicCacheResult}"`);
        }
        return output;
      } catch (error) {
        ctx.waitUntil(closeMongo(scope));
        throw error;
      }
    });
  },
};
