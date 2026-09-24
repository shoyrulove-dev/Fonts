import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FontDirectoryPage } from "@/components/font-directory-page";
import { DIRECTORY_PAGE_SIZE } from "@/components/font-directory";
import { allFonts, getCachedPublicFonts } from "@/lib/catalog";

export function generateStaticParams() {
  const totalPages = Math.ceil(allFonts.length / DIRECTORY_PAGE_SIZE);
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => ({ page: String(index + 2) }));
}

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const page = Number((await params).page);
  return Number.isInteger(page) && page > 1 ? { title: `All Fonts — Page ${page}`, description: `Browse page ${page} of the complete Bliss Fonts catalog.`, alternates: { canonical: `/fonts/page/${page}` } } : {};
}

export default async function FontsPagedPage({ params }: { params: Promise<{ page: string }> }) {
  const page = Number((await params).page);
  const fonts = await getCachedPublicFonts();
  const totalPages = Math.max(1, Math.ceil(fonts.length / DIRECTORY_PAGE_SIZE));
  if (!Number.isInteger(page) || page < 2 || page > totalPages) notFound();
  const start = (page - 1) * DIRECTORY_PAGE_SIZE;
  return <FontDirectoryPage eyebrow="Complete catalog" title={`Browse all fonts — page ${page}.`} description="Continue through the complete type library. Every catalog page uses permanent links so both people and search engines can reach each font family." fonts={fonts.slice(start, start + DIRECTORY_PAGE_SIZE)} total={fonts.length} currentPage={page} totalPages={totalPages} basePath="/fonts" breadcrumbs={[{ href: "/fonts", label: "All fonts" }]} />;
}
