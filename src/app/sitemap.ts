import type { MetadataRoute } from "next";
import { DIRECTORY_PAGE_SIZE } from "@/components/font-directory";
import { fontCategories, legalPages, useCases } from "@/data/collections";
import { getCachedPublicFonts, type CatalogFont } from "@/lib/catalog";

const baseUrl = "https://fonts.blissbiovn.com";

function pageUrls(path: string, total: number, priority: number): MetadataRoute.Sitemap {
  const pages = Math.max(1, Math.ceil(total / DIRECTORY_PAGE_SIZE));
  return Array.from({ length: pages }, (_, index) => ({
    url: index === 0 ? `${baseUrl}${path}` : `${baseUrl}${path}/page/${index + 1}`,
    changeFrequency: "weekly" as const,
    priority: index === 0 ? priority : Math.max(0.4, priority - 0.1),
  }));
}

function reliableLastModified(font: CatalogFont) {
  if (!font.updatedAt) return {};
  const value = new Date(font.updatedAt);
  return Number.isNaN(value.getTime()) ? {} : { lastModified: value };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fonts = await getCachedPublicFonts();
  const vietnamese = fonts.filter((font) => font.id.startsWith("vietnamese/"));
  const categoryDirectories = fontCategories.flatMap((category) => pageUrls(`/category/${category.slug}`, fonts.filter((font) => font.category === category.key).length, 0.8));

  return [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    ...pageUrls("/fonts", fonts.length, 0.9),
    ...categoryDirectories,
    ...pageUrls("/vietnamese", vietnamese.length, 0.9),
    ...useCases.map((item) => ({ url: `${baseUrl}/use/${item.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...Object.keys(legalPages).map((page) => ({ url: `${baseUrl}/legal/${page}`, changeFrequency: "yearly" as const, priority: 0.3 })),
    ...fonts.map((font) => ({
      url: `${baseUrl}/font/${font.slug}`,
      ...reliableLastModified(font),
      changeFrequency: "monthly" as const,
      priority: font.supportsVietnamese ? 0.8 : 0.6,
    })),
  ];
}
