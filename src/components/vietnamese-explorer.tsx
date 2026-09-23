"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CatalogFont } from "@/lib/catalog";

export default function VietnameseExplorer({ fonts }: { fonts: CatalogFont[] }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("ALL");
  const [visible, setVisible] = useState(32);
  const groups = useMemo(() => ["ALL", ...Array.from(new Set(fonts.map((font) => font.sourceGroup || "Other"))).sort()], [fonts]);
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return fonts.filter((font) => (!needle || [font.name, font.designer, font.category, font.sourceGroup].join(" ").toLowerCase().includes(needle)) && (group === "ALL" || (font.sourceGroup || "Other") === group));
  }, [fonts, group, query]);

  function updateFilter(callback: () => void) { callback(); setVisible(32); }

  return <section className="mt-10" id="collection">
    <div data-reveal className="rounded-2xl bg-[#1d241f] p-3 sm:p-4">
      <div className="flex flex-col gap-3 md:flex-row">
        <label className="flex h-11 flex-1 items-center rounded-xl bg-white px-4">
          <span className="mr-3 text-[#78907c]" aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => updateFilter(() => setQuery(event.target.value))} className="w-full bg-transparent text-sm outline-none" placeholder="Search Vietnamese fonts…" aria-label="Search Vietnamese fonts" />
        </label>
        <select value={group} onChange={(event) => updateFilter(() => setGroup(event.target.value))} className="h-11 rounded-xl border border-white/15 bg-[#283129] px-4 text-sm text-white outline-none" aria-label="Filter by collection">
          {groups.map((item) => <option key={item} value={item}>{item === "ALL" ? "All collections" : item}</option>)}
        </select>
      </div>
    </div>
    <div className="mt-5 flex items-center justify-between text-sm text-[#697169]"><span>{results.length.toLocaleString("en-US")} fonts</span><span>{group === "ALL" ? "SFU · SVN · UTM · UVF · UVN · iCiel" : group}</span></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {results.slice(0, visible).map((font) => <Link data-reveal key={font.id} href={`/font/${font.slug}`} className="group rounded-2xl border border-[#e6e4dc] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#b9c8ba] hover:shadow-lg hover:shadow-[#1d241f]/5">
        <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-wider text-[#889087]"><span>{font.sourceGroup || "Vietnamese"}</span><span>{font.category?.replace("_", " ")}</span></div>
        <p className="mt-8 truncate text-2xl font-medium tracking-[-0.04em]">{font.name}</p>
        <p className="mt-3 truncate text-lg text-[#5e7965]">Ăn ở ấm áp, ước mơ</p>
        <div className="mt-6 flex items-center justify-between border-t border-[#ecebe4] pt-3 text-xs text-[#889087]"><span>{font.license}</span><span className="transition-transform group-hover:translate-x-0.5">View →</span></div>
      </Link>)}
    </div>
    {results.length > visible && <div className="mt-7 text-center"><button type="button" onClick={() => setVisible((count) => count + 32)} className="rounded-full border border-[#c9ccc1] bg-white px-5 py-2.5 text-sm font-medium transition hover:bg-[#dce8dc]">Load 32 more · {results.length - visible} remaining</button></div>}
    {!results.length && <div className="mt-5 rounded-2xl bg-white p-10 text-center text-sm text-[#697169]">No fonts match this search.</div>}
  </section>;
}
