import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { legalPages } from "@/data/collections";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

const content = {
  privacy: ["Bliss Fonts uses basic analytics to understand page visits, font previews and downloads. We do not sell personal information.", "Advertising partners may use their own cookies or similar technology. You can control cookies through your browser settings."],
  terms: ["Fonts remain subject to their original licenses. Downloading a file does not transfer ownership or grant rights beyond that license.", "Please do not redistribute downloaded font packages as your own collection or remove license information included with a font."],
  licenses: ["Every ZIP contains a short license note and links to the original source when available. Read the full license before commercial use.", "Fonts in the catalog may use OFL, Apache or other licenses. If a license is unclear, use the original source as the authority."],
} as const;

export function generateStaticParams() { return Object.keys(legalPages).map((page) => ({ page })); }

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const entry = legalPages[(await params).page as keyof typeof legalPages];
  return entry ? { title: `${entry.title} — Bliss Fonts`, description: entry.description, alternates: { canonical: `/legal/${(await params).page}` } } : {};
}

export default async function LegalPage({ params }: { params: Promise<{ page: string }> }) {
  const page = (await params).page as keyof typeof legalPages;
  const entry = legalPages[page];
  if (!entry) notFound();
  return <main className="min-h-screen bg-[#f6f4ee] text-[#1d241f]"><div className="mx-auto max-w-3xl px-6 py-8 sm:px-10 lg:py-10"><SiteHeader /><article className="mt-10 rounded-[2rem] bg-white p-8 sm:p-10"><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#78907c]">Bliss Fonts</p><h1 className="mt-4 text-5xl font-semibold tracking-[-.06em]">{entry.title}</h1><div className="mt-8 space-y-5 text-base leading-8 text-[#59625a]">{content[page].map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></article><SiteFooter /></div></main>;
}
