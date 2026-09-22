import type { MetadataRoute } from "next";
import fonts from "@/data/google-fonts.json";

const baseUrl = "https://fonts.blissbiovn.com";
const categories = ["sans_serif", "serif", "display", "handwriting", "monospace"];

export default function sitemap(): MetadataRoute.Sitemap {
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
