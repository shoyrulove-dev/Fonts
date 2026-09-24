import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FontDirectoryPage } from "@/components/font-directory-page";
import { DIRECTORY_PAGE_SIZE } from "@/components/font-directory";
import { allFonts, getCachedPublicFonts } from "@/lib/catalog";

function isVietnameseArchive(font: (typeof allFonts)[number]) {
  return font.id.startsWith("vietnamese/") || Boolean(font.sourceGroup);
}

export function generateStaticParams() {
  const count = allFonts.filter(isVietnameseArchive).length;
  return Array.from({ length: Math.max(0, Math.ceil(count / DIRECTORY_PAGE_SIZE) - 1) }, (_, index) => ({ page: String(index + 2) }));
}

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const page = Number((await params).page);
  return Number.isInteger(page) && page > 1 ? { title: `Vietnamese Fonts — Page ${page}`, description: `Browse page ${page} of the Bliss Fonts Vietnamese archive.`, alternates: { canonical: `/vietnamese/page/${page}` } } : {};
}

export default async function VietnamesePagedPage({ params }: { params: Promise<{ page: string }> }) {
  const page = Number((await params).page);
  const fonts = (await getCachedPublicFonts()).filter(isVietnameseArchive);
  const totalPages = Math.max(1, Math.ceil(fonts.length / DIRECTORY_PAGE_SIZE));
  if (!Number.isInteger(page) || page < 2 || page > totalPages) notFound();
  const start = (page - 1) * DIRECTORY_PAGE_SIZE;
  return <FontDirectoryPage eyebrow="Vietnamese archive" title={`Vietnamese fonts — page ${page}.`} description="Browse imported Vietnamese collections with permanent links, source details and license reminders." fonts={fonts.slice(start, start + DIRECTORY_PAGE_SIZE)} total={fonts.length} currentPage={page} totalPages={totalPages} basePath="/vietnamese" breadcrumbs={[{ href: "/vietnamese", label: "Vietnamese fonts" }]} />;
}
