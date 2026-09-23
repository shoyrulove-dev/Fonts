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
    const records = await collection.find({ $or: [{ status: { $exists: false } }, { status: "published" }] }).sort({ name: 1 }).toArray();
    if (!records.length) return allFonts;
    const existing = new Set(records.map((font) => font.id));
    return [...records, ...vietnameseFonts.filter((font) => !existing.has(font.id))] as CatalogFont[];
  } catch {
    return allFonts;
  }
}
