import type { Metadata } from "next";
import { FontDirectoryPage } from "@/components/font-directory-page";
import { DIRECTORY_PAGE_SIZE } from "@/components/font-directory";
import { getCachedPublicFonts } from "@/lib/catalog";
import { localeAlternates } from "@/lib/i18n";

export const metadata: Metadata = { title: "Browse All Fonts", description: "Browse the complete Bliss Fonts catalog with clear style, license and Vietnamese-support details.", alternates: localeAlternates("/fonts") };

export default async function FontsPage() {
  const fonts = await getCachedPublicFonts();
  const totalPages = Math.max(1, Math.ceil(fonts.length / DIRECTORY_PAGE_SIZE));
  return <FontDirectoryPage eyebrow="Complete catalog" title="Browse all fonts." description="Move through the complete type library in stable, crawlable pages. Open any family for a live preview, file details and related typefaces." fonts={fonts.slice(0, DIRECTORY_PAGE_SIZE)} total={fonts.length} currentPage={1} totalPages={totalPages} basePath="/fonts" />;
}
