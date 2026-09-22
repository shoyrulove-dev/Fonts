import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import fonts from "@/data/google-fonts.json";
import woff2Manifest from "@/data/woff2-manifest.json";
import FontPreview from "@/components/font-preview";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

type FontRecord = (typeof fonts)[number];
function findFont(slug: string): FontRecord | undefined { return fonts.find((font: FontRecord) => font.slug === slug); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const font = findFont(slug);
  if (!font) return { title: "Font not found" };
  const category = font.category?.toLowerCase().replace("_", " ") ?? "typeface";
  return { title: `${font.name} — Bliss Fonts`, description: font.supportsVietnamese ? `${font.name} is a Vietnamese-ready ${category} typeface with a clear ${font.license} license.` : `${font.name} is a ${category} typeface with a clear ${font.license} license and live preview.`, alternates: { canonical: `/font/${font.slug}` } };
}

export default async function FontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const font = findFont(slug);
  if (!font) notFound();
  const related = fonts.filter((item: FontRecord) => item.category === font.category && item.id !== font.id).slice(0, 6);
  const sample = font.supportsVietnamese ? "Ăn ở ấm áp — Tiếng Việt đẹp cùng kiểu chữ này" : "Every idea deserves its own type.";
  const fontFiles = woff2Manifest[font.sourcePath as keyof typeof woff2Manifest] ?? [];
  return <main className="min-h-screen bg-[#f6f4ee] text-[#1d241f]"><div className="mx-auto max-w-6xl px-6 py-8 sm:px-10 lg:py-12"><SiteHeader backLabel="Back to collection" /><nav aria-label="Breadcrumb" className="mt-6 text-sm text-[#697169]"><Link href="/" className="hover:text-[#1d241f]">Bliss Fonts</Link><span className="mx-2" aria-hidden="true">/</span><span>{font.name}</span></nav><section className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]"><div className="rounded-[2rem] bg-white p-8 sm:p-12"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#78907c]">{font.supportsVietnamese ? "Vietnamese-ready typeface" : "Open typeface preview"}</p><h1 className="mt-5 text-5xl font-semibold tracking-[-0.07em] sm:text-7xl">{font.name}</h1><p className="mt-4 text-[#697169]">{font.designer || "Google Fonts"} · {font.category?.replace("_", " ")}</p><FontPreview files={fontFiles} sample={sample} /></div><aside className="h-fit rounded-[2rem] bg-[#dce8dc] p-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5e7965]">Typeface details</p><dl className="mt-7 space-y-5 text-sm"><div><dt className="text-[#607263]">License</dt><dd className="mt-1 font-medium">{font.license}</dd></div><div><dt className="text-[#607263]">Vietnamese support</dt><dd className="mt-1 font-medium">{font.supportsVietnamese ? "Confirmed" : "Not confirmed"}</dd></div><div><dt className="text-[#607263]">Source</dt><dd className="mt-1 font-medium">Google Fonts</dd></div></dl><a href={font.sourceUrl} target="_blank" rel="noreferrer" className="mt-8 block rounded-full bg-[#1d241f] px-5 py-3 text-center text-sm font-medium text-white">View official source ↗</a></aside></section><section className="mt-8 rounded-[2rem] bg-[#1d241f] p-7 text-[#f6f4ee] sm:p-9"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b5cbb6]">Font files</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Download the format you need.</h2></div><span className="text-sm text-[#b5cbb6]">{font.license} · source verified</span></div><p className="mt-3 max-w-2xl text-sm leading-6 text-[#b7c0b8]">Files are served from Cloudflare R2. Please review the original license before using a font in commercial work.</p><div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{fontFiles.length ? fontFiles.map((file) => { const filename = file.split("/").pop() ?? file; return <a key={file} href={`https://assets.blissbiovn.com/${file}`} download className="flex items-center justify-between rounded-2xl border border-white/15 px-4 py-3 text-sm transition-colors hover:bg-white/10"><span className="truncate pr-3">{filename}</span><span className="text-[#b5cbb6]">↓</span></a>; }) : <p className="text-sm text-[#b7c0b8]">Webfont files are not available yet.</p>}</div></section><section className="mt-16"><div className="flex items-end justify-between"><h2 className="text-2xl font-semibold tracking-tight">Related typefaces</h2><span className="text-sm text-[#697169]">{font.category?.replace("_", " ")}</span></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">{related.map((item: FontRecord) => <Link href={`/font/${item.slug}`} key={item.id} className="rounded-2xl border border-[#d8d7cc] bg-white p-4 transition-transform hover:-translate-y-1 hover:border-[#78907c]"><p className="font-medium">{item.name}</p><p className="mt-3 text-xs text-[#697169]">{item.supportsVietnamese ? "Vietnamese ready" : item.category?.replace("_", " ")}</p></Link>)}</div></section><SiteFooter /></div></main>;
}
