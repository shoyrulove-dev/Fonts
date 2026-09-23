"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CatalogFont } from "@/lib/catalog";

type ExplorerFont = Pick<CatalogFont, "id" | "slug" | "name" | "designer" | "category" | "license" | "supportsVietnamese">;

export default function FontExplorer({ fonts }: { fonts: ExplorerFont[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [vietnameseOnly, setVietnameseOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return fonts.filter((font) => (!needle || [font.name, font.designer, font.category].join(" ").toLowerCase().includes(needle)) && (category === "ALL" || font.category === category) && (!vietnameseOnly || font.supportsVietnamese));
  }, [category, fonts, query, vietnameseOnly]);
  const resetCount = () => setVisibleCount(24);

  return <section className="pt-16" id="catalog">
    <header className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#78907c]">Live catalog</p><h2 className="mt-2 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">Find your type.</h2></div><p className="max-w-sm text-sm leading-6 text-[#697169]">{results.length.toLocaleString("en-US")} fonts ready to preview.</p></header>
    <div data-reveal className="mt-7 rounded-2xl bg-[#1d241f] p-3 sm:p-4"><div className="flex flex-col gap-3 lg:flex-row"><label className="flex h-11 flex-1 items-center rounded-xl bg-white px-4 text-[#1d241f]"><span className="mr-3 text-[#78907c]" aria-hidden="true">⌕</span><input value={query} onChange={(event) => { setQuery(event.target.value); resetCount(); }} className="w-full bg-transparent text-sm outline-none" placeholder="Search by font name or designer…" aria-label="Search fonts" /></label><select value={category} onChange={(event) => { setCategory(event.target.value); resetCount(); }} className="h-11 rounded-xl border border-white/15 bg-[#283129] px-4 text-sm text-white outline-none"><option className="text-[#1d241f]" value="ALL">All styles</option>{["SANS_SERIF", "SERIF", "DISPLAY", "HANDWRITING", "MONOSPACE"].map((item) => <option className="text-[#1d241f]" key={item} value={item}>{item.replace("_", " ")}</option>)}</select><button type="button" onClick={() => { setVietnameseOnly(!vietnameseOnly); resetCount(); }} className={`h-11 rounded-xl px-4 text-sm ${vietnameseOnly ? "bg-[#e7c4a6] text-[#3d3028]" : "border border-white/15 text-white"}`}>{vietnameseOnly ? "Vietnamese only ✓" : "Vietnamese ready"}</button></div></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{results.slice(0, visibleCount).map((font) => <Link data-reveal href={`/font/${font.slug}`} key={font.id} className="group rounded-2xl border border-[#e6e4dc] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#b9c8ba] hover:shadow-lg hover:shadow-[#1d241f]/5"><div className="flex items-center justify-between"><span className="text-[11px] uppercase tracking-wider text-[#889087]">{font.category?.replace("_", " ")}</span><span className="text-[#78907c]">↗</span></div><p className="mt-8 truncate text-2xl font-medium tracking-[-0.05em]">{font.name}</p><p className="mt-3 truncate text-lg text-[#5e7965]">{font.supportsVietnamese ? "Ăn ở ấm áp, ước mơ" : "Every idea deserves type."}</p><div className="mt-6 flex justify-between border-t border-[#ecebe4] pt-3 text-xs text-[#889087]"><span>{font.license}</span><span>Preview</span></div></Link>)}</div>
    {results.length > visibleCount && <div className="mt-7 text-center"><button type="button" onClick={() => setVisibleCount((count) => count + 24)} className="rounded-full border border-[#c9ccc1] bg-white px-5 py-2.5 text-sm font-medium hover:bg-[#dce8dc]">Load more · {results.length - visibleCount} remaining</button></div>}
    {results.length === 0 && <div className="mt-5 rounded-2xl bg-white p-10 text-center text-[#697169]">No typefaces match that search.</div>}
  </section>;
}
