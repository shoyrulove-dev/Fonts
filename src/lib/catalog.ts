import baseFonts from "@/data/google-fonts.json";
import vietnameseFonts from "@/data/vietnamese-fonts.json";
import { getDatabase } from "@/lib/mongodb";

export type CatalogFont = (typeof baseFonts)[number] & {
  status?: string;
  files?: string[];
  bundleKey?: string;
  updatedAt?: Date | string;
  sourceGroup?: string;
  sourceFile?: string;
};

export const allFonts = [...baseFonts, ...vietnameseFonts] as CatalogFont[];

export async function getPublicFonts(): Promise<CatalogFont[]> {
  if (!process.env.MONGODB_URI) return allFonts;
  try {
    const collection = (await getDatabase()).collection<CatalogFont>("fonts");
    const records = await collection.find({}).toArray();
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
