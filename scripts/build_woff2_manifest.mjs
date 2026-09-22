import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "converted", "woff2");
const output = path.join(root, "src", "data", "woff2-manifest.json");

async function walk(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(full));
    else if (entry.name.endsWith(".woff2")) result.push(full);
  }
  return result;
}

const files = await walk(sourceRoot);
const manifest = {};
for (const file of files) {
  const relative = path.relative(sourceRoot, file).split(path.sep).join("/");
  const parts = relative.split("/");
  const familyKey = parts.slice(0, -1).join("/");
  manifest[familyKey] ??= [];
  manifest[familyKey].push("fonts/" + relative);
}
for (const values of Object.values(manifest)) values.sort();

await writeFile(output, JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log("families=" + Object.keys(manifest).length + " files=" + files.length);
