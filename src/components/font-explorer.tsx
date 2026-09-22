"use client";

import Link from "next/link";
import { useState } from "react";
import fontData from "@/data/google-fonts.json";

type FontRecord = (typeof fontData)[number];

export default function FontExplorer({ fonts }: { fonts: FontRecord[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [vietnameseOnly, setVietnameseOnly] = useState(false);
  const categories = ["ALL", "SANS_SERIF", "SERIF", "DISPLAY", "HANDWRITING", "MONOSPACE"];
  const results = fonts.filter((font) => {
    const normalized = query.trim().toLowerCase();
    const matchesQuery = !normalized || [font.name, font.designer, font.category].join(" ").toLowerCase().includes(normalized);
    const matchesCategory = category === "ALL" || font.category === category;
    return matchesQuery && matchesCategory && (!vietnameseOnly || font.supportsVietnamese);
  });

  return (
    <section className="pt-24" id="catalog">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#78907c]">Live catalog</p><h2 className="mt-3 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">Find your type.</h2></div>
        <p className="max-w-xs text-sm leading-6 text-[#697169]">{results.length.toLocaleString("en-US")} matching families · preview each one before you choose.</p>
      </div>
      <div className="mt-8 rounded-[2rem] bg-[#1d241f] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          <label className="flex min-h-12 flex-1 items-center rounded-full bg-white px-5 text-[#1d241f]"><span className="mr-3 text-lg">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-[#8d968c]" placeholder="Search by font name or designer..." aria-label="Search fonts" /></label>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-12 rounded-full border border-white/20 bg-transparent px-5 text-sm text-white outline-none"><option className="text-[#1d241f]" value="ALL">All styles</option>{categories.slice(1).map((item) => <option className="text-[#1d241f]" key={item} value={item}>{item.replace("_", " ")}</option>)}</select>
          <button type="button" onClick={() => setVietnameseOnly(!vietnameseOnly)} className={`min-h-12 rounded-full px-5 text-sm transition-colors ${vietnameseOnly ? "bg-[#e7c4a6] text-[#3d3028]" : "border border-white/20 text-white"}`}>{vietnameseOnly ? "Vietnamese only ✓" : "Vietnamese ready"}</button>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{results.slice(0, 24).map((font) => <Link href={"/font/" + font.slug} key={font.id} className="group rounded-3xl bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1d241f]/5"><div className="flex items-center justify-between"><span className="text-xs uppercase tracking-wider text-[#889087]">{font.category?.replace("_", " ")}</span><span className="text-[#78907c] opacity-0 transition-opacity group-hover:opacity-100">↗</span></div><p className="mt-12 truncate text-3xl font-medium tracking-[-0.05em]">{font.name}</p><p className="mt-5 truncate text-2xl text-[#5e7965]">{font.supportsVietnamese ? "Ăn ở ấm áp, ước mơ" : "Every idea deserves type."}</p><div className="mt-8 flex justify-between border-t border-[#ecebe4] pt-4 text-xs text-[#889087]"><span>{font.license}</span><span>Open preview</span></div></Link>)}</div>
      {results.length > 24 && <p className="mt-8 text-center text-sm text-[#697169]">Showing 24 of {results.length.toLocaleString("en-US")} families. Refine your search to explore more.</p>}
      {results.length === 0 && <div className="rounded-3xl bg-white p-12 text-center text-[#697169]">No typefaces match that search yet.</div>}
    </section>
  );
}
