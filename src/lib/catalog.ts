import baseFonts from "@/data/google-fonts.json";
import { getDatabase } from "@/lib/mongodb";

export type CatalogFont = (typeof baseFonts)[number] & {
  status?: string;
  files?: string[];
  bundleKey?: string;
  updatedAt?: Date | string;
};

export async function getPublicFonts(): Promise<CatalogFont[]> {
  if (!process.env.MONGODB_URI) return baseFonts as CatalogFont[];
  try {
    const collection = (await getDatabase()).collection<CatalogFont>("fonts");
    const records = await collection.find({ $or: [{ status: { $exists: false } }, { status: "published" }] }).sort({ name: 1 }).toArray();
    return records.length ? records : baseFonts as CatalogFont[];
  } catch {
    return baseFonts as CatalogFont[];
  }
}
