import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FontDirectoryPage } from "@/components/font-directory-page";
import { DIRECTORY_PAGE_SIZE } from "@/components/font-directory";
import { fontCategories, getFontCategory } from "@/data/collections";
import { getCachedPublicFonts } from "@/lib/catalog";
import { localeAlternates } from "@/lib/i18n";

export function generateStaticParams() { return fontCategories.map(({ slug }) => ({ category: slug })); }

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const category = getFontCategory((await params).category);
  return category ? { title: category.title, description: category.description, alternates: localeAlternates(`/category/${category.slug}`) } : {};
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const category = getFontCategory((await params).category);
  if (!category) notFound();
  const collection = (await getCachedPublicFonts()).filter((font) => font.category === category.key);
  const totalPages = Math.max(1, Math.ceil(collection.length / DIRECTORY_PAGE_SIZE));
  const vietnameseCount = collection.filter((font) => font.supportsVietnamese).length;
  return <FontDirectoryPage eyebrow="Browse by style" title={category.title} description={`${category.description} This collection includes ${vietnameseCount.toLocaleString("en-US")} families with confirmed Vietnamese coverage.`} fonts={collection.slice(0, DIRECTORY_PAGE_SIZE)} total={collection.length} currentPage={1} totalPages={totalPages} basePath={`/category/${category.slug}`} />;
}
