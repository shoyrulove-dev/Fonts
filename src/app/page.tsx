import Image from "next/image";
import Link from "next/link";
import FontExplorer from "@/components/font-explorer";
import DynamicSpecimen from "@/components/dynamic-specimen";
import { NativeBanner } from "@/components/ad-units";
import { getPublicFonts, type CatalogFont } from "@/lib/catalog";
import woff2Manifest from "@/data/woff2-manifest.json";

const categories = [
  {
    key: "SANS_SERIF",
    slug: "sans_serif",
    label: "Sans Serif",
    note: "Clean and versatile",
  },
  {
    key: "SERIF",
    slug: "serif",
    label: "Serif",
    note: "Editorial and timeless",
  },
  {
    key: "DISPLAY",
    slug: "display",
    label: "Display",
    note: "Made to be noticed",
  },
  {
    key: "HANDWRITING",
    slug: "handwriting",
    label: "Handwriting",
    note: "Personal and expressive",
  },
  {
    key: "MONOSPACE",
    slug: "monospace",
    label: "Monospace",
    note: "For code and systems",
  },
];

const categoryLabel = (category: string | null) =>
  category?.replace("_", " ") ?? "Other";

export default async function Home() {
  const fonts = await getPublicFonts();
  const vietnameseArchive = fonts.filter(
    (font: CatalogFont) =>
      font.id.startsWith("vietnamese/") || Boolean(font.sourceGroup),
  );
  const internationalFonts = fonts.length - vietnameseArchive.length;
  const featured = vietnameseArchive.slice(0, 8);
  const explorerFonts = fonts.slice(0, 24).map(
    ({ id, slug, name, designer, category, license, supportsVietnamese }) => ({
      id,
      slug,
      name,
      designer,
      category,
      license,
      supportsVietnamese,
    }),
  );
  const availableSpecimens = fonts.flatMap((font) => {
    const files = font.files?.length
      ? font.files
      : (woff2Manifest[font.sourcePath as keyof typeof woff2Manifest] ?? []);
    return files.length
      ? [
          {
            slug: font.slug,
            name: font.name,
            license: font.license,
            file: files[0],
          },
        ]
      : [];
  });
  const specimenStep = Math.max(1, Math.floor(availableSpecimens.length / 72));
  const specimenFonts = availableSpecimens
    .filter((_, index) => index % specimenStep === 0)
    .slice(0, 72);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f4ee] text-[#1d241f]">
      <section className="relative mx-auto max-w-7xl px-5 pb-10 pt-5 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute -right-40 -top-48 h-[32rem] w-[32rem] rounded-full bg-[#dce8dc]/70 blur-3xl" />
        <nav className="relative flex items-center justify-between border-b border-[#d8d7cc] pb-4">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label="Bliss Fonts home"
          >
            <Image
              src="/icon.svg"
              alt="Bliss Fonts"
              width={34}
              height={34}
              priority
            />
            <span className="font-semibold tracking-[-0.03em]">
              Bliss Fonts
            </span>
          </Link>
          <div className="flex items-center gap-5 text-sm text-[#697169]">
            <a href="#explore" className="hidden hover:text-[#1d241f] sm:block">
              Explore
            </a>
            <Link
              href="/vietnamese"
              className="rounded-full bg-[#1d241f] px-4 py-2 text-white"
            >
              Vietnamese fonts
            </Link>
          </div>
        </nav>

        <div className="relative grid gap-9 py-14 lg:grid-cols-[1.12fr_.88fr] lg:items-center lg:py-20">
          <div data-reveal>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#5e7965]">
              Find your next typeface
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[0.94] tracking-[-0.065em] sm:text-6xl xl:text-[5.5rem]">
              <span className="block">Find a font</span>
              <span className="block">that feels right.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[#697169]">
              Preview, compare and download beautiful typefaces with clear
              license details.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#catalog"
                className="rounded-full bg-[#1d241f] px-5 py-2.5 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
              >
                Explore fonts <span className="ml-2">↘</span>
              </a>
              <a
                href="#explore"
                className="rounded-full border border-[#c9ccc1] bg-white/60 px-5 py-2.5 text-sm font-medium hover:bg-white"
              >
                Browse categories
              </a>
            </div>
            <p className="mt-5 text-sm text-[#889087]">
              International library · Clear licenses · Live preview
            </p>
          </div>
          <DynamicSpecimen fonts={specimenFonts} />
        </div>

        <div
          data-reveal
          className="grid gap-5 border-y border-[#d8d7cc] py-6 sm:grid-cols-3"
        >
          <div>
            <p className="text-3xl font-semibold tracking-[-0.05em]">
              {fonts.length.toLocaleString("en-US")}+
            </p>
            <p className="mt-1 text-sm text-[#697169]">font families indexed</p>
          </div>
          <div>
            <p className="text-3xl font-semibold tracking-[-0.05em]">
              {internationalFonts.toLocaleString("en-US")}
            </p>
            <p className="mt-1 text-sm text-[#697169]">
              international font families
            </p>
          </div>
          <div>
            <p className="text-3xl font-semibold tracking-[-0.05em]">
              {vietnameseArchive.length.toLocaleString("en-US")}
            </p>
            <p className="mt-1 text-sm text-[#697169]">
              Vietnamese archive additions
            </p>
          </div>
        </div>

        <section id="explore" className="pt-16">
          <header className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#78907c]">
                Browse by mood
              </p>
              <h2 className="mt-2 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
                Start with a direction.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[#697169]">
              Editorial serifs to bold display fonts.
            </p>
          </header>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {categories.map((category, index) => {
              const count = fonts.filter(
                (font: CatalogFont) => font.category === category.key,
              ).length;
              return (
                <Link
                  data-reveal
                  href={`/category/${category.slug}`}
                  key={category.key}
                  className={`group rounded-2xl p-5 transition-transform hover:-translate-y-0.5 ${index % 2 === 0 ? "bg-white" : "bg-[#dce8dc]"}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-2xl font-light">0{index + 1}</span>
                    <span className="opacity-50 transition-transform group-hover:translate-x-1">
                      ↗
                    </span>
                  </div>
                  <p className="mt-9 font-semibold">{category.label}</p>
                  <p className="mt-1 text-sm text-[#697169]">{category.note}</p>
                  <p className="mt-4 text-xs uppercase tracking-wider text-[#889087]">
                    {count} families
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <FontExplorer fonts={explorerFonts} total={fonts.length} />
        <NativeBanner />

        <section id="vietnamese" className="pt-16">
          <header className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#78907c]">
                Additional collection
              </p>
              <h2 className="mt-2 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
                Vietnamese archive.
              </h2>
            </div>
            <Link
              href="/vietnamese"
              className="rounded-full border border-[#c9ccc1] px-4 py-2 text-sm text-[#697169]"
            >
              View all {vietnameseArchive.length} →
            </Link>
          </header>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((font: CatalogFont) => (
              <Link
                data-reveal
                href={`/font/${font.slug}`}
                key={font.id}
                className="group rounded-2xl bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#1d241f]/5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-[#889087]">
                    {categoryLabel(font.category)}
                  </span>
                  <span className="text-[#78907c]">↗</span>
                </div>
                <p className="mt-8 truncate text-2xl font-medium tracking-[-0.05em]">
                  {font.name}
                </p>
                <p className="mt-3 truncate text-lg text-[#5e7965]">
                  Ăn ở ấm áp, ước mơ
                </p>
                <div className="mt-6 flex justify-between border-t border-[#ecebe4] pt-3 text-xs text-[#889087]">
                  <span>{font.license}</span>
                  <span>Preview</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <footer className="mt-16 flex flex-col justify-between gap-4 border-t border-[#d8d7cc] py-6 text-sm text-[#697169] sm:flex-row">
          <span>© 2026 Bliss Fonts</span>
          <span>Thoughtful type, clearly catalogued.</span>
        </footer>
      </section>
    </main>
  );
}
