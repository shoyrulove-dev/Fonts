import baseFonts from "@/data/google-fonts.json";
import vietnameseFonts from "@/data/vietnamese-fonts.json";
import openFonts from "@/data/open-fonts.json";
import { getDatabase } from "@/lib/mongodb";
import { cache } from "react";
import { unstable_cache } from "next/cache";

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

async function findPublicFontBySlug(slug: string): Promise<CatalogFont | null> {
  const fallback = staticFontsBySlug.get(slug) ?? null;
  if (!process.env.MONGODB_URI) return fallback;
  try {
    const collection = (await getDatabase()).collection<CatalogFont>("fonts");
    const record = await collection.findOne({ slug });
    if (!record) return fallback;
    if (record.status === "draft" || record.status === "archived") return null;
    return { ...fallback, ...record } as CatalogFont;
  } catch {
    return fallback;
  }
}

const getCachedPublicFontBySlug = unstable_cache(findPublicFontBySlug, ["public-font-by-slug"], { revalidate: 60 });
export const getPublicFontBySlug = cache((slug: string) => getCachedPublicFontBySlug(slug));

export function getStaticRelatedFonts(font: CatalogFont, limit = 6) {
  return allFonts
    .filter((item) => item.category === font.category && item.id !== font.id)
    .slice(0, limit);
}

export async function getPublicFonts(): Promise<CatalogFont[]> {
  if (!process.env.MONGODB_URI) return allFonts;
  try {
    const collection = (await getDatabase()).collection<CatalogFont>("fonts");
    const records = await collection.find({
      $or: [
        { updatedAt: { $exists: true } },
        { id: /^manual\// },
      ],
    }).toArray();
    if (!records.length) return allFonts;
    const merged = new Map(allFonts.map((font) => [font.id, font]));
    for (const record of records) {
      if (record.status === "draft" || record.status === "archived") merged.delete(record.id);
      else merged.set(record.id, { ...merged.get(record.id), ...record } as CatalogFont);
    }
    return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return allFonts;
  }
}

const getCachedPublicFontsData = unstable_cache(getPublicFonts, ["public-fonts"], { revalidate: 60 });
export const getCachedPublicFonts = cache(getCachedPublicFontsData);
