import type { Metadata } from "next";
import VietnameseExplorer from "@/components/vietnamese-explorer";
import { CatalogSiloNav } from "@/components/catalog-silo-nav";
import { DirectoryPagination, DIRECTORY_PAGE_SIZE } from "@/components/font-directory";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getCachedPublicFonts } from "@/lib/catalog";
import { localeAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Vietnamese Fonts",
  description: "Browse Vietnamese font collections from SFU, SVN, UTM, UVF, UVN and iCiel.",
  alternates: localeAlternates("/vietnamese"),
};

export default async function VietnamesePage() {
  const allFonts = await getCachedPublicFonts();
  const fonts = allFonts.filter((font) => font.id.startsWith("vietnamese/"));
  const collectionIds = new Set(fonts.map((font) => font.id));
  const compatible = allFonts.filter((font) => font.supportsVietnamese && !collectionIds.has(font.id)).length;
  const explorerFonts = fonts.slice(0, DIRECTORY_PAGE_SIZE).map(({ id, slug, name, designer, category, license, sourceGroup }) => ({ id, slug, name, designer, category, license, sourceGroup }));
  const groups = Array.from(new Set(fonts.map((font) => font.sourceGroup).filter(Boolean) as string[])).sort();
  const totalPages = Math.max(1, Math.ceil(fonts.length / DIRECTORY_PAGE_SIZE));

  return <main className="min-h-screen bg-[#f6f4ee] text-[#1d241f]">
    <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-12">
      <SiteHeader />
      <header data-reveal className="grid gap-6 py-9 lg:grid-cols-[1fr_auto] lg:items-end lg:py-12">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#78907c]">Vietnamese archive</p>
          <h1 className="mt-4 text-5xl font-semibold leading-[.98] tracking-[-.065em] sm:text-7xl">Vietnamese fonts,<br />clearly organized.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#697169]">Browse imported Vietnamese collections by source. These packages are marked Personal Use; check the original license before commercial work.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:w-72">
          <div className="rounded-2xl bg-white p-4"><p className="text-2xl font-semibold">{fonts.length.toLocaleString("en-US")}</p><p className="mt-1 text-xs text-[#697169]">Vietnamese archive</p></div>
          <div className="rounded-2xl bg-[#dce8dc] p-4"><p className="text-2xl font-semibold">{compatible.toLocaleString("en-US")}</p><p className="mt-1 text-xs text-[#697169]">Compatible families</p></div>
        </div>
      </header>
      <VietnameseExplorer fonts={explorerFonts} total={fonts.length} groups={groups} />
      <DirectoryPagination basePath="/vietnamese" currentPage={1} totalPages={totalPages} />
      <CatalogSiloNav compact />
      <SiteFooter />
    </div>
  </main>;
}
