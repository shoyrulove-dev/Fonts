import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FontDirectoryPage } from "@/components/font-directory-page";
import { DIRECTORY_PAGE_SIZE } from "@/components/font-directory";
import { fontCategories, getFontCategory } from "@/data/collections";
import { allFonts, getCachedPublicFonts } from "@/lib/catalog";

export function generateStaticParams() {
  return fontCategories.flatMap((category) => {
    const count = allFonts.filter((font) => font.category === category.key).length;
    return Array.from({ length: Math.max(0, Math.ceil(count / DIRECTORY_PAGE_SIZE) - 1) }, (_, index) => ({ category: category.slug, page: String(index + 2) }));
  });
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; page: string }> }): Promise<Metadata> {
  const values = await params; const category = getFontCategory(values.category); const page = Number(values.page);
  return category && Number.isInteger(page) && page > 1 ? { title: `${category.title} — Page ${page}`, description: `${category.description} Browse page ${page}.`, alternates: { canonical: `/category/${category.slug}/page/${page}` } } : {};
}

export default async function CategoryPagedPage({ params }: { params: Promise<{ category: string; page: string }> }) {
  const values = await params; const category = getFontCategory(values.category); const page = Number(values.page);
  if (!category) notFound();
  const collection = (await getCachedPublicFonts()).filter((font) => font.category === category.key);
  const totalPages = Math.max(1, Math.ceil(collection.length / DIRECTORY_PAGE_SIZE));
  if (!Number.isInteger(page) || page < 2 || page > totalPages) notFound();
  const start = (page - 1) * DIRECTORY_PAGE_SIZE;
  return <FontDirectoryPage eyebrow="Browse by style" title={`${category.title} — page ${page}.`} description={category.description} fonts={collection.slice(start, start + DIRECTORY_PAGE_SIZE)} total={collection.length} currentPage={page} totalPages={totalPages} basePath={`/category/${category.slug}`} breadcrumbs={[{ href: `/category/${category.slug}`, label: category.title }]} />;
}
