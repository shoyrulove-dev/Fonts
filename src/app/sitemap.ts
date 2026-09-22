import type { MetadataRoute } from "next";
import { getPublicFonts } from "@/lib/catalog";

const baseUrl = "https://fonts.blissbiovn.com";
const categories = ["sans_serif", "serif", "display", "handwriting", "monospace"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fonts = await getPublicFonts();
  const updated = new Date();
  return [
    { url: baseUrl, lastModified: updated, changeFrequency: "daily", priority: 1 },
    ...categories.map((category) => ({
      url: `${baseUrl}/category/${category}`,
      lastModified: updated,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...fonts.map((font) => ({
      url: `${baseUrl}/font/${font.slug}`,
      lastModified: updated,
      changeFrequency: "monthly" as const,
      priority: font.supportsVietnamese ? 0.8 : 0.6,
    })),
  ];
}
