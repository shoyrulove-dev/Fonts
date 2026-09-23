import Image from "next/image";
import Link from "next/link";
import FontExplorer from "@/components/font-explorer";
import { NativeBanner } from "@/components/ad-units";
import { getPublicFonts, type CatalogFont } from "@/lib/catalog";

const categories = [
  { key: "SANS_SERIF", slug: "sans_serif", label: "Sans Serif", note: "Clean and versatile" },
  { key: "SERIF", slug: "serif", label: "Serif", note: "Editorial and timeless" },
  { key: "DISPLAY", slug: "display", label: "Display", note: "Made to be noticed" },
  { key: "HANDWRITING", slug: "handwriting", label: "Handwriting", note: "Personal and expressive" },
  { key: "MONOSPACE", slug: "monospace", label: "Monospace", note: "For code and systems" },
];

const categoryLabel = (category: string | null) => category?.replace("_", " ") ?? "Other";

export default async function Home() {
  const fonts = await getPublicFonts();
  const vietnameseFonts = fonts.filter((font: CatalogFont) => font.supportsVietnamese);
  const featured = vietnameseFonts.slice(0, 8);
  const explorerFonts = fonts.map(({ id, slug, name, designer, category, license, supportsVietnamese }) => ({ id, slug, name, designer, category, license, supportsVietnamese }));

  return <main className="min-h-screen overflow-hidden bg-[#f6f4ee] text-[#1d241f]">
    <section className="relative mx-auto max-w-7xl px-5 pb-10 pt-5 sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute -right-40 -top-48 h-[32rem] w-[32rem] rounded-full bg-[#dce8dc]/70 blur-3xl" />
      <nav className="relative flex items-center justify-between border-b border-[#d8d7cc] pb-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Bliss Fonts home"><Image src="/icon.svg" alt="Bliss Fonts" width={34} height={34} priority /><span className="font-semibold tracking-[-0.03em]">Bliss Fonts</span></Link>
        <div className="flex items-center gap-5 text-sm text-[#697169]"><a href="#explore" className="hidden hover:text-[#1d241f] sm:block">Explore</a><Link href="/vietnamese" className="rounded-full bg-[#1d241f] px-4 py-2 text-white">Vietnamese fonts</Link></div>
      </nav>

      <div className="relative grid gap-9 py-14 lg:grid-cols-[1.12fr_.88fr] lg:items-center lg:py-20">
        <div data-reveal>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#5e7965]">A calmer way to find type</p>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[0.96] tracking-[-0.07em] sm:text-7xl">Find the font that makes your idea feel right.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#697169]">A carefully indexed collection of beautiful typefaces. Preview every family, check its license, and choose with confidence.</p>
          <div className="mt-7 flex flex-wrap gap-3"><a href="#explore" className="rounded-full bg-[#1d241f] px-5 py-2.5 text-sm font-medium text-white transition-transform hover:-translate-y-0.5">Explore collection <span className="ml-2">↘</span></a><Link href="/vietnamese" className="rounded-full border border-[#c9ccc1] bg-white/60 px-5 py-2.5 text-sm font-medium hover:bg-white">Vietnamese archive</Link></div>
          <p className="mt-5 text-sm text-[#889087]">Clear licenses · Vietnamese coverage · Live preview</p>
        </div>
        <div data-reveal className="relative mx-auto w-full max-w-sm">
          <div className="absolute -right-4 top-10 h-48 w-48 rounded-full bg-[#c97d61] opacity-20 blur-3xl" />
          <div className="relative rotate-1 rounded-[1.75rem] bg-[#1d241f] p-7 text-[#f6f4ee] shadow-2xl shadow-[#1d241f]/15"><div className="flex items-start justify-between border-b border-white/15 pb-5"><span className="text-xs uppercase tracking-[0.22em] text-[#b5cbb6]">Specimen 01</span><span className="rounded-full border border-white/20 px-3 py-1 text-xs">OFL</span></div><p className="mt-8 text-[6.5rem] leading-[.8] tracking-[-0.1em]">Aa</p><p className="mt-7 text-xl leading-tight text-[#dce8dc]">Every letter<br />has a point of view.</p><div className="mt-8 flex justify-between text-xs text-[#a2b3a4]"><span>BLISS FONTS</span><span>2026</span></div></div>
          <div className="absolute -bottom-5 -left-4 rounded-2xl bg-[#e7c4a6] px-4 py-3 text-sm shadow-lg shadow-[#1d241f]/10"><span className="block text-[10px] uppercase tracking-wider text-[#765948]">Vietnamese ready</span><span className="mt-1 block font-medium text-[#3d3028]">Ăn ở ấm áp, ước mơ</span></div>
        </div>
      </div>

      <div data-reveal className="grid gap-5 border-y border-[#d8d7cc] py-6 sm:grid-cols-3"><div><p className="text-3xl font-semibold tracking-[-0.05em]">{fonts.length.toLocaleString("en-US")}+</p><p className="mt-1 text-sm text-[#697169]">font families indexed</p></div><div><p className="text-3xl font-semibold tracking-[-0.05em]">{vietnameseFonts.length.toLocaleString("en-US")}</p><p className="mt-1 text-sm text-[#697169]">families with Vietnamese coverage</p></div><div><p className="text-3xl font-semibold tracking-[-0.05em]">100%</p><p className="mt-1 text-sm text-[#697169]">source and license transparency</p></div></div>

      <section id="explore" className="pt-16">
        <header className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#78907c]">Browse by mood</p><h2 className="mt-2 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">Start with a direction.</h2></div><p className="max-w-xs text-sm leading-6 text-[#697169]">From quiet editorial serifs to expressive display faces.</p></header>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{categories.map((category, index) => { const count = fonts.filter((font: CatalogFont) => font.category === category.key).length; return <Link data-reveal href={`/category/${category.slug}`} key={category.key} className={`group rounded-2xl p-5 transition-transform hover:-translate-y-0.5 ${index % 2 === 0 ? "bg-white" : "bg-[#dce8dc]"}`}><div className="flex items-start justify-between"><span className="text-2xl font-light">0{index + 1}</span><span className="opacity-50 transition-transform group-hover:translate-x-1">↗</span></div><p className="mt-9 font-semibold">{category.label}</p><p className="mt-1 text-sm text-[#697169]">{category.note}</p><p className="mt-4 text-xs uppercase tracking-wider text-[#889087]">{count} families</p></Link>; })}</div>
      </section>

      <FontExplorer fonts={explorerFonts} />
      <NativeBanner />

      <section id="vietnamese" className="pt-16">
        <header className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#78907c]">Vietnamese coverage</p><h2 className="mt-2 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">Made for every accent.</h2></div><Link href="/vietnamese" className="rounded-full border border-[#c9ccc1] px-4 py-2 text-sm text-[#697169]">View all {vietnameseFonts.length} →</Link></header>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{featured.map((font: CatalogFont) => <Link data-reveal href={`/font/${font.slug}`} key={font.id} className="group rounded-2xl bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#1d241f]/5"><div className="flex items-center justify-between"><span className="text-[11px] uppercase tracking-wider text-[#889087]">{categoryLabel(font.category)}</span><span className="text-[#78907c]">↗</span></div><p className="mt-8 truncate text-2xl font-medium tracking-[-0.05em]">{font.name}</p><p className="mt-3 truncate text-lg text-[#5e7965]">Ăn ở ấm áp, ước mơ</p><div className="mt-6 flex justify-between border-t border-[#ecebe4] pt-3 text-xs text-[#889087]"><span>{font.license}</span><span>Preview</span></div></Link>)}</div>
      </section>

      <footer className="mt-16 flex flex-col justify-between gap-4 border-t border-[#d8d7cc] py-6 text-sm text-[#697169] sm:flex-row"><span>© 2026 Bliss Fonts</span><span>Thoughtful type, clearly catalogued.</span></footer>
    </section>
  </main>;
}
