import type { Metadata } from "next";
import VietnameseExplorer from "@/components/vietnamese-explorer";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getPublicFonts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Vietnamese Fonts — Bliss Fonts",
  description: "Browse Vietnamese font collections from SFU, SVN, UTM, UVF, UVN and iCiel.",
  alternates: { canonical: "/vietnamese" },
};

export default async function VietnamesePage() {
  const allFonts = await getPublicFonts();
  const fonts = allFonts.filter((font) => font.id.startsWith("vietnamese/") || Boolean(font.sourceGroup));
  const collectionIds = new Set(fonts.map((font) => font.id));
  const compatible = allFonts.filter((font) => font.supportsVietnamese && !collectionIds.has(font.id)).length;

  return <main className="min-h-screen bg-[#f6f4ee] text-[#1d241f]">
    <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-12">
      <SiteHeader />
      <header data-reveal className="grid gap-8 py-12 lg:grid-cols-[1fr_auto] lg:items-end lg:py-16">
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
      <VietnameseExplorer fonts={fonts} />
      <SiteFooter />
    </div>
  </main>;
}
