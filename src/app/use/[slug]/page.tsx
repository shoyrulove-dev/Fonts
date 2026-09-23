import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicFonts } from "@/lib/catalog";
import { useCases } from "@/data/collections";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export function generateStaticParams() { return useCases.map((item) => ({ slug: item.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = useCases.find((entry) => entry.slug === slug);
  return item ? { title: `${item.title} — Bliss Fonts`, description: item.description, alternates: { canonical: `/use/${item.slug}` } } : {};
}

export default async function UseCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = useCases.find((entry) => entry.slug === slug);
  if (!item) notFound();
  const fonts = (await getPublicFonts()).filter((font) => (item.categories as readonly string[]).includes(font.category || "")).slice(0, 48);
  return <main className="min-h-screen bg-[#f6f4ee] text-[#1d241f]"><div className="mx-auto max-w-6xl px-6 py-8 sm:px-10 lg:py-12"><SiteHeader /><section className="mt-16 max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#78907c]">Curated collection</p><h1 className="mt-4 text-5xl font-semibold tracking-[-.06em] sm:text-7xl">{item.title}</h1><p className="mt-6 text-lg leading-8 text-[#697169]">{item.description}</p></section><div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{fonts.map((font) => <Link key={font.id} href={`/font/${font.slug}`} className="rounded-3xl bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1d241f]/5"><p className="text-xs uppercase tracking-wider text-[#889087]">{font.category?.replace("_", " ")}</p><p className="mt-12 truncate text-3xl font-medium tracking-[-.05em]">{font.name}</p><p className="mt-5 text-xs text-[#78907c]">{font.license}</p></Link>)}</div><SiteFooter /></div></main>;
}
