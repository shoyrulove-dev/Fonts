import Image from "next/image";
import Link from "next/link";
import FontExplorer from "@/components/font-explorer";
import { NativeBanner } from "@/components/ad-units";
import { getPublicFonts, type CatalogFont } from "@/lib/catalog";

type FontRecord = CatalogFont;

const categories = [
  { key: "SANS_SERIF", label: "Sans Serif", note: "Clean and versatile" },
  { key: "SERIF", label: "Serif", note: "Editorial and timeless" },
  { key: "DISPLAY", label: "Display", note: "Made to be noticed" },
  { key: "HANDWRITING", label: "Handwriting", note: "Personal and expressive" },
  { key: "MONOSPACE", label: "Monospace", note: "For code and systems" },
];

const categoryLabel = (category: string | null) => category?.replace("_", " ") ?? "Other";

export default async function Home() {
  const fonts = await getPublicFonts();
  const vietnameseFonts = fonts.filter((font: FontRecord) => font.supportsVietnamese);
  const featured = vietnameseFonts.slice(0, 8);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f4ee] text-[#1d241f]">
      <section className="relative mx-auto max-w-7xl px-6 pb-20 pt-6 sm:px-10 lg:px-16">
        <div className="pointer-events-none absolute -right-40 -top-48 h-[34rem] w-[34rem] rounded-full bg-[#dce8dc]/70 blur-3xl" />
        <nav className="relative flex items-center justify-between border-b border-[#d8d7cc] pb-5">
          <Link href="/" className="flex items-center gap-3" aria-label="Bliss Fonts home">
            <Image src="/icon.svg" alt="Bliss Fonts" width={38} height={38} priority />
            <span className="text-lg font-semibold tracking-[-0.03em]">Bliss Fonts</span>
          </Link>
          <div className="hidden items-center gap-8 text-sm text-[#697169] sm:flex">
            <a href="#explore" className="transition-colors hover:text-[#1d241f]">Explore</a>
            <a href="#about" className="transition-colors hover:text-[#1d241f]">About the catalog</a>
            <Link href="#vietnamese" className="rounded-full bg-[#1d241f] px-4 py-2 text-white transition-transform hover:-translate-y-0.5">Vietnamese fonts</Link>
          </div>
        </nav>

        <div className="relative grid gap-12 py-20 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:py-28">
          <div>
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.26em] text-[#5e7965]">A calmer way to find type</p>
            <h1 className="max-w-4xl text-6xl font-semibold leading-[0.94] tracking-[-0.075em] sm:text-8xl">Find the font that makes your idea feel right.</h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-[#697169]">A carefully indexed collection of beautiful, open-source typefaces. Preview every family, check its license, and choose with confidence.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#explore" className="rounded-full bg-[#1d241f] px-6 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5">Explore the collection <span className="ml-2">↘</span></a>
              <a href="#about" className="rounded-full border border-[#c9ccc1] bg-white/60 px-6 py-3 text-sm font-medium text-[#1d241f] hover:bg-white">Why Bliss Fonts?</a>
            </div>
            <p className="mt-7 text-sm text-[#889087]">Open-source licenses · Vietnamese-ready coverage · Live type preview</p>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -right-4 top-10 h-56 w-56 rounded-full bg-[#c97d61] opacity-20 blur-3xl" />
            <div className="relative rotate-2 rounded-[2rem] bg-[#1d241f] p-7 text-[#f6f4ee] shadow-2xl shadow-[#1d241f]/15 sm:p-10">
              <div className="flex items-start justify-between border-b border-white/15 pb-8"><span className="text-xs uppercase tracking-[0.22em] text-[#b5cbb6]">Specimen 01</span><span className="rounded-full border border-white/20 px-3 py-1 text-xs">OFL</span></div>
              <p className="mt-12 text-[5.5rem] leading-[.8] tracking-[-0.1em] sm:text-[8rem]">Aa</p>
              <p className="mt-10 text-2xl leading-tight text-[#dce8dc]">Every letter<br />has a point of view.</p>
              <div className="mt-12 flex justify-between text-xs text-[#a2b3a4]"><span>BLISS FONTS</span><span>2026</span></div>
            </div>
            <div className="absolute -bottom-8 -left-8 rounded-2xl bg-[#e7c4a6] px-5 py-4 text-sm shadow-lg shadow-[#1d241f]/10"><span className="block text-xs uppercase tracking-wider text-[#765948]">Vietnamese ready</span><span className="mt-1 block font-medium text-[#3d3028]">Ăn ở ấm áp, ước mơ</span></div>
          </div>
        </div>

        <div id="about" className="grid gap-5 border-y border-[#d8d7cc] py-8 sm:grid-cols-3">
          <div><p className="text-3xl font-semibold tracking-[-0.05em]">{fonts.length.toLocaleString("en-US")}+</p><p className="mt-1 text-sm text-[#697169]">font families indexed</p></div>
          <div><p className="text-3xl font-semibold tracking-[-0.05em]">{vietnameseFonts.length.toLocaleString("en-US")}</p><p className="mt-1 text-sm text-[#697169]">families with Vietnamese coverage</p></div>
          <div><p className="text-3xl font-semibold tracking-[-0.05em]">100%</p><p className="mt-1 text-sm text-[#697169]">source and license transparency</p></div>
        </div>

        <section id="explore" className="pt-24">
          <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#78907c]">Browse by mood</p><h2 className="mt-3 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">Start with a direction.</h2></div><p className="max-w-xs text-sm leading-6 text-[#697169]">From quiet editorial serifs to expressive display faces, there is a place to begin.</p></div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{categories.map((category, index) => { const count = fonts.filter((font: FontRecord) => font.category === category.key).length; return <div key={category.key} className={`group min-h-48 rounded-3xl p-6 transition-transform hover:-translate-y-1 ${index % 2 === 0 ? "bg-white" : "bg-[#dce8dc]"}`}><div className="flex items-start justify-between"><span className="text-3xl font-light">0{index + 1}</span><span className="text-xl opacity-50 transition-transform group-hover:translate-x-1">↗</span></div><p className="mt-14 text-lg font-semibold">{category.label}</p><p className="mt-1 text-sm text-[#697169]">{category.note}</p><p className="mt-5 text-xs uppercase tracking-wider text-[#889087]">{count} families</p></div>; })}</div>
        </section>

        <FontExplorer fonts={fonts} />
        <NativeBanner />

        <section id="vietnamese" className="pt-24">
          <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#78907c]">Vietnamese coverage</p><h2 className="mt-3 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">Made for every accent.</h2></div><span className="rounded-full border border-[#c9ccc1] px-4 py-2 text-sm text-[#697169]">{vietnameseFonts.length} typefaces</span></div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{featured.map((font: FontRecord) => <Link href={`/font/${font.slug}`} key={font.id} className="group rounded-3xl bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1d241f]/5"><div className="flex items-center justify-between"><span className="text-xs uppercase tracking-wider text-[#889087]">{categoryLabel(font.category)}</span><span className="text-[#78907c] opacity-0 transition-opacity group-hover:opacity-100">↗</span></div><p className="mt-12 truncate text-3xl font-medium tracking-[-0.05em]">{font.name}</p><p className="mt-5 truncate text-2xl text-[#5e7965]">Ăn ở ấm áp, ước mơ</p><div className="mt-8 flex justify-between border-t border-[#ecebe4] pt-4 text-xs text-[#889087]"><span>{font.license}</span><span>Preview font</span></div></Link>)}</div>
        </section>

        <footer className="mt-28 flex flex-col justify-between gap-4 border-t border-[#d8d7cc] pt-7 text-sm text-[#697169] sm:flex-row"><span>© 2026 Bliss Fonts</span><span>Thoughtful type, clearly catalogued.</span></footer>
      </section>
    </main>
  );
}
