import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import fonts from "@/data/google-fonts.json";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

type FontRecord = (typeof fonts)[number];
const categories = ["SANS_SERIF", "SERIF", "DISPLAY", "HANDWRITING", "MONOSPACE"];
const labels: Record<string, string> = { SANS_SERIF: "Sans Serif Fonts", SERIF: "Serif Fonts", DISPLAY: "Display Fonts", HANDWRITING: "Handwriting Fonts", MONOSPACE: "Monospace Fonts" };
function getCategory(value: string) { const key = value.toUpperCase(); return categories.includes(key) ? key : null; }
export function generateStaticParams() { return categories.map((category) => ({ category: category.toLowerCase() })); }
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> { const { category } = await params; const key = getCategory(category); if (!key) return { title: "Category not found" }; return { title: `${labels[key]} — Bliss Fonts`, description: `Browse ${labels[key].toLowerCase()} with live previews, clear licenses and Vietnamese coverage.` }; }

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params; const key = getCategory(category); if (!key) notFound();
  const collection = fonts.filter((font: FontRecord) => font.category === key);
  return <main className="min-h-screen bg-[#f6f4ee] text-[#1d241f]"><div className="mx-auto max-w-7xl px-6 py-8 sm:px-10 lg:px-16"><SiteHeader backLabel="Back to collection" /><nav aria-label="Breadcrumb" className="mt-6 text-sm text-[#697169]"><Link href="/" className="hover:text-[#1d241f]">Bliss Fonts</Link><span className="mx-2" aria-hidden="true">/</span><span>{labels[key]}</span></nav><header className="max-w-3xl py-20"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#78907c]">Browse by category</p><h1 className="mt-4 text-6xl font-semibold tracking-[-0.075em] sm:text-8xl">{labels[key]}</h1><p className="mt-7 text-lg leading-8 text-[#697169]">{collection.length} carefully indexed typefaces with live previews, clear source information and {collection.filter((font: FontRecord) => font.supportsVietnamese).length} Vietnamese-ready families.</p></header><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{collection.slice(0, 96).map((font: FontRecord) => <Link href={`/font/${font.slug}`} key={font.id} className="group rounded-3xl bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1d241f]/5"><p className="text-xs uppercase tracking-wider text-[#889087]">{font.supportsVietnamese ? "Vietnamese ready" : "Open typeface"}</p><p className="mt-12 truncate text-3xl font-medium tracking-[-0.05em]">{font.name}</p><p className="mt-5 truncate text-2xl text-[#5e7965]">{font.supportsVietnamese ? "Ăn ở ấm áp, ước mơ" : "Every idea deserves type."}</p><p className="mt-8 border-t border-[#ecebe4] pt-4 text-xs text-[#889087]">{font.license} · Preview ↗</p></Link>)}</div><SiteFooter /></div></main>;
}
