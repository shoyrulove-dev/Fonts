"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CatalogFont } from "@/lib/catalog";

type VietnameseFont = Pick<CatalogFont, "id" | "slug" | "name" | "designer" | "category" | "license" | "sourceGroup">;

export default function VietnameseExplorer({ fonts: initialFonts, total: initialTotal, groups }: { fonts: VietnameseFont[]; total: number; groups: string[] }) {
  const [fonts, setFonts] = useState(initialFonts);
  const [total, setTotal] = useState(initialTotal);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams({ collection: "vietnamese", page: "1", limit: "32", group });
      if (query.trim()) params.set("q", query.trim());
      try {
        const response = await fetch(`/api/fonts?${params}`, { signal: controller.signal });
        const data = await response.json();
        setFonts(data.fonts || []);
        setTotal(data.total || 0);
        setPage(1);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setFonts([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [group, query]);

  async function loadMore() {
    setLoading(true);
    const nextPage = page + 1;
    const params = new URLSearchParams({ collection: "vietnamese", page: String(nextPage), limit: "32", group });
    if (query.trim()) params.set("q", query.trim());
    try {
      const response = await fetch(`/api/fonts?${params}`);
      const data = await response.json();
      setFonts((current) => [...current, ...(data.fonts || [])]);
      setPage(nextPage);
    } finally { setLoading(false); }
  }

  return <section className="mt-10" id="collection">
    <div data-reveal className="rounded-2xl bg-[#1d241f] p-3 sm:p-4"><div className="flex flex-col gap-3 md:flex-row"><label className="flex h-11 flex-1 items-center rounded-xl bg-white px-4"><span className="mr-3 text-[#526d58]" aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Search Vietnamese fonts…" aria-label="Search Vietnamese fonts" /></label><select value={group} onChange={(event) => setGroup(event.target.value)} className="h-11 rounded-xl border border-white/15 bg-[#283129] px-4 text-sm text-white outline-none" aria-label="Filter by collection"><option value="ALL">All collections</option>{groups.map((item) => <option key={item} value={item}>{item}</option>)}</select></div></div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm text-[#626b63]"><span>{total.toLocaleString("en-US")} fonts</span><span>{group === "ALL" ? groups.join(" · ") : group}</span></div>
    <div aria-busy={loading} className={`mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${loading ? "opacity-70" : ""}`}>{fonts.map((font) => <Link data-reveal key={font.id} href={`/font/${font.slug}`} className="group rounded-2xl border border-[#e6e4dc] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#b9c8ba] hover:shadow-lg hover:shadow-[#1d241f]/5"><div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-wider text-[#626b63]"><span>{font.sourceGroup || "Vietnamese"}</span><span>{font.category?.replace("_", " ")}</span></div><p className="mt-8 truncate text-2xl font-medium tracking-[-0.04em]">{font.name}</p><p className="mt-3 truncate text-lg text-[#526d58]">Ăn ở ấm áp, ước mơ</p><div className="mt-6 flex items-center justify-between border-t border-[#ecebe4] pt-3 text-xs text-[#626b63]"><span>{font.license}</span><span className="transition-transform group-hover:translate-x-0.5">View →</span></div></Link>)}</div>
    {fonts.length < total && <div className="mt-7 text-center"><button disabled={loading} type="button" onClick={loadMore} className="rounded-full border border-[#c9ccc1] bg-white px-5 py-2.5 text-sm font-medium transition hover:bg-[#dce8dc] disabled:opacity-60">{loading ? "Loading…" : `Load 32 more · ${(total - fonts.length).toLocaleString("en-US")} remaining`}</button></div>}
    {!loading && total === 0 && <div className="mt-5 rounded-2xl bg-white p-10 text-center text-sm text-[#626b63]">No fonts match this search.</div>}
  </section>;
}
