import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
try {
  const database = client.db(process.env.MONGODB_DB || undefined);
  const collection = database.collection("fonts");
  const rows = await collection.find(
    { status: { $in: ["draft", "archived"] } },
    { projection: { _id: 0, id: 1, slug: 1, name: 1, status: 1, sourcePath: 1, sourceGroup: 1, bundleKey: 1, files: 1, license: 1 } },
  ).sort({ name: 1 }).toArray();
  const checked = [];
  for (const font of rows) {
    const bundleKey = font.bundleKey || `fonts/bundles/${font.slug}/${font.slug}-bliss-fonts.zip`;
    let bundleReady = false;
    try {
      const response = await fetch(`https://assets.blissbiovn.com/${bundleKey}`, { method: "HEAD", signal: AbortSignal.timeout(8000) });
      bundleReady = response.ok;
    } catch { /* Report the unavailable bundle below. */ }
    checked.push({ ...font, bundleKey, bundleReady, fileCount: font.files?.length || 0 });
  }
  console.log(JSON.stringify({ count: checked.length, ready: checked.filter((font) => font.bundleReady || font.fileCount).length, fonts: checked }, null, 2));
  if (process.argv.includes("--publish-ready")) {
    const ids = checked.filter((font) => font.bundleReady || font.fileCount).map((font) => font.id);
    if (ids.length) await collection.updateMany({ id: { $in: ids } }, { $set: { status: "published", updatedAt: new Date() } });
    console.log(`published=${ids.length} keptHidden=${checked.length - ids.length}`);
  }
} finally {
  await client.close();
}
