import type { Metadata } from "next";
import Link from "next/link";
import { getPublicFonts } from "@/lib/catalog";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata: Metadata = { title: "Vietnamese Fonts — Bliss Fonts", description: "Browse font families with confirmed Vietnamese character coverage.", alternates: { canonical: "/vietnamese" } };

export default async function VietnamesePage() {
  const fonts = (await getPublicFonts()).filter((font) => font.supportsVietnamese);
  return <main className="min-h-screen bg-[#f6f4ee] text-[#1d241f]"><div className="mx-auto max-w-6xl px-6 py-8 sm:px-10 lg:py-12"><SiteHeader /><section className="mt-16 max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#78907c]">Vietnamese collection</p><h1 className="mt-4 text-5xl font-semibold tracking-[-.06em] sm:text-7xl">Fonts with Vietnamese support.</h1><p className="mt-6 text-lg leading-8 text-[#697169]">Browse families verified for Vietnamese accents. Each download includes its license note.</p></section><div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{fonts.map((font) => <Link key={font.id} href={`/font/${font.slug}`} className="rounded-3xl bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1d241f]/5"><p className="text-xs uppercase tracking-wider text-[#889087]">{font.category?.replace("_", " ")}</p><p className="mt-12 truncate text-3xl font-medium tracking-[-.05em]">{font.name}</p><p className="mt-5 text-xl text-[#5e7965]">Ăn ở ấm áp</p></Link>)}</div><SiteFooter /></div></main>;
}
