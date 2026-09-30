"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CatalogFont } from "@/lib/catalog";
import type { Locale } from "@/lib/i18n";

type ExplorerFont = Pick<CatalogFont, "id" | "slug" | "name" | "designer" | "category" | "license" | "supportsVietnamese">;

export default function FontExplorer({ fonts: initialFonts, total: initialTotal, locale = "en" }: { fonts: ExplorerFont[]; total: number; locale?: Locale }) {
  const sample = locale === "vi" ? "Ăn ở ấm áp, ước mơ" : locale === "zh" ? "你好，世界" : locale === "fr" ? "Chaque idée mérite sa lettre." : "Every idea deserves type.";
  const [fonts, setFonts] = useState(initialFonts);
  const [total, setTotal] = useState(initialTotal);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [vietnameseOnly, setVietnameseOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams({ page: "1", limit: "24", category });
      if (query.trim()) params.set("q", query.trim());
      if (vietnameseOnly) params.set("vietnamese", "true");
      try {
        const response = await fetch(`/api/fonts?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Unable to load fonts");
        const data = await response.json();
        setFonts(data.fonts);
        setTotal(data.total);
        setPage(1);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setFonts([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [category, query, vietnameseOnly]);

  async function loadMore() {
    setLoading(true);
    const nextPage = page + 1;
    const params = new URLSearchParams({ page: String(nextPage), limit: "24", category });
    if (query.trim()) params.set("q", query.trim());
    if (vietnameseOnly) params.set("vietnamese", "true");
    try {
      const response = await fetch(`/api/fonts?${params}`);
      const data = await response.json();
      setFonts((current) => [...current, ...data.fonts]);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  }

  return <section className="pt-10 sm:pt-12" id="catalog">
    <header className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#526d58]">Live catalog</p><h2 className="mt-2 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">Find your type.</h2></div><p className="max-w-sm text-sm leading-6 text-[#626b63]">{total.toLocaleString("en-US")} matching families · preview before choosing.</p></header>
    <div data-reveal className="mt-7 rounded-2xl bg-[#1d241f] p-3 sm:p-4"><div className="flex flex-col gap-3 lg:flex-row"><label className="flex h-11 flex-1 items-center rounded-xl bg-white px-4 text-[#1d241f]"><span className="mr-3 text-[#526d58]" aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Search by font name or designer…" aria-label="Search fonts" /></label><select aria-label="Filter by style" value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-xl border border-white/15 bg-[#283129] px-4 text-sm text-white outline-none"><option className="bg-white text-[#1d241f]" value="ALL">All styles</option>{["SANS_SERIF", "SERIF", "DISPLAY", "HANDWRITING", "MONOSPACE"].map((item) => <option className="bg-white text-[#1d241f]" key={item} value={item}>{item.replace("_", " ")}</option>)}</select><button type="button" aria-pressed={vietnameseOnly} onClick={() => setVietnameseOnly(!vietnameseOnly)} className={`h-11 rounded-xl px-4 text-sm ${vietnameseOnly ? "bg-[#e7c4a6] text-[#3d3028]" : "border border-white/15 text-white"}`}>{vietnameseOnly ? "Vietnamese only ✓" : "Vietnamese ready"}</button></div></div>
    <div aria-busy={loading} className={`mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${loading ? "opacity-70" : ""}`}>{fonts.map((font) => <Link data-reveal href={`/font/${font.slug}`} key={font.id} className="group rounded-2xl border border-[#e6e4dc] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#b9c8ba] hover:shadow-lg hover:shadow-[#1d241f]/5"><div className="flex items-center justify-between"><span className="text-[11px] uppercase tracking-wider text-[#626b63]">{font.category?.replace("_", " ")}</span><span className="text-[#526d58]">↗</span></div><p className="mt-8 truncate text-2xl font-medium tracking-[-0.05em]">{font.name}</p><p className="mt-3 truncate text-lg text-[#526d58]">{font.supportsVietnamese ? "Ăn ở ấm áp, ước mơ" : sample}</p><div className="mt-6 flex justify-between border-t border-[#ecebe4] pt-3 text-xs text-[#626b63]"><span>{font.license}</span><span>Preview</span></div></Link>)}</div>
    {fonts.length < total && <div className="mt-7 text-center"><button disabled={loading} type="button" onClick={loadMore} className="rounded-full border border-[#c9ccc1] bg-white px-5 py-2.5 text-sm font-medium hover:bg-[#dce8dc] disabled:opacity-60">{loading ? "Loading…" : `Load more · ${(total - fonts.length).toLocaleString("en-US")} remaining`}</button></div>}
    {!loading && total === 0 && <div className="mt-5 rounded-2xl bg-white p-10 text-center text-[#626b63]">No typefaces match that search.</div>}
  </section>;
}
