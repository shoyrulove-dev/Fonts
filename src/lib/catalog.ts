import baseFonts from "@/data/google-fonts.json";
import vietnameseFonts from "@/data/vietnamese-fonts.json";
import openFonts from "@/data/open-fonts.json";
import { getDatabase } from "@/lib/mongodb";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { cachedPublicFontData, usesPublicFontEdgeCache } from "./public-font-edge-cache";

export type CatalogFont = (typeof baseFonts)[number] & {
  status?: string;
  files?: string[];
  bundleKey?: string;
  updatedAt?: Date | string;
  sourceGroup?: string;
  sourceFile?: string;
  sourceFileCount?: number;
  licenseTier?: string;
};

export const allFonts = [...baseFonts, ...vietnameseFonts, ...openFonts] as CatalogFont[];
const staticFontsBySlug = new Map(allFonts.map((font) => [font.slug, font]));

function toPublicCatalogFont(font: CatalogFont): CatalogFont {
  const metadata = { ...font } as Partial<CatalogFont>;
  delete metadata.files;
  delete metadata.bundleKey;
  delete metadata.sourceFile;
  return metadata as CatalogFont;
}

async function findPublicFontBySlug(slug: string, strict = false): Promise<CatalogFont | null> {
  const fallback = staticFontsBySlug.get(slug) ?? null;
  if (!process.env.MONGODB_URI) return fallback;
  try {
    const collection = (await getDatabase()).collection<CatalogFont>("fonts");
    const record = await collection.findOne({ slug });
    if (!record) return fallback;
    if (record.status === "draft" || record.status === "archived") return null;
    return { ...fallback, ...record } as CatalogFont;
  } catch (error) {
    if (strict) throw error;
    return fallback;
  }
}

const getCachedPublicFontBySlug = unstable_cache(findPublicFontBySlug, ["public-font-by-slug"], { revalidate: 60 });
export const getPublicFontBySlug = cache((slug: string) => usesPublicFontEdgeCache()
  ? cachedPublicFontData("font:" + slug, () => findPublicFontBySlug(slug, true)).catch(() => staticFontsBySlug.get(slug) ?? null)
  : getCachedPublicFontBySlug(slug));

export function getStaticRelatedFonts(font: CatalogFont, limit = 6) {
  return allFonts
    .filter((item) => item.category === font.category && item.id !== font.id)
    .slice(0, limit);
}

async function loadPublicFonts(strict = false): Promise<CatalogFont[]> {
  if (!process.env.MONGODB_URI) return allFonts.map(toPublicCatalogFont);
  try {
    const collection = (await getDatabase()).collection<CatalogFont>("fonts");
    const records = await collection.find({
      $or: [
        { updatedAt: { $exists: true } },
        { id: /^manual\// },
      ],
    }, {
      // Directory/search pages only need catalog metadata. Keep file lists and
      // package keys out of this shared cache; detail/download loads them by slug.
      projection: { files: 0, bundleKey: 0, sourceFile: 0 },
    }).toArray();
    if (!records.length) return allFonts.map(toPublicCatalogFont);
    const merged = new Map(allFonts.map((font) => [font.id, font]));
    for (const record of records) {
      if (record.status === "draft" || record.status === "archived") merged.delete(record.id);
      else merged.set(record.id, { ...merged.get(record.id), ...record } as CatalogFont);
    }
    return [...merged.values()].map(toPublicCatalogFont).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    if (strict) throw error;
    return allFonts.map(toPublicCatalogFont);
  }
}

export const getPublicFonts = () => loadPublicFonts();

const getCachedPublicFontsData = unstable_cache(getPublicFonts, ["public-fonts"], { revalidate: 60 });
export const getCachedPublicFonts = cache(() => usesPublicFontEdgeCache()
  ? cachedPublicFontData("catalog", () => loadPublicFonts(true)).catch(() => allFonts.map(toPublicCatalogFont))
  : getCachedPublicFontsData());
