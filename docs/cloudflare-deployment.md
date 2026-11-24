# Fonts on Cloudflare Workers

Worker: **fonts**. Custom domain after verification: **fonts.blissbiovn.com**.

Connect **shoyrulove-dev/Fonts** using the **master** branch and repository root. Use Node.js 24. Set the build command to `npm run cf:build` and the deploy command to `npm run cf:deploy`.

Keep MongoDB, admin, and R2 credentials in Worker runtime secrets. Before attaching the custom domain, verify `/api/health`, the catalog, a sample font download, and admin sign-in. Validate R2 write access with an isolated test object rather than changing published font assets.
