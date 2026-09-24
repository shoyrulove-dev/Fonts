import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import woff2Manifest from "@/data/woff2-manifest.json";
import FontPreview from "@/components/font-preview";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { NativeBanner, PopunderDownload } from "@/components/ad-units";
import { getPublicFontBySlug, getStaticRelatedFonts, type CatalogFont } from "@/lib/catalog";
import { CatalogSiloNav } from "@/components/catalog-silo-nav";
import { fontCategories, useCases } from "@/data/collections";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const font = await getPublicFontBySlug(slug);
  if (!font) return { title: "Font not found" };
  const category = font.category?.toLowerCase().replace("_", " ") ?? "typeface";
  return { title: `${font.name} — Bliss Fonts`, description: `${font.name} is a ${font.supportsVietnamese ? "Vietnamese-ready " : ""}${category} typeface with a clear ${font.license} license and live preview.`, alternates: { canonical: `/font/${font.slug}` } };
}

export default async function FontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const font = await getPublicFontBySlug(slug);
  if (!font) notFound();
  const related = getStaticRelatedFonts(font);
  const sample = font.supportsVietnamese ? "Ăn ở ấm áp — Tiếng Việt đẹp cùng kiểu chữ này" : "Every idea deserves its own type.";
  const fontFiles = font.files?.length ? font.files : woff2Manifest[font.sourcePath as keyof typeof woff2Manifest] ?? [];
  const sourceLabel = font.sourceGroup || "Google Fonts";
  const category = fontCategories.find((item) => item.key === font.category);
  const matchingUseCases = useCases.filter((item) => (item.categories as readonly string[]).includes(font.category || ""));

  return <main className="min-h-screen bg-[#f6f4ee] text-[#1d241f]">
    <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-12">
      <SiteHeader backLabel="Back home" />
      <nav aria-label="Breadcrumb" className="mt-5 flex flex-wrap items-center gap-2 text-xs text-[#697169]"><Link href="/" className="hover:text-[#1d241f]">Bliss Fonts</Link><span>/</span><Link href="/fonts" className="hover:text-[#1d241f]">All fonts</Link>{category && <><span>/</span><Link href={`/category/${category.slug}`} className="hover:text-[#1d241f]">{category.label}</Link></>}<span>/</span><span>{font.name}</span></nav>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_260px]">
        <article className="rounded-[1.75rem] bg-white p-6 sm:p-9"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#78907c]">{font.supportsVietnamese ? "Vietnamese-ready typeface" : "Typeface preview"}</p><h1 className="mt-3 text-5xl font-semibold tracking-[-0.07em] sm:text-7xl">{font.name}</h1><p className="mt-3 text-sm text-[#697169]">{font.designer || sourceLabel} · {font.category?.replace("_", " ")}</p><FontPreview files={fontFiles} sample={sample} slug={font.slug} /></article>
        <aside data-reveal className="h-fit rounded-[1.75rem] bg-[#dce8dc] p-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5e7965]">Details</p><dl className="mt-6 space-y-4 text-sm"><div><dt className="text-[#607263]">License</dt><dd className="mt-1 font-medium">{font.license}</dd></div><div><dt className="text-[#607263]">Vietnamese support</dt><dd className="mt-1 font-medium">{font.supportsVietnamese ? "Confirmed" : "Not confirmed"}</dd></div><div><dt className="text-[#607263]">Collection</dt><dd className="mt-1 font-medium">{sourceLabel}</dd></div></dl><a href={font.sourceUrl || "/vietnamese"} target="_blank" rel="noreferrer" className="mt-6 block rounded-full bg-[#1d241f] px-4 py-2.5 text-center text-sm font-medium text-white">View source ↗</a></aside>
      </section>

      <section className="mt-5 rounded-[1.75rem] bg-[#1d241f] p-6 text-[#f6f4ee] sm:p-8"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b5cbb6]">Font files</p><h2 className="mt-2 text-2xl font-semibold">Download this font.</h2></div><span className="text-sm text-[#b5cbb6]">{font.license}</span></div><p className="mt-3 max-w-2xl text-sm leading-6 text-[#b7c0b8]">The ZIP includes the available font files and a short license note.</p><div className="mt-6 flex flex-wrap gap-3"><PopunderDownload href={`/api/fonts/${font.slug}/download`}>Download ZIP ↓</PopunderDownload><span className="rounded-full border border-white/15 px-4 py-2.5 text-sm text-[#b7c0b8]">{fontFiles.length} file{fontFiles.length === 1 ? "" : "s"}</span></div>{fontFiles.length > 0 && <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{fontFiles.map((file) => { const filename = file.split("/").pop() ?? file; return <a key={file} href={`https://assets.blissbiovn.com/${file}`} download className="flex items-center justify-between rounded-xl border border-white/15 px-3 py-2.5 text-sm hover:bg-white/10"><span className="truncate pr-3">{filename}</span><span className="text-[#b5cbb6]">↓</span></a>; })}</div>}</section>

      <NativeBanner />
      <section className="mt-12"><header className="flex items-end justify-between"><h2 className="text-2xl font-semibold tracking-tight">Related typefaces</h2><span className="text-sm text-[#697169]">{font.category?.replace("_", " ")}</span></header><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">{related.map((item: CatalogFont) => <Link data-reveal href={`/font/${item.slug}`} key={item.id} className="rounded-2xl border border-[#d8d7cc] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#78907c]"><p className="truncate font-medium">{item.name}</p><p className="mt-2 text-xs text-[#697169]">{item.supportsVietnamese ? "Vietnamese ready" : item.category?.replace("_", " ")}</p></Link>)}</div></section>
      {matchingUseCases.length > 0 && <section className="mt-10 rounded-3xl bg-white p-6"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#78907c]">Useful collections</p><div className="mt-4 flex flex-wrap gap-2">{matchingUseCases.map((item) => <Link key={item.slug} href={`/use/${item.slug}`} className="rounded-full border border-[#d8d7cc] px-4 py-2 text-sm hover:bg-[#dce8dc]">{item.title}</Link>)}</div></section>}
      <CatalogSiloNav compact />
      <SiteFooter />
    </div>
  </main>;
}
