import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync } from "fflate";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const archivePath = path.join(root, "tmp-fonts", "DoulosSIL-7.000.zip");
const outputJson = path.join(root, "src", "data", "open-fonts.json");
const sourcePath = "sources/open-fonts/sil/doulos-sil";
const target = path.join(root, ...sourcePath.split("/"));
const records = JSON.parse(await readFile(outputJson, "utf8"));
if (!records.some((font) => font.slug === "doulos-sil")) {
  const archive = new Uint8Array(await readFile(archivePath));
  const entries = unzipSync(archive);
  const ttf = entries["DoulosSIL-7.000/DoulosSIL-Regular.ttf"];
  if (!ttf) throw new Error("DoulosSIL-Regular.ttf is missing from the official archive");
  await mkdir(target, { recursive: true });
  await writeFile(path.join(target, "DoulosSIL-Regular.ttf"), ttf);
  await writeFile(path.join(target, "source-package.zip"), archive);
  records.push({ id: "open/sil/doulos-sil", slug: "doulos-sil", name: "Doulos SIL", designer: "SIL International", category: "SERIF", license: "SIL Open Font License 1.1", licenseTier: "standard", subsets: ["latin", "latin-ext", "ipa"], supportsVietnamese: false, sourcePath, sourceUrl: "https://github.com/silnrsi/font-doulos", sourceGroup: "SIL Fonts", bundleKey: "fonts/bundles/doulos-sil/doulos-sil-bliss-fonts.zip", status: "published", tags: ["Open Source", "Open License", "Latin", "IPA"], sourceFileCount: 1 });
  records.sort((a, b) => a.name.localeCompare(b.name));
  await writeFile(outputJson, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  console.log("Imported Doulos SIL");
} else console.log("Doulos SIL already present");
