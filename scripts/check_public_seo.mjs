import fs from "node:fs";

const base = "https://fonts.blissbiovn.com";
const fonts = JSON.parse(fs.readFileSync("src/data/open-fonts.json", "utf8"));
const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
const failures = [];
const canonicalMissing = [];
const titleMissing = [];
const descriptionMissing = [];
const internalLinksMissing = [];
const queue = [...fonts];
let checked = 0;

async function worker() {
  while (queue.length) {
    const font = queue.shift();
    try {
      const response = await fetch(`${base}/font/${font.slug}`);
      const html = await response.text();
      if (!response.ok) failures.push({ slug: font.slug, status: response.status });
      if (!html.includes('<link rel="canonical"')) canonicalMissing.push(font.slug);
      if (!html.includes("<title>")) titleMissing.push(font.slug);
      if (!html.includes('<meta name="description"')) descriptionMissing.push(font.slug);
      if (!html.includes("/font/")) internalLinksMissing.push(font.slug);
    } catch (error) {
      failures.push({ slug: font.slug, error: error?.name || "FetchError" });
    }
    checked += 1;
    if (checked % 200 === 0) console.error(`checked=${checked}`);
  }
}

await Promise.all(Array.from({ length: 20 }, worker));
console.log(JSON.stringify({
  sitemapUrls: sitemapUrls.size,
  sitemapOpenFonts: fonts.filter((font) => sitemapUrls.has(`${base}/font/${font.slug}`)).length,
  expectedOpenFonts: fonts.length,
  checked,
  failures,
  canonicalMissing,
  titleMissing,
  descriptionMissing,
  internalLinksMissing,
}, null, 2));

if (failures.length || canonicalMissing.length || titleMissing.length || descriptionMissing.length) process.exitCode = 1;
